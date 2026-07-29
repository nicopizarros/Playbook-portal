import { gsap } from '@/vendor/gsap/esm/index.js';
import { CustomEase } from '@/vendor/gsap/esm/CustomEase.js';
import { CustomBounce } from '@/vendor/gsap/esm/CustomBounce.js';
import { CustomWiggle } from '@/vendor/gsap/esm/CustomWiggle.js';
import { Draggable } from '@/vendor/gsap/esm/Draggable.js';
import { DrawSVGPlugin } from '@/vendor/gsap/esm/DrawSVGPlugin.js';
import { Flip } from '@/vendor/gsap/esm/Flip.js';
import { GSDevTools } from '@/vendor/gsap/esm/GSDevTools.js';
import { InertiaPlugin } from '@/vendor/gsap/esm/InertiaPlugin.js';
import { MorphSVGPlugin } from '@/vendor/gsap/esm/MorphSVGPlugin.js';
import { MotionPathPlugin } from '@/vendor/gsap/esm/MotionPathPlugin.js';
import { Physics2DPlugin } from '@/vendor/gsap/esm/Physics2DPlugin.js';
import { ScrollSmoother } from '@/vendor/gsap/esm/ScrollSmoother.js';
import { ScrollTrigger } from '@/vendor/gsap/esm/ScrollTrigger.js';
import { SplitText } from '@/vendor/gsap/esm/SplitText.js';

// Single registration point for the self-hosted Club GreenSock bundle (see
// vendor/gsap/README.md) — import gsap/plugins from here, never straight
// from vendor/gsap/esm/*, so a plugin is never registered more than once.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(
    CustomEase,
    CustomBounce,
    CustomWiggle,
    Draggable,
    DrawSVGPlugin,
    Flip,
    GSDevTools,
    InertiaPlugin,
    MorphSVGPlugin,
    MotionPathPlugin,
    Physics2DPlugin,
    ScrollSmoother,
    ScrollTrigger,
    SplitText,
  );
}

export {
  gsap,
  CustomEase,
  CustomBounce,
  CustomWiggle,
  Draggable,
  DrawSVGPlugin,
  Flip,
  GSDevTools,
  InertiaPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  Physics2DPlugin,
  ScrollSmoother,
  ScrollTrigger,
  SplitText,
};
