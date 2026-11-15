"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrambleTextPlugin, SplitText, Draggable, InertiaPlugin);

/** Media query yang dipake berulang di semua animasi */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";
export const RAIL =
  "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

export { gsap, useGSAP, ScrollTrigger, SplitText, Draggable };
