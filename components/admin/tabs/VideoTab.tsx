'use client';

import type { VideoClip, VideoEpisodeLink, InstagramReel, SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';
import { SelectField } from '../fields/SelectField';
import { ArrayEditor } from '../fields/ArrayEditor';

type Props = {
  data: SiteContentData['videoSection'];
  onChange: (next: SiteContentData['videoSection']) => void;
};

export function VideoTab({ data, onChange }: Props) {
  const set = <K extends keyof SiteContentData['videoSection']>(key: K, value: SiteContentData['videoSection'][K]) =>
    onChange({ ...data, [key]: value });
  const setFeatured = (patch: Partial<SiteContentData['videoSection']['featured']>) =>
    set('featured', { ...data.featured, ...patch });
  const setSecondary = (patch: Partial<SiteContentData['videoSection']['secondary']>) =>
    set('secondary', { ...data.secondary, ...patch });

  return (
    <div>
      <h2 className="admin-section-title">Video Playbook</h2>
      <p className="admin-section-desc">El video destacado, el secundario, los clips cortos y los Reels de Instagram.</p>
      <TextField label="Título de la sección" help="El encabezado grande de la sección Video." value={data.heading} onChange={v => set('heading', v)} />
      <TextField label="Subtítulo" help="El texto pequeño debajo del título de la sección." value={data.sub} onChange={v => set('sub', v)} />
      <TextField label="Texto del enlace al canal" help="El texto del enlace que lleva al canal de YouTube." value={data.channelLinkLabel} onChange={v => set('channelLinkLabel', v)} />
      <TextField label="Enlace del canal" type="url" required help="La URL del canal de YouTube." value={data.channelLinkUrl} onChange={v => set('channelLinkUrl', v)} />

      <h3 className="admin-section-title">Video destacado</h3>
      <TextField label="ID de video de YouTube" help='El código después de "v=" o "youtu.be/" (ej. 1fGmZUNy_xk), no el link completo.' value={data.featured.embedId} onChange={v => setFeatured({ embedId: v })} />
      <TextField label="Título del video (accesibilidad)" help="Un texto descriptivo para lectores de pantalla; no se muestra en pantalla." value={data.featured.embedTitle} onChange={v => setFeatured({ embedTitle: v })} />
      <TextField label="Título" help="El título que se muestra debajo del video destacado." value={data.featured.title} onChange={v => setFeatured({ title: v })} />

      <h3 className="admin-section-title">Video secundario</h3>
      <TextField label="ID de video de YouTube" help='El código después de "v=" o "youtu.be/" (ej. vBdq4jG2hvc), no el link completo.' value={data.secondary.embedId} onChange={v => setSecondary({ embedId: v })} />
      <TextField label="Título del video (accesibilidad)" help="Un texto descriptivo para lectores de pantalla; no se muestra en pantalla." value={data.secondary.embedTitle} onChange={v => setSecondary({ embedTitle: v })} />
      <TextField label="Título" help="El título que se muestra debajo del video secundario." value={data.secondary.title} onChange={v => setSecondary({ title: v })} />
      <ArrayEditor<VideoEpisodeLink>
        items={data.secondary.episodeLinks}
        onChange={episodeLinks => setSecondary({ episodeLinks })}
        addLabel="+ Agregar video"
        itemTitle={item => item.label || 'Video'}
        newItem={() => ({ label: '', url: '' })}
        renderItem={(item, i) => (
          <>
            <TextField label="Texto del video" help='El nombre del video en la lista de "Más videos".' value={item.label} onChange={v => { const links = data.secondary.episodeLinks.slice(); links[i] = { ...links[i], label: v }; setSecondary({ episodeLinks: links }); }} />
            <TextField label="Enlace del video" type="url" required help="A dónde lleva ese video." value={item.url} onChange={v => { const links = data.secondary.episodeLinks.slice(); links[i] = { ...links[i], url: v }; setSecondary({ episodeLinks: links }); }} />
          </>
        )}
      />

      <h3 className="admin-section-title">Clips cortos</h3>
      <ArrayEditor<VideoClip>
        items={data.clips}
        onChange={clips => set('clips', clips)}
        addLabel="+ Agregar clip"
        itemTitle={item => item.title || 'Clip'}
        newItem={() => ({ platform: 'youtube', url: '', thumbnail: '', title: '', handle: '', igText: '', variant: '' })}
        renderItem={(item, i) => (
          <>
            <SelectField
              label="Plataforma"
              help="YouTube muestra una miniatura; Instagram muestra una tarjeta de texto."
              value={item.platform}
              options={[{ value: 'youtube', label: 'YouTube' }, { value: 'instagram', label: 'Instagram' }]}
              onChange={v => { const clips = data.clips.slice(); clips[i] = { ...clips[i], platform: v as VideoClip['platform'] }; set('clips', clips); }}
            />
            <TextField label="Enlace del clip" type="url" required help="A dónde lleva el clip al hacer clic." value={item.url} onChange={v => { const clips = data.clips.slice(); clips[i] = { ...clips[i], url: v }; set('clips', clips); }} />
            <TextField label="Miniatura (solo YouTube)" type="url" help="El link a la imagen de miniatura del clip." value={item.thumbnail || ''} onChange={v => { const clips = data.clips.slice(); clips[i] = { ...clips[i], thumbnail: v }; set('clips', clips); }} />
            <TextField label="Texto de la tarjeta (solo Instagram)" help="El texto que se muestra dentro de la tarjeta de Instagram." value={item.igText || ''} onChange={v => { const clips = data.clips.slice(); clips[i] = { ...clips[i], igText: v }; set('clips', clips); }} />
            <TextField label="Título del clip" help="El título que aparece debajo del clip." value={item.title} onChange={v => { const clips = data.clips.slice(); clips[i] = { ...clips[i], title: v }; set('clips', clips); }} />
            <TextField label="Cuenta" help="El usuario de la red social en la tarjeta (ej. @playbook.la)." value={item.handle} onChange={v => { const clips = data.clips.slice(); clips[i] = { ...clips[i], handle: v }; set('clips', clips); }} />
          </>
        )}
      />

      <h3 className="admin-section-title">Reels de Instagram</h3>
      <p className="admin-section-desc">Embeds reales de Instagram — solo hace falta el link del reel.</p>
      <ArrayEditor<InstagramReel>
        items={data.instagramReels}
        onChange={instagramReels => set('instagramReels', instagramReels)}
        addLabel="+ Agregar reel"
        itemTitle={item => item.url || 'Reel'}
        newItem={() => ({ url: '' })}
        renderItem={(item, i) => (
          <TextField
            label="Enlace del reel"
            type="url"
            required
            help="El link al reel de Instagram (ej. https://www.instagram.com/reel/…)."
            value={item.url}
            onChange={v => { const reels = data.instagramReels.slice(); reels[i] = { ...reels[i], url: v }; set('instagramReels', reels); }}
          />
        )}
      />
    </div>
  );
}
