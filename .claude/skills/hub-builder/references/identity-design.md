# Step 3 — Identity, in two passes

**You may not write hub CSS until pass two is complete.** The gate exists
because the first plausible answer to "design a sports hub" is almost
always a generic one.

## Pass one — the design plan

Produce all four, in the report, before any code:

1. **Colour.** 4–6 named values, each with its ROLE stated, plus the
   dark-mode mapping. A value with no job does not belong.
2. **Type.** At least two roles: a characterful display face used with
   restraint, and a body face compatible with the portal's editorial shell
   (Inter — do not replace it). Add a utility face only if the data modules
   genuinely need one; state the scale, weights and tracking.
3. **Layout.** Prose plus ASCII wireframes, mobile and desktop.
4. **Signature.** The ONE element this hub is remembered by.

## Pass two — critique before building (the gate)

Re-read your own plan and answer honestly:

> **Would I have produced this for any sports league brief?**

Whatever fails that test gets revised, and you **state what you changed and
why** in the report. A pass-two section that changed nothing is a sign the
critique wasn't real.

Also check each of these explicitly:

- Does the palette survive on BOTH the warm `--paper` and the dark one?
- Is the accent doing ONE job, or decorating?
- Does the signature read as an apparatus specific to this property, or as
  a component any dashboard would have? (A rounded progress bar is the
  generic answer. So is a percentage.)

## Grounding

Take the identity from the subject:

- **The material world** of the sport: its equipment, markings, officiating
  apparatus, scoreboard typography, the geometry of its field of play.
- **The commercial story**, which is the actual Playbook angle: capital,
  ownership, expansion, rights, the market position.
- **The map**: plazas are commercial markets in our framing, not dots.

## Anti-patterns — do not ship these

- **Cream + high-contrast serif + terracotta.** Our shell is already
  editorial; a "newspaper" answer is a shrug, not a choice.
- **Near-black + one acid accent.** Also frequently the property's OWN kit
  (the LFA's is exactly this), so it fails the legal test too.
- **Generic broadsheet**: hairline rules, zero radius, nothing else.
- **A tinted overlay washing the reading surface.** This is the Infinitas
  mistake, corrected on 2026-08-14. Identity is carried by accent, type
  treatment, structural device and ONE signature module. The reading
  surface stays clean.
- **`01 / 02 / 03` markers** unless the content is genuinely sequential.
- **Percentages where the property has real units.** "Faltan 4 franquicias"
  beats "67%" every time.

## Legal guardrail — never skip

The hub's visual identity is **Playbook's**, built to sit ADJACENT to the
property. Do not clone its marks, do not lift team crests into the design
language, and do not use copy, badge or layout implying an official
partnership or licence.

The property's logo is **nominative reference only**, in a single
constrained lockup slot, until rights are confirmed. Write it as a
swappable asset whose **text fallback always renders** — see
`lib/hubs/types.ts`'s `HubIdentity`. An unlicensed or withdrawn mark must
degrade to type, never to a hole.

## Contained accent — the structural rule

`styles/hubs/hub.css` is STRUCTURE and contains no palette value. Each hub
supplies `styles/hubs/<slug>.tokens.css`, scoped to `[data-hub="<slug>"]`,
so a hub's palette cannot escape its own page subtree. **No hub colour ever
enters global chrome** — not the header, not the footer.
