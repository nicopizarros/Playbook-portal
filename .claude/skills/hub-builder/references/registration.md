# Step 5 — Registration

`scripts/scaffold-hub.ts` does the first four automatically. Verify each.

1. **Config** — `lib/hubs/<slug>.ts`, registered in `lib/hubs/index.ts`'s
   `HUBS`.
2. **Tokens** — `styles/hubs/<slug>.tokens.css`, imported in
   `app/layout.tsx`.
3. **Taxonomy** — value added to `PROPERTY_OPTIONS` in `lib/taxonomy.ts`.
4. **Assets** — `public/hubs/<slug>/`.
5. **Nav** — the hub appears in the header's *Coberturas* zone
   automatically (it reads `HUBS`). If it is still being built, add it to
   `UPCOMING_HUBS` instead so the zone never reads as an empty shelf.
   Declared entries are NOT links and cannot 404.
6. **Sitemap** — `app/sitemap.ts` must emit `/coberturas/<slug>`.
7. **Route** — no new route file. `/coberturas/[slug]` serves every hub via
   `generateStaticParams`. **If you find yourself adding a route, stop.**

## The abstraction test

After the hub ships, scaffold a throwaway second hub from config alone and
screenshot it. If that took more than a config file and an asset folder,
the abstraction failed — refactor `lib/hubs/` before finishing.
