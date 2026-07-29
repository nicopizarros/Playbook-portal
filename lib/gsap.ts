import { gsap as gsapUntyped, SteppedEase as SteppedEaseUntyped } from '@/vendor/gsap/esm/index.js';
import { ScrollTrigger as ScrollTriggerUntyped } from '@/vendor/gsap/esm/ScrollTrigger.js';
import { SplitText } from '@/vendor/gsap/esm/SplitText.js';

// gsap-core.js attaches to/from/fromTo/set to the gsap object at runtime
// (not via statically-analyzable property syntax), so allowJs's inference
// (there's no shipped .d.ts for a vendored, non-npm bundle) can't see them.
// This is the actual surface used across the app — narrower than real
// GSAP's, but real types beat casting every call site to `any`.
interface GsapTween {
  kill(): void;
  scrollTrigger?: { kill(): void } | null;
}
interface GsapTimeline {
  to(targets: unknown, vars: Record<string, unknown>, position?: string | number): GsapTimeline;
  from(targets: unknown, vars: Record<string, unknown>, position?: string | number): GsapTimeline;
  fromTo(
    targets: unknown,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
    position?: string | number,
  ): GsapTimeline;
  set(targets: unknown, vars: Record<string, unknown>, position?: string | number): GsapTimeline;
  call(callback: () => void, params?: unknown[], position?: string | number): GsapTimeline;
  kill(): void;
}
interface GsapCore {
  registerPlugin(...args: unknown[]): void;
  to(targets: unknown, vars: Record<string, unknown>): GsapTween;
  from(targets: unknown, vars: Record<string, unknown>): GsapTween;
  fromTo(
    targets: unknown,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
  ): GsapTween;
  set(targets: unknown, vars: Record<string, unknown>): void;
  timeline(vars?: Record<string, unknown>): GsapTimeline;
}

const gsap = gsapUntyped as unknown as GsapCore;

// Same story as GsapCore above: ScrollTrigger.create is attached at
// runtime, not statically inferable from the raw JS.
interface ScrollTriggerInstance {
  kill(): void;
}
interface ScrollTriggerStatic {
  create(vars: Record<string, unknown>): ScrollTriggerInstance;
}
const ScrollTrigger = ScrollTriggerUntyped as unknown as ScrollTriggerStatic;

interface SteppedEaseStatic {
  config(steps: number): unknown;
}
const SteppedEase = SteppedEaseUntyped as unknown as SteppedEaseStatic;

// Only ScrollTrigger + SplitText are registered here — the two plugins
// actually used anywhere in the app today (see the grep-able set of `@/lib/
// gsap` importers). The rest of the Club GreenSock bundle (SplitText's
// siblings — MorphSVGPlugin, DrawSVGPlugin, InertiaPlugin, ScrollSmoother,
// GSDevTools, Draggable, Flip, CustomEase, CustomBounce, CustomWiggle,
// Physics2DPlugin, MotionPathPlugin) is still fully vendored in
// vendor/gsap/esm/ and ready to use, but deliberately NOT imported/
// registered from this shared entry point: every plugin imported here is
// static-imported into every route that touches @/lib/gsap regardless of
// whether that route actually needs it (registerPlugin() calls keep them
// all from being tree-shaken), so registering all 14 by default was
// costing ~100KB of unused JS on every page with any GSAP usage at all. A
// future feature that genuinely needs e.g. Draggable or Flip should import
// it straight from vendor/gsap/esm/ and register it locally, or add a
// second lean entry point here — not grow this shared one.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export { gsap, ScrollTrigger, SplitText, SteppedEase };
