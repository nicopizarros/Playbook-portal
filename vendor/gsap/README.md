# vendor/gsap

GSAP core plus the licensed Club GreenSock bonus plugins (SplitText, MorphSVGPlugin,
DrawSVGPlugin, InertiaPlugin, ScrollSmoother, GSDevTools, Draggable, Flip, CustomEase,
CustomBounce, CustomWiggle, Physics2DPlugin, MotionPathPlugin, ScrollTrigger, and others),
self-hosted here rather than pulled from a CDN because these plugins are only licensed
for this site, not for public redistribution.

Source: the ESM build from the private Club GreenSock download, copied in as-is
(`esm/` only — `umd/`, `minified/`, and `src/` from the original download were dropped;
Next's own build already bundles and minifies whatever `esm/` files get imported).

Do not import directly from `vendor/gsap/esm/*` in app code — import from `@/lib/gsap`,
which registers every plugin once and re-exports them.
