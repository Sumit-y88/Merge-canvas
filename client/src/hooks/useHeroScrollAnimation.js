import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useHeroScrollAnimation = (scope) => {
  useGSAP(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const strokes = gsap.utils.toArray("[data-hero-stroke]");
    if (reducedMotion) {
      gsap.set(strokes, { strokeDashoffset: 0, opacity: 1 });
      return;
    }

    gsap.set(strokes, { strokeDasharray: 1000, strokeDashoffset: 1000, opacity: 0.35 });
    gsap.to(strokes, {
      strokeDashoffset: 0,
      opacity: 1,
      ease: "none",
      stagger: 0.12,
      scrollTrigger: {
        trigger: "[data-hero]",
        start: "top top",
        end: "+=620",
        scrub: 0.5,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  }, { scope, dependencies: [] });
};

export default useHeroScrollAnimation;
