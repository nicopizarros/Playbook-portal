#!/usr/bin/env python3
"""
Builds docs/metricas-website-playbook.xlsx — the CEO metrics dashboard.

WHY STDLIB AND NOT openpyxl: PyPI's files.pythonhosted.org stalls on this
machine (documented in CLAUDE.md; both `pip install` and `uv pip install`
timed out on 2026-08-25). An .xlsx is a ZIP of OOXML parts, so the whole
workbook is written here with zipfile + string templates. No dependencies,
no network, and total control over the two things the brief requires and
most libraries make awkward: NATIVE charts, and formulas over NAMED RANGES.

WHAT IS REAL AND WHAT IS NOT — the only rule that matters in this file:
  * Datos_Portal is queried live from POSTGRES_URL. Every number there is real.
  * Datos_GA4 ships EMPTY, with only the exact export headers. There are no
    GA4 credentials on this machine (the four GA4_* keys exist in .env.local
    and are all zero-length), so any traffic number here would be invented.
    The sheet is a paste target, not a data source.
  * Rows that are illustrative are filled amber and say EJEMPLO in column A.

Regenerate:  POSTGRES_URL=... python3 scripts/build-metrics-dashboard.py
"""
import os
import re
import subprocess
import zipfile
from datetime import date

OUT = "docs/metricas-website-playbook.xlsx"

# --------------------------------------------------------------- DB access
# psql rather than a driver: same reason as above, no importable pg client.


