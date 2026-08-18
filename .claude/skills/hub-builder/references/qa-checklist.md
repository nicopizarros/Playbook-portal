# Step 6 — QA. Run it, then report the results, including failures.

## Build
- [ ] `npx tsc --noEmit` clean
- [ ] `npx eslint .` clean on touched paths
- [ ] `npm run build` succeeds

## The page
- [ ] `/coberturas/<slug>` renders 200
- [ ] Screenshots: desktop + mobile, **both colour modes**
- [ ] No module renders placeholder or invented numbers
- [ ] Every figure shows a source; uncited ones show "sin cita pública"
- [ ] Empty/near-empty states read as an invitation
- [ ] Sponsor slot's UNSOLD state looks intentional in a screenshot

## Identity containment
- [ ] Reading surface is `--paper` in both themes — no tint wash
- [ ] The dark plane is capped at the signature module + table header
- [ ] No `--hub-*` token is read outside the hub's own subtree
- [ ] Header and footer chrome are unchanged on the hub route

## Legal
- [ ] No cloned marks, crests, or copied brand palette
- [ ] Property logo (if any) is the single nominative lockup slot
- [ ] Text fallback renders with the logo removed — **test it by removing it**
- [ ] No copy implying partnership or licensing

## Accessibility
- [ ] Keyboard: every interactive element reachable, focus visible
- [ ] Headings nest correctly; one `<h1>`
- [ ] Decorative geometry is `aria-hidden`, and the fact it encodes is in
      the DOM as text elsewhere
- [ ] `prefers-reduced-motion` respected
- [ ] Contrast passes on both planes

## Regressions
- [ ] Homepage hero unchanged
- [ ] Theme toggle alternates cleanly and persists
- [ ] No new console errors
- [ ] Lighthouse on the hub route, with any delta vs a product page explained

## Data
- [ ] Backfill counts reported: retagged AND rejected-at-boundary
- [ ] Pool size reported before the coverage stream was designed
