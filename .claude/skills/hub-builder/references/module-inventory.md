# Step 4 — Module inventory

Every module must answer: **why does a sports-business reader open this
page instead of a scores site?** Standings and box scores are not our
product and must never be the spine.

Build, merge, or **reject with reasoning**. Rejection is the expected
outcome for at least one of these.

| Module | Earns its place when | Reject when |
|---|---|---|
| **Hero as thesis** | The masthead can state the commercial argument in one sentence | Always build — but never as a stat card with a gradient |
| **Signature device** | There is a sourced current value AND a sourced target | Either side is missing. Absent beats fake. |
| **Commercial state** | ≥3 sourced figures exist | Fewer than 3 — fold them into the hero instead |
| **Coverage stream** | Always build | — (empty state is a design job, not an excuse) |
| **Plazas / markets** | Locations are framed as markets a sponsor buys | It would just be a map of team locations |
| **Season spine** | ≥2 dated anchors with sources | One beat is not a timeline. The code hides it below two. |
| **Sponsor slot** | Always build | — (the UNSOLD state is the one that matters) |
| **Cross-links** | Products actually cover this beat | `relatedSources` is empty |
| **Newsletter** | **Footer module only** | Anywhere on the hub page |

## Provenance is enforced by types, not by discipline

`HubFigure` cannot be constructed without a `HubSource` — an unsourced
number is a compile error. A source with no public URL still renders, with
a visible **"sin cita pública"** marker. That is deliberate: it keeps the
page honest and makes the citation backlog visible on the artefact itself.

**Never invent a source URL to silence the marker.**

## Padding is the failure mode

If the content cannot support a module, the module does not ship. A page
that looks full but says nothing is worse than a short page that is true.
Empty and near-empty states read as an invitation, never as a dead end.