def q(sql: str):
    url = os.environ.get("POSTGRES_URL")
    if not url:
        raise SystemExit("POSTGRES_URL no está definido. Ver .env.local.")
    out = subprocess.run(
        ["psql", url, "-tAF|", "-c", sql],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return [line.split("|") for line in out.splitlines() if line]


# --------------------------------------------------------------- XML utils

def esc(v):
    return (str(v).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def col_letter(n):
    s = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


# Cell styles, indexes into styles.xml's cellXfs below.
S_DEFAULT, S_TITLE, S_HEAD, S_KPI, S_EJEMPLO, S_NOTE, S_SUB, S_PCT = range(8)


def cell(ref, value, style=S_DEFAULT):
    """A single cell. Formulas start with '='. Numbers are numeric."""
    if value is None or value == "":
        return f'<c r="{ref}" s="{style}"/>'
    if isinstance(value, str) and value.startswith("="):
        return f'<c r="{ref}" s="{style}"><f>{esc(value[1:])}</f></c>'
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f'<c r="{ref}" s="{style}"><v>{value}</v></c>'
    return (f'<c r="{ref}" s="{style}" t="inlineStr">'
            f'<is><t xml:space="preserve">{esc(value)}</t></is></c>')


def sheet_xml(rows, widths=None, drawing_rid=None, freeze=None):
    """rows: list of lists of (value, style) or plain values."""
    out = []
    for ri, row in enumerate(rows, start=1):
        cells = []
        for ci, item in enumerate(row, start=1):
            val, st = item if isinstance(item, tuple) else (item, S_DEFAULT)
            if val is None or val == "":
                continue
            cells.append(cell(f"{col_letter(ci)}{ri}", val, st))
        if cells:
            out.append(f'<row r="{ri}">{"".join(cells)}</row>')
    cols = ""
    if widths:
        cols = "<cols>" + "".join(
            f'<col min="{i}" max="{i}" width="{w}" customWidth="1"/>'
            for i, w in enumerate(widths, start=1)) + "</cols>"
    pane = ""
    if freeze:
        pane = (f'<sheetViews><sheetView workbookViewId="0">'
                f'<pane ySplit="{freeze}" topLeftCell="A{freeze+1}" '
                f'activePane="bottomLeft" state="frozen"/>'
                f'</sheetView></sheetViews>')
    else:
        pane = '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
    draw = f'<drawing r:id="{drawing_rid}"/>' if drawing_rid else ""
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            f'{pane}{cols}<sheetData>{"".join(out)}</sheetData>{draw}</worksheet>')


# ---------------------------------------------------------------- Charts
# Native <c:chart>. The brief's rule — "cero valores hardcodeados dentro de
# gráficas" — is why every series points at a sheet RANGE (c:f) and carries no
# <c:numCache> literals: Excel resolves the values from the cells, so pasting a
# new export updates the chart with no edit to the chart itself.

def chart_xml(kind, title, cat_ref, series, y_title=""):
    """kind: 'bar' | 'line'. series: [(name_ref, val_ref, hex)]"""
    ser = []
    for i, (name_ref, val_ref, colour) in enumerate(series):
        ser.append(f"""<c:ser><c:idx val="{i}"/><c:order val="{i}"/>
<c:tx><c:strRef><c:f>{esc(name_ref)}</c:f></c:strRef></c:tx>
<c:spPr><a:solidFill><a:srgbClr val="{colour}"/></a:solidFill>
{'<a:ln w="28575"><a:solidFill><a:srgbClr val="%s"/></a:solidFill></a:ln>' % colour if kind == 'line' else ''}
</c:spPr>
{'<c:marker><c:symbol val="circle"/><c:size val="5"/></c:marker>' if kind == 'line' else ''}
<c:cat><c:strRef><c:f>{esc(cat_ref)}</c:f></c:strRef></c:cat>
<c:val><c:numRef><c:f>{esc(val_ref)}</c:f></c:numRef></c:val>
{'<c:smooth val="0"/>' if kind == 'line' else ''}
</c:ser>""")
    body = ("<c:barChart><c:barDir val=\"col\"/><c:grouping val=\"clustered\"/>"
            "<c:varyColors val=\"0\"/>" + "".join(ser) +
            "<c:gapWidth val=\"60\"/><c:axId val=\"111\"/><c:axId val=\"222\"/></c:barChart>"
            ) if kind == "bar" else (
            "<c:lineChart><c:grouping val=\"standard\"/><c:varyColors val=\"0\"/>"
            + "".join(ser) +
            "<c:marker val=\"1\"/><c:axId val=\"111\"/><c:axId val=\"222\"/></c:lineChart>")
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<c:chart>
<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:pPr><a:defRPr sz="1100" b="1"/></a:pPr>
<a:r><a:rPr lang="es-MX" sz="1100" b="1"/><a:t>{esc(title)}</a:t></a:r></a:p></c:rich></c:tx>
<c:overlay val="0"/></c:title>
<c:autoTitleDeleted val="0"/>
<c:plotArea><c:layout/>{body}
<c:catAx><c:axId val="111"/><c:scaling><c:orientation val="minMax"/></c:scaling>
<c:delete val="0"/><c:axPos val="b"/><c:crossAx val="222"/></c:catAx>
<c:valAx><c:axId val="222"/><c:scaling><c:orientation val="minMax"/></c:scaling>
<c:delete val="0"/><c:axPos val="l"/>
<c:majorGridlines/>
{f'<c:title><c:tx><c:rich><a:bodyPr rot="-5400000" vert="horz"/><a:p><a:r><a:rPr lang="es-MX" sz="900"/><a:t>{esc(y_title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>' if y_title else ''}
<c:crossAx val="111"/></c:valAx>
</c:plotArea>
<c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>
<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/>
</c:chart></c:chartSpace>"""


def drawing_xml(anchors):
    """anchors: [(from_col, from_row, to_col, to_row, rid, name)]"""
    parts = []
    for i, (fc, fr, tc, tr, rid, name) in enumerate(anchors, start=1):
        parts.append(f"""<xdr:twoCellAnchor>
<xdr:from><xdr:col>{fc}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>{fr}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
<xdr:to><xdr:col>{tc}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>{tr}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr>
<xdr:cNvPr id="{i+1}" name="{esc(name)}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="{rid}"/>
</a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>""")
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" '
            'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            + "".join(parts) + "</xdr:wsDr>")


STYLES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="0.0%"/></numFmts>
<fonts count="7">
<font><sz val="11"/><name val="Calibri"/></font>
<font><sz val="18"/><b/><color rgb="FF111111"/><name val="Calibri"/></font>
<font><sz val="11"/><b/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><sz val="20"/><b/><color rgb="FF1A7F37"/><name val="Calibri"/></font>
<font><sz val="11"/><color rgb="FF7A4E00"/><name val="Calibri"/></font>
<font><sz val="10"/><i/><color rgb="FF666666"/><name val="Calibri"/></font>
<font><sz val="12"/><b/><color rgb="FF111111"/><name val="Calibri"/></font>
</fonts>
<fills count="5">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F3A2E"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFE9B0"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF2F4F3"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="thin"><color rgb="FFCCCCCC"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="4" fillId="3" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>'''


# ============================================================ REAL PORTAL DATA
print("Consultando el portal…")

vol = q("""select substring(date,1,7), source, count(*) from articles
           where status='published' group by 1,2 order by 1,2""")
months = sorted({r[0] for r in vol})
sources = sorted({r[1] for r in vol})
volmap = {(r[0], r[1]): int(r[2]) for r in vol}

quality = q("""select substring(date,1,7), count(*), round(avg(score)::numeric,1),
               count(*) filter (where score>=70), round(avg(reading_time)::numeric,1),
               count(distinct date)
               from articles where status='published' and score is not null
               group by 1 order by 1""")

decena = q("""select (score/10)*10, count(*) from articles
              where status='published' and score is not null group by 1 order by 1""")

authors = q("""select coalesce(nullif(author,''),'(sin autor)'), count(*) from articles
               where status='published' group by 1 order by 2 desc limit 10""")

tagcov = q("""select count(*) filter (where cardinality(tags_scope)>0),
                     count(*) filter (where cardinality(tags_sport)>0),
                     count(*) filter (where cardinality(tags_vertical)>0),
                     count(*) filter (where cardinality(tags_property)>0),
                     count(*) from articles where status='published'""")[0]

reads = q("""select to_char(read_at,'YYYY-MM'), count(*),
             count(distinct coalesce(reader_id::text, anon_id::text))
             from article_reads group by 1 order by 1""")

recur = q("""with r as (select coalesce(reader_id::text,anon_id::text) k, count(*) n,
             count(distinct to_char(read_at,'YYYY-MM')) m from article_reads group by 1)
             select count(*), count(*) filter (where n>1), count(*) filter (where m>1) from r""")[0]

toparts = q("""select a.id, count(*) from article_reads r join articles a on a.id=r.article_id
               group by 1 order by 2 desc limit 10""")

TODAY = date.today().isoformat()
PENDIENTE = "PENDIENTE DE INSTRUMENTACIÓN"

# ============================================================== SHEET: Portal
dp = [
    [("Datos_Portal — consultado en vivo desde la base del portal", S_TITLE)],
    [(f"Generado {TODAY}. Todo en esta hoja es real. Para refrescar: "
      "POSTGRES_URL=… python3 scripts/build-metrics-dashboard.py", S_NOTE)],
    [],
    [("PUBLICACIÓN POR PRODUCTO Y MES", S_SUB)],
    [("Mes", S_HEAD)] + [(s, S_HEAD) for s in sources] + [("Total", S_HEAD)],
]
vol_first = len(dp) + 1
for m in months:
    dp.append([m] + [volmap.get((m, s), 0) for s in sources]
              + [f"=SUM(B{len(dp)+1}:{col_letter(1+len(sources))}{len(dp)+1})"])
vol_last = len(dp)

dp += [[], [("CALIDAD Y CADENCIA POR MES", S_SUB)],
       [("Mes", S_HEAD), ("Notas", S_HEAD), ("Score promedio", S_HEAD),
        ("Notas ≥70", S_HEAD), ("Lectura prom. (min)", S_HEAD),
        ("Días con publicación", S_HEAD), ("Notas por día activo", S_HEAD)]]
qual_first = len(dp) + 1
for r in quality:
    n = len(dp) + 1
    dp.append([r[0], int(r[1]), float(r[2]), int(r[3]), float(r[4]), int(r[5]),
               f"=IFERROR(B{n}/F{n},\"\")"])
qual_last = len(dp)

dp += [[], [("DISTRIBUCIÓN DE SCORES (boleta 0–99)", S_SUB)],
       [("Decena", S_HEAD), ("Notas", S_HEAD), ("% del archivo", S_HEAD)]]
dec_first = len(dp) + 1
total_scored = sum(int(r[1]) for r in decena)
for r in decena:
    n = len(dp) + 1
    dp.append([f"{r[0]}–{int(r[0])+9}", int(r[1]), (f"=IFERROR(B{n}/{total_scored},0)", S_PCT)])
dec_last = len(dp)

dp += [[], [("LECTURAS PROPIAS (article_reads — dato de primera parte)", S_SUB)],
       [("Mes", S_HEAD), ("Lecturas", S_HEAD), ("Lectores únicos", S_HEAD),
        ("Lecturas por lector", S_HEAD)]]
reads_first = len(dp) + 1
for r in reads:
    n = len(dp) + 1
    dp.append([r[0], int(r[1]), int(r[2]), f"=IFERROR(B{n}/C{n},\"\")"])
reads_last = len(dp)

# Captured now, not derived from len(dp) later: more blocks get appended
# below and the index would silently drift onto an unrelated row.
recur_row = len(dp) + 4
dp += [[], [("RECURRENCIA DE LECTORES", S_SUB)],
       [("Lectores totales", S_HEAD), ("Con más de una lectura", S_HEAD),
        ("Activos en más de un mes", S_HEAD), ("% recurrente", S_HEAD)],
       [int(recur[0]), int(recur[1]), int(recur[2]),
        (f"=IFERROR(B{recur_row}/A{recur_row},0)", S_PCT)],
       [("Nota: la identidad anónima vive en una cookie firmada de 2 años "
         "(middleware.ts) y los bots quedan fuera antes de registrarse la lectura, "
         "así que la recurrencia no es un artefacto de sesión. Subestima al lector "
         "que cambia de dispositivo, navega en incógnito o borra cookies.", S_NOTE)]]

dp += [[], [("COBERTURA DE TAGS", S_SUB)],
       [("Campo", S_HEAD), ("Notas con el tag", S_HEAD), ("Total", S_HEAD), ("Cobertura", S_HEAD)]]
for label, val in [("tags_scope", tagcov[0]), ("tags_sport", tagcov[1]),
                   ("tags_vertical", tagcov[2]), ("tags_property (hubs)", tagcov[3])]:
    n = len(dp) + 1
    dp.append([label, int(val), int(tagcov[4]), (f"=IFERROR(B{n}/C{n},0)", S_PCT)])

dp += [[], [("ARTÍCULOS POR AUTOR", S_SUB)], [("Autor", S_HEAD), ("Notas", S_HEAD)]]
for r in authors:
    dp.append([r[0][:70], int(r[1])])

dp += [[], [("TOP 10 ARTÍCULOS POR LECTURAS PROPIAS", S_SUB)],
       [("Artículo", S_HEAD), ("Lecturas", S_HEAD)]]
for r in toparts:
    dp.append([r[0][:80], int(r[1])])


# ================================================================ SHEET: GA4
# Deliberately EMPTY below the headers. The headers are the exact column names
# GA4's CSV export produces, so "actualizar" is literally paste-into-A6.
GA4_BLOCKS = [
    ("RESUMEN MENSUAL — Informes › Adquisición › Visión general (exportar CSV)",
     ["Mes", "Usuarios activos", "Usuarios nuevos", "Usuarios recurrentes",
      "Sesiones", "Vistas de página", "Duración media de sesión (s)",
      "Tasa de interacción"], "GA4_Resumen"),
    ("CANALES — Informes › Adquisición › Adquisición de tráfico",
     ["Mes", "Canal predeterminado", "Sesiones", "Usuarios activos",
      "Vistas de página", "Tasa de interacción"], "GA4_Canales"),
    ("PÁGINAS — Informes › Interacción › Páginas y pantallas",
     ["Mes", "Ruta de página", "Vistas", "Usuarios activos",
      "Tiempo medio de interacción (s)"], "GA4_Paginas"),
    ("DISPOSITIVOS — Informes › Tecnología › Detalles de tecnología",
     ["Mes", "Categoría de dispositivo", "Usuarios activos", "Sesiones",
      "Tasa de interacción"], "GA4_Dispositivos"),
    ("NEWSLETTER — Explorar › Exploración libre, evento de suscripción",
     ["Mes", "Nombre de evento", "Recuento de eventos", "Usuarios activos",
      "Sesiones con el evento"], "GA4_Newsletter"),
]
dg = [[("Datos_GA4 — hoja destino. Pegar aquí el export, sin reformatear.", S_TITLE)],
      [(f"VACÍA A PROPÓSITO. Esta máquina no tiene credenciales de GA4 "
        f"(las cuatro claves GA4_* existen en .env.local y están en blanco), "
        f"así que cualquier cifra aquí sería inventada. Los encabezados son los "
        f"exactos del export de GA4 {os.environ.get('GA4_MEASUREMENT_ID','G-KVE4HF75TF')}. "
        f"Ruta de clics por reporte: docs/metricas-website-runbook.md.", S_NOTE)], []]
ga4_ranges = {}
for title, headers, name in GA4_BLOCKS:
    dg.append([(title, S_SUB)])
    dg.append([(h, S_HEAD) for h in headers])
    hdr_row = len(dg)
    # 36 empty rows per block: three years of monthly pasting before anyone
    # has to insert rows, which is the thing that breaks named ranges.
    ga4_ranges[name] = (hdr_row + 1, hdr_row + 36, len(headers))
    dg += [[] for _ in range(36)]
    dg.append([])

# ============================================================ SHEET: Resumen
KPIS = [
    ("Notas publicadas", f"=SUM(Datos_Portal!B{qual_first}:B{qual_last})",
     f"=INDEX(Datos_Portal!B{qual_first}:B{qual_last},COUNT(Datos_Portal!B{qual_first}:B{qual_last}))",
     f"=INDEX(Datos_Portal!B{qual_first}:B{qual_last},COUNT(Datos_Portal!B{qual_first}:B{qual_last})-1)"),
    ("Score promedio", f"=IFERROR(AVERAGE(Datos_Portal!C{qual_first}:C{qual_last}),\"\")",
     f"=INDEX(Datos_Portal!C{qual_first}:C{qual_last},COUNT(Datos_Portal!C{qual_first}:C{qual_last}))",
     f"=INDEX(Datos_Portal!C{qual_first}:C{qual_last},COUNT(Datos_Portal!C{qual_first}:C{qual_last})-1)"),
    ("Notas ≥70 (portada fuerte)", f"=SUM(Datos_Portal!D{qual_first}:D{qual_last})",
     f"=INDEX(Datos_Portal!D{qual_first}:D{qual_last},COUNT(Datos_Portal!D{qual_first}:D{qual_last}))",
     f"=INDEX(Datos_Portal!D{qual_first}:D{qual_last},COUNT(Datos_Portal!D{qual_first}:D{qual_last})-1)"),
    ("Lecturas propias", f"=SUM(Datos_Portal!B{reads_first}:B{reads_last})",
     f"=INDEX(Datos_Portal!B{reads_first}:B{reads_last},COUNT(Datos_Portal!B{reads_first}:B{reads_last}))",
     f"=INDEX(Datos_Portal!B{reads_first}:B{reads_last},COUNT(Datos_Portal!B{reads_first}:B{reads_last})-1)"),
    ("Lectores únicos", f"=SUM(Datos_Portal!C{reads_first}:C{reads_last})",
     f"=INDEX(Datos_Portal!C{reads_first}:C{reads_last},COUNT(Datos_Portal!C{reads_first}:C{reads_last}))",
     f"=INDEX(Datos_Portal!C{reads_first}:C{reads_last},COUNT(Datos_Portal!C{reads_first}:C{reads_last})-1)"),
]
rs = [[("Playbook — Métricas del website", S_TITLE)],
      [(f"Propuesta de dashboard · generado {TODAY} · GA4 {os.environ.get('GA4_MEASUREMENT_ID','G-KVE4HF75TF')}", S_NOTE)],
      [],
      [("LO QUE YA SE PUEDE MEDIR HOY (dato propio del portal)", S_SUB)],
      [("KPI", S_HEAD), ("Acumulado", S_HEAD), ("Último mes", S_HEAD),
       ("Mes anterior", S_HEAD), ("Δ", S_HEAD), ("Tendencia", S_HEAD)]]
kpi_first = len(rs) + 1
for name, total, last, prev in KPIS:
    n = len(rs) + 1
    rs.append([name, total, last, prev,
               f"=IFERROR(C{n}-D{n},\"\")",
               f"=IF(N(E{n})>0,\"▲ sube\",IF(N(E{n})<0,\"▼ baja\",\"= igual\"))"])
kpi_last = len(rs)

rs += [[],
       [("RECURRENCIA Y RECIRCULACIÓN — las dos métricas ancla del área", S_SUB)],
       [("Métrica", S_HEAD), ("Valor", S_HEAD), ("Lectura", S_HEAD)],
       ["Lecturas por lector",
        f"=IFERROR(SUM(Datos_Portal!B{reads_first}:B{reads_last})/SUM(Datos_Portal!C{reads_first}:C{reads_last}),\"\")",
        "Proxy de recirculación. 1.00 = nadie lee una segunda nota."],
       ["% de lectores recurrentes",
        (f"=IFERROR(Datos_Portal!B{recur_row}/Datos_Portal!A{recur_row},\"\")", S_PCT),
        "Lectores con más de una lectura registrada."],
       [("Ambas salen de article_reads, no de GA4: son dato de primera parte y "
         "no dependen de consentimiento de cookies de terceros.", S_NOTE)],
       [],
       [("LO QUE FALTA INSTRUMENTAR", S_SUB)],
       [("Métrica", S_HEAD), ("Estado", S_HEAD), ("Qué falta", S_HEAD)],
       ["Usuarios, sesiones, vistas", PENDIENTE, "Pegar el export de GA4 en Datos_GA4 (ver Instrucciones)."],
       ["Canales de adquisición", PENDIENTE, "Pegar el export de GA4 en Datos_GA4."],
       ["Mobile vs desktop", PENDIENTE, "Pegar el export de GA4 en Datos_GA4."],
       ["Conversión website → newsletter", PENDIENTE,
        "No existe evento de suscripción en GA4 ni tabla de suscriptores en el portal: "
        "los suscriptores viven en Substack. Hay que (a) disparar un evento GA4 en el alta y "
        "(b) exportar el total de Substack cada mes."],
       ["Tiempo de lectura real", PENDIENTE,
        "El portal guarda reading_time ESTIMADO, no medido. El medido sale de GA4."]]


# ==================================================== SHEETS: análisis por área
EJ = ("EJEMPLO", S_EJEMPLO)

traf = [[("Tráfico", S_TITLE)],
        [("Todo aquí se alimenta de Datos_GA4. Mientras esa hoja esté vacía las "
          "fórmulas devuelven 0 — eso es correcto, no un error: significa que "
          "todavía nadie ha pegado el export.", S_NOTE)], [],
        [("Mes", S_HEAD), ("Usuarios activos", S_HEAD), ("Sesiones", S_HEAD),
         ("Vistas", S_HEAD), ("Sesiones por usuario", S_HEAD), ("Vistas por sesión", S_HEAD)]]
g = ga4_ranges["GA4_Resumen"]
for i in range(12):
    r = len(traf) + 1
    traf.append([f"=IFERROR(INDEX(GA4_Resumen_Mes,{i+1}),\"\")",
                 f"=IFERROR(INDEX(GA4_Resumen_Usuarios,{i+1}),0)",
                 f"=IFERROR(INDEX(GA4_Resumen_Sesiones,{i+1}),0)",
                 f"=IFERROR(INDEX(GA4_Resumen_Vistas,{i+1}),0)",
                 f"=IFERROR(C{r}/B{r},\"\")", f"=IFERROR(D{r}/C{r},\"\")"])
traf_first, traf_last = 5, len(traf)
traf += [[], [("Fila de referencia — cómo se ve una fila con datos:", S_NOTE)],
         [EJ[0], "EJEMPLO 12,000", "EJEMPLO 15,000", "EJEMPLO 22,000", "1.25", "1.47"]]
for i in range(len(traf[-1])):
    traf[-1][i] = (traf[-1][i], S_EJEMPLO)

cont = [[("Contenido", S_TITLE)],
        [("Volumen, calidad y cadencia editorial. Dato propio: real desde hoy.", S_NOTE)], [],
        [("Mes", S_HEAD), ("Notas", S_HEAD), ("Score promedio", S_HEAD),
         ("Notas ≥70", S_HEAD), ("% ≥70", S_HEAD), ("Notas por día activo", S_HEAD)]]
cont_first = len(cont) + 1
for i, r in enumerate(quality):
    n = len(cont) + 1
    cont.append([f"=Datos_Portal!A{qual_first+i}", f"=Datos_Portal!B{qual_first+i}",
                 f"=Datos_Portal!C{qual_first+i}", f"=Datos_Portal!D{qual_first+i}",
                 (f"=IFERROR(D{n}/B{n},0)", S_PCT), f"=Datos_Portal!G{qual_first+i}"])
cont_last = len(cont)

aud = [[("Audiencia", S_TITLE)],
       [("Lectores propios y recurrencia. Sale de article_reads, no de GA4.", S_NOTE)], [],
       [("Mes", S_HEAD), ("Lecturas", S_HEAD), ("Lectores únicos", S_HEAD),
        ("Lecturas por lector", S_HEAD)]]
aud_first = len(aud) + 1
for i, r in enumerate(reads):
    n = len(aud) + 1
    aud.append([f"=Datos_Portal!A{reads_first+i}", f"=Datos_Portal!B{reads_first+i}",
                f"=Datos_Portal!C{reads_first+i}", f"=IFERROR(C{n}>0,\"\")" and f"=IFERROR(B{n}/C{n},\"\")"])
aud_last = len(aud)
aud += [[], [("MOBILE VS DESKTOP — pendiente de GA4", S_SUB)],
        [("Dispositivo", S_HEAD), ("Usuarios", S_HEAD), ("% del total", S_HEAD)]]
dev_first = len(aud) + 1
for i in range(4):
    n = len(aud) + 1
    aud.append([f"=IFERROR(INDEX(GA4_Disp_Categoria,{i+1}),\"\")",
                f"=IFERROR(INDEX(GA4_Disp_Usuarios,{i+1}),0)",
                (f"=IFERROR(B{n}/SUM($B${dev_first}:$B${dev_first+3}),0)", S_PCT)])
dev_last = len(aud)

news = [[("Newsletter", S_TITLE)],
        [(f"{PENDIENTE}. Los suscriptores viven en Substack, no en el portal: "
          "la base tiene 11 cuentas registradas y ninguna tabla de suscripción. "
          "Esta hoja queda lista para el día que existan las dos fuentes.", S_NOTE)], [],
        [("Mes", S_HEAD), ("Suscriptores (Substack)", S_HEAD),
         ("Altas del mes", S_HEAD), ("Sesiones web (GA4)", S_HEAD),
         ("Conversión web → newsletter", S_HEAD)]]
news_first = len(news) + 1
for i in range(12):
    n = len(news) + 1
    news.append([f"=IFERROR(INDEX(GA4_Resumen_Mes,{i+1}),\"\")", "", "",
                 f"=IFERROR(INDEX(GA4_Resumen_Sesiones,{i+1}),0)",
                 (f"=IFERROR(C{n}/D{n},\"\")", S_PCT)])
news_last = len(news)
news += [[], [("Fila de referencia:", S_NOTE)],
         [(x, S_EJEMPLO) for x in ["EJEMPLO 2026-08", "EJEMPLO 4,200", "EJEMPLO 180",
                                   "EJEMPLO 15,000", "1.2%"]]]

defs = [[("Definiciones", S_TITLE)], [],
        [("Métrica", S_HEAD), ("Definición en una frase", S_HEAD), ("Fuente exacta", S_HEAD),
         ("Frecuencia", S_HEAD), ("Por qué le importa al CEO", S_HEAD), ("Estado", S_HEAD)]]
DEFS = [
    ("Usuarios activos", "Personas distintas que abrieron al menos una página en el periodo.",
     "GA4 › Adquisición › Visión general", "Mensual",
     "Es el tamaño real de la audiencia; sin esto no hay denominador para nada más.", PENDIENTE),
    ("Usuarios recurrentes", "Usuarios que ya habían visitado antes del periodo.",
     "GA4 › Retención + article_reads del portal", "Mensual",
     "Un medio que sólo capta usuarios nuevos alquila audiencia; no la construye.", "PARCIAL — el dato propio ya existe"),
    ("Lecturas por lector", "Lecturas registradas ÷ lectores únicos.",
     "Portal › article_reads", "Mensual",
     "Recirculación. Si vale 1.00, cada visitante lee una nota y se va: el archivo no trabaja.", "REAL"),
    ("% de lectores recurrentes", "Lectores con más de una lectura ÷ lectores totales.",
     "Portal › article_reads", "Mensual",
     "Mide si el portal genera hábito o sólo picos de tráfico.", "REAL"),
    ("Conversión web → newsletter", "Altas de newsletter ÷ sesiones del periodo.",
     "Substack (altas) + GA4 (sesiones)", "Mensual",
     "Convierte tráfico prestado en audiencia propia; es el activo que no depende de un algoritmo.", PENDIENTE),
    ("Notas publicadas", "Artículos con status published en el periodo.",
     "Portal › articles", "Mensual",
     "Velocidad de publicación: la capacidad instalada de la redacción.", "REAL"),
    ("Score promedio (boleta 0–99)", "Promedio del score de la boleta editorial.",
     "Portal › articles.score (lib/rank.ts)", "Mensual",
     "Calidad de publicación medida por lo que la nota CONTIENE, no por entusiasmo.", "REAL"),
    ("Notas ≥70", "Notas que superan el umbral de portada fuerte.",
     "Portal › articles.score", "Mensual",
     "Cuántas piezas de verdad mueven la aguja, no cuántas se publicaron.", "REAL"),
    ("Cobertura de tags", "Notas con cada campo de taxonomía poblado.",
     "Portal › articles.tags_*", "Mensual",
     "Un archivo mal etiquetado no se puede recircular ni vender por vertical.", "REAL"),
    ("Sesiones / Vistas de página", "Visitas y páginas vistas en el periodo.",
     "GA4 › Adquisición e Interacción", "Mensual", "Base de tráfico y contexto de todo lo demás.", PENDIENTE),
    ("Canales de adquisición", "De dónde llega el tráfico (orgánico, social, directo, referral).",
     "GA4 › Adquisición de tráfico", "Mensual",
     "Dice qué parte de la audiencia es propia y qué parte es alquilada a una plataforma.", PENDIENTE),
    ("Tiempo de lectura", "Tiempo medio de interacción por página.",
     "GA4 › Páginas y pantallas", "Mensual",
     "Distingue el clic del titular de la lectura real; es la diferencia entre alcance y atención.", PENDIENTE),
    ("Mobile vs desktop", "Reparto de usuarios por tipo de dispositivo.",
     "GA4 › Tecnología", "Mensual", "Decide dónde se invierte el esfuerzo de producto.", PENDIENTE),
    ("Top artículos", "Notas más leídas del periodo.",
     "Portal › article_reads (propio) y GA4 › Páginas", "Mensual",
     "Muestra qué temas pagan, con dato propio que no depende de consentimiento de cookies.", "REAL"),
]
for d in DEFS:
    defs.append(list(d))

instr = [[("Instrucciones", S_TITLE)], [],
         [("Actualizar este archivo cada mes — 4 pasos", S_SUB)],
         ["1", "Abrir GA4 y hacer los cinco exports que lista docs/metricas-website-runbook.md. "
               "Ese documento trae la ruta de clics exacta, el rango de fechas, y las dimensiones "
               "y métricas de cada reporte. Está escrito para alguien que nunca ha abierto GA4."],
         ["2", "Pegar cada export en su bloque de la hoja Datos_GA4, empezando en la primera fila "
               "vacía DEBAJO del encabezado. No reordenar ni renombrar columnas: las fórmulas y "
               "las gráficas apuntan a rangos con nombre y esperan ese orden."],
         ["3", "Refrescar el dato del portal ejecutando, desde la raíz del repo: "
               "POSTGRES_URL=… python3 scripts/build-metrics-dashboard.py "
               "Eso regenera el archivo con los números de la base al día."],
         ["4", "Revisar la hoja Resumen. Las gráficas y los KPI se recalculan solos; "
               "no hay ningún número escrito a mano dentro de una gráfica."],
         [],
         [("Reglas de este archivo", S_SUB)],
         ["·", "Ninguna gráfica contiene valores fijos: todas leen rangos de celdas. "
               "Cambiar un dato cambia la gráfica sin tocarla."],
         ["·", "Las filas marcadas EJEMPLO en ámbar son ilustrativas y NO entran en ningún cálculo. "
               "Se pueden borrar sin romper nada."],
         ["·", "Datos_Portal es real y se regenera desde la base. Datos_GA4 nace vacía a propósito: "
               "no hay credenciales de GA4 en el repo, y una cifra inventada en un dashboard de "
               "dirección es peor que una celda vacía."],
         ["·", "Lo que hoy no se puede medir aparece como " + PENDIENTE + " en Resumen y en "
               "Definiciones, en vez de omitirse. Un hueco visible se arregla; uno omitido no."]]


# ================================================================== ASSEMBLE
SHEETS = [
    ("Resumen",      rs,    [34, 16, 14, 14, 10, 12]),
    ("Trafico",      traf,  [14, 18, 14, 14, 18, 16]),
    ("Contenido",    cont,  [14, 10, 16, 12, 10, 18]),
    ("Audiencia",    aud,   [16, 14, 16, 18]),
    ("Newsletter",   news,  [14, 22, 14, 18, 22]),
    ("Datos_GA4",    dg,    [22, 22, 18, 18, 18, 18, 18, 18]),
    ("Datos_Portal", dp,    [34, 16, 16, 14, 18, 18, 18]),
    ("Definiciones", defs,  [26, 46, 30, 12, 52, 26]),
    ("Instrucciones", instr,[5, 100]),
]

# Named ranges. Every formula in the analysis sheets goes through one of these
# rather than an A1 reference into Datos_GA4 — that is the brief's rule, and it
# is also what lets the GA4 block move without a rewrite.
gr = ga4_ranges["GA4_Resumen"]; gd = ga4_ranges["GA4_Dispositivos"]
DEFINED = {
    "GA4_Resumen_Mes":       f"Datos_GA4!$A${gr[0]}:$A${gr[1]}",
    "GA4_Resumen_Usuarios":  f"Datos_GA4!$B${gr[0]}:$B${gr[1]}",
    "GA4_Resumen_Sesiones":  f"Datos_GA4!$E${gr[0]}:$E${gr[1]}",
    "GA4_Resumen_Vistas":    f"Datos_GA4!$F${gr[0]}:$F${gr[1]}",
    "GA4_Disp_Categoria":    f"Datos_GA4!$B${gd[0]}:$B${gd[1]}",
    "GA4_Disp_Usuarios":     f"Datos_GA4!$C${gd[0]}:$C${gd[1]}",
    "Portal_Calidad_Mes":    f"Datos_Portal!$A${qual_first}:$A${qual_last}",
    "Portal_Calidad_Notas":  f"Datos_Portal!$B${qual_first}:$B${qual_last}",
    "Portal_Calidad_Score":  f"Datos_Portal!$C${qual_first}:$C${qual_last}",
    "Portal_Lecturas_Mes":   f"Datos_Portal!$A${reads_first}:$A${reads_last}",
    "Portal_Lecturas":       f"Datos_Portal!$B${reads_first}:$B${reads_last}",
    "Portal_Lectores":       f"Datos_Portal!$C${reads_first}:$C${reads_last}",
    "Portal_Decena":         f"Datos_Portal!$A${dec_first}:$A${dec_last}",
    "Portal_Decena_Notas":   f"Datos_Portal!$B${dec_first}:$B${dec_last}",
}

# Charts: (host sheet index, chart xml, anchor)
CHARTS = [
    (2, chart_xml("bar", "Notas publicadas por mes",
                  f"Contenido!$A${cont_first}:$A${cont_last}",
                  [(f"Contenido!$B$4", f"Contenido!$B${cont_first}:$B${cont_last}", "1F3A2E")],
                  "Notas"), (7, 2, 14, 18)),
    (2, chart_xml("line", "Score promedio de la boleta por mes",
                  f"Contenido!$A${cont_first}:$A${cont_last}",
                  [(f"Contenido!$C$4", f"Contenido!$C${cont_first}:$C${cont_last}", "4C9A2A")],
                  "Score 0-99"), (7, 19, 14, 35)),
    (3, chart_xml("bar", "Lecturas y lectores únicos por mes",
                  f"Audiencia!$A${aud_first}:$A${aud_last}",
                  [("Audiencia!$B$4", f"Audiencia!$B${aud_first}:$B${aud_last}", "1F3A2E"),
                   ("Audiencia!$C$4", f"Audiencia!$C${aud_first}:$C${aud_last}", "9DC08B")],
                  "Personas / lecturas"), (5, 2, 13, 20)),
    # Series label points at the block's own "Notas" header, not $B$1 -- that
    # cell is empty (the sheet title sits in A1) and an empty strRef renders
    # the legend as "Series1".
    (6, chart_xml("bar", "Distribución de scores del archivo",
                  "Portal_Decena", [(f"Datos_Portal!$B${dec_first-1}", "Portal_Decena_Notas", "1F3A2E")],
                  "Notas"), (8, 2, 16, 20)),
    (1, chart_xml("line", "Usuarios y sesiones (se llena al pegar el export de GA4)",
                  f"Trafico!$A${traf_first}:$A${traf_last}",
                  [("Trafico!$B$4", f"Trafico!$B${traf_first}:$B${traf_last}", "1F3A2E"),
                   ("Trafico!$C$4", f"Trafico!$C${traf_first}:$C${traf_last}", "9DC08B")],
                  "Usuarios / sesiones"), (7, 2, 16, 22)),
]

# ------------------------------------------------- Preserve pasted GA4 data
# Regenerating used to silently destroy whatever had been pasted into
# Datos_GA4, because the script rewrites the whole workbook. The runbook warned
# about the ordering, but a footgun documented is still a footgun: the person
# refreshing the portal numbers in month 6 is not going to reread the runbook.
#
# So: if a workbook already exists AND its Datos_GA4 headers still match the
# ones this script would write, the old sheet is carried over verbatim. A
# header mismatch means GA4_BLOCKS changed, and silently keeping rows under
# changed columns would misalign every named range — so that case warns loudly
# and starts clean rather than guessing.
def preserved_ga4(new_rows):
    if not os.path.exists(OUT):
        return None
    try:
        with zipfile.ZipFile(OUT) as oz:
            old_xml = oz.read("xl/worksheets/sheet6.xml").decode("utf-8")
    except Exception:
        return None

    def headers_of(xml):
        return re.findall(r'<c r="[A-Z]+(\d+)" s="2" t="inlineStr"><is><t[^>]*>([^<]*)</t>', xml)

    fresh_xml = sheet_xml(new_rows, None, None, None)
    if headers_of(old_xml) != headers_of(fresh_xml):
        print("  ! Datos_GA4 cambió de estructura — no se conservan los datos pegados.")
        return None

    # Everything this script generates carries a non-zero style (title 1,
    # header 2, note 5, sub 6). A pasted cell is style 0 — that, not "is it
    # non-empty", is what distinguishes the user's data from the scaffolding.
    pasted = len(re.findall(r'<c r="[A-Z]+\d+" s="0"', old_xml))
    if pasted == 0:
        return None
    print(f"  · Datos_GA4: se conservan {pasted} celdas ya pegadas.")
    return old_xml


os.makedirs("docs", exist_ok=True)
GA4_PRESERVED = preserved_ga4(dg)
charts_by_sheet = {}
for si, cxml, anchor in CHARTS:
    charts_by_sheet.setdefault(si, []).append((cxml, anchor))

ct = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      '<Default Extension="xml" ContentType="application/xml"/>'
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>']
wb_rels = []
sheets_xml = []
chart_no = 0
zf_extra = {}

for idx, (name, rows, widths) in enumerate(SHEETS, start=1):
    drawing_rid = None
    if idx in charts_by_sheet:
        dno = idx
        drawing_rid = "rId1"
        anchors, rels = [], []
        for j, (cxml, (fc, fr, tc, tr)) in enumerate(charts_by_sheet[idx], start=1):
            chart_no += 1
            zf_extra[f"xl/charts/chart{chart_no}.xml"] = cxml
            ct.append(f'<Override PartName="/xl/charts/chart{chart_no}.xml" '
                      f'ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>')
            rid = f"rId{j}"
            anchors.append((fc, fr, tc, tr, rid, f"Chart {chart_no}"))
            rels.append(f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/'
                        f'officeDocument/2006/relationships/chart" Target="../charts/chart{chart_no}.xml"/>')
        zf_extra[f"xl/drawings/drawing{dno}.xml"] = drawing_xml(anchors)
        ct.append(f'<Override PartName="/xl/drawings/drawing{dno}.xml" '
                  f'ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>')
        zf_extra[f"xl/drawings/_rels/drawing{dno}.xml.rels"] = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            + "".join(rels) + "</Relationships>")
        zf_extra[f"xl/worksheets/_rels/sheet{idx}.xml.rels"] = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/'
            f'2006/relationships/drawing" Target="../drawings/drawing{dno}.xml"/></Relationships>')

    if name == "Datos_GA4" and GA4_PRESERVED:
        zf_extra[f"xl/worksheets/sheet{idx}.xml"] = GA4_PRESERVED
    else:
        zf_extra[f"xl/worksheets/sheet{idx}.xml"] = sheet_xml(
            rows, widths, drawing_rid, freeze=None)
    ct.append(f'<Override PartName="/xl/worksheets/sheet{idx}.xml" '
              f'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
    sheets_xml.append(f'<sheet name="{esc(name)}" sheetId="{idx}" r:id="rIdS{idx}"/>')
    wb_rels.append(f'<Relationship Id="rIdS{idx}" Type="http://schemas.openxmlformats.org/'
                   f'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{idx}.xml"/>')

ct.append("</Types>")
wb_rels.append('<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/'
               'officeDocument/2006/relationships/styles" Target="styles.xml"/>')

defined = "".join(f'<definedName name="{k}">{esc(v)}</definedName>'
                  for k, v in DEFINED.items())
workbook = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            f'<sheets>{"".join(sheets_xml)}</sheets>'
            f'<definedNames>{defined}</definedNames>'
            '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>')

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", "".join(ct))
    z.writestr("_rels/.rels",
               '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
               '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
               '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/'
               '2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    z.writestr("xl/workbook.xml", workbook)
    z.writestr("xl/_rels/workbook.xml.rels",
               '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
               '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
               + "".join(wb_rels) + "</Relationships>")
    z.writestr("xl/styles.xml", STYLES)
    for path, data in zf_extra.items():
        z.writestr(path, data)

print(f"OK  {OUT}")
print(f"    {len(SHEETS)} hojas · {chart_no} gráficas nativas · {len(DEFINED)} rangos con nombre")
print(f"    Datos_Portal: {len(months)} meses, {sum(volmap.values())} notas, "
      f"{sum(int(r[1]) for r in reads)} lecturas propias")
