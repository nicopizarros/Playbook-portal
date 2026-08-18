import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// This route only ever 404s, so its metadata IS the 404's metadata.
// Declared here rather than relying on app/(public)/not-found.tsx's export:
// Next resolves <title> from the matched *route*, and with none declared
// here the tab fell back to the site-wide default ("Playbook — El negocio
// del deporte"), which reads like a real page — checked in a browser, not
// just in the served HTML, because the streamed and hydrated titles
// disagreed.
export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: true },
};

// Catch-all whose only job is to pull unmatched URLs *into* the (public)
// route group so they get the branded 404.
//
// Without it, a path that matches no route at all (a typo, a stale link, an
// old bookmark from the pre-migration site that next.config.ts's redirect
// list doesn't cover) never enters this group, so Next falls all the way
// back to its built-in not-found page: "404 — This page could not be
// found." in system-ui on a bare white background, in English, with no
// header, no footer, no search and no link back into the site. Verified
// before writing this, not assumed — `curl /ruta-que-no-existe` returned
// exactly that markup, while `/articulo?id=inexistente` (a notFound() call
// from *inside* the group) correctly returned the branded page. Same class
// of bug as the missing error boundaries fixed on 2026-07-21: the code was
// right, it just was not reachable from where the failure actually landed.
//
// Static and dynamic siblings still win over a catch-all in Next's route
// precedence, so /archivo, /articulo, /feed.xml, /admin/* etc. are
// unaffected; files under public/ are served before routing runs at all.
// app/not-found.tsx is the remaining backstop for paths outside this group.
export default function PublicCatchAll(): never {
  notFound();
}
