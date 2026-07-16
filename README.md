# Playbook-web

Portal editorial de Playbook (playbookmedia.mx). HTML/JS vanilla, sin paso de
build, desplegado en Vercel. `articles.json` y `content.json` son la base de
datos del sitio; se editan desde `/admin` o directo en GitHub.

## Tareas operativas

### Cargar el token real de Google Search Console

Las 5 páginas públicas (`index.html`, `articulo.html`, `archivo.html`,
`autor.html`, `404.html`) ya tienen el slot de verificación listo:

```html
<meta name="google-site-verification" content="PENDING-GSC-VERIFICATION-TOKEN" />
```

Tiene que quedar como HTML estático (no se puede inyectar por JavaScript)
porque así es como Google revisa este método de verificación.

**Pasos:**

1. Entra a [search.google.com/search-console](https://search.google.com/search-console),
   agrega la propiedad `https://www.playbookmedia.mx` si no existe, y elegí
   el método de verificación **etiqueta HTML**. Google te da una línea del
   tipo `<meta name="google-site-verification" content="AbCdEf123..." />` —
   solo necesitas el valor de `content`.
2. Desde la raíz del repositorio, corre uno de estos dos comandos según tu
   sistema (reemplaza `TU-TOKEN-REAL` por el valor real que te dio Google):

   **macOS:**
   ```bash
   sed -i '' 's/PENDING-GSC-VERIFICATION-TOKEN/TU-TOKEN-REAL/g' index.html articulo.html archivo.html autor.html 404.html
   ```

   **Linux:**
   ```bash
   sed -i 's/PENDING-GSC-VERIFICATION-TOKEN/TU-TOKEN-REAL/g' index.html articulo.html archivo.html autor.html 404.html
   ```

3. Revisa el cambio (`git diff`) y confirma que las 5 páginas quedaron con
   el mismo token real, sin tocar nada más.
4. Commit y push a la rama de siempre. El sitio se despliega solo en 1-2
   minutos.
5. De vuelta en Search Console, hacé clic en **Verificar**. Puede tardar
   unos minutos en confirmar después del deploy.
6. Una vez verificado, en Search Console podés enviar el sitemap: **Sitemaps
   → Agregar un sitemap nuevo** → `sitemap.xml` (ya se genera solo desde
   `articles.json`, ver `api/sitemap.js`).

No hace falta ninguna otra configuración en Vercel para este paso — es
puramente un cambio de contenido estático en los 5 archivos.
