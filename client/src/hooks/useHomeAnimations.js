import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const useHomeAnimations = (rootRef) => {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const ctx = gsap.context(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) {
        gsap.set(root.querySelectorAll("[data-home-animate]"), { clearProps: "all" });
        return;
      }

      gsap.from("[data-hero-word]", {
        yPercent: 110,
        opacity: 0,
        duration: 0.75,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.15,
      });

      gsap.to("[data-hero-parallax]", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.utils.toArray("[data-sync-step]").forEach((step) => {
        gsap.from(step, {
          y: 48,
          opacity: 0,
          immediateRender: false,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: step,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      });

      gsap.from("[data-capability]", {
        y: 44,
        opacity: 0,
        immediateRender: false,
        duration: 0.65,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "[data-capabilities]",
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.utils.toArray("[data-stat]").forEach((stat) => {
        const target = Number(stat.getAttribute("data-stat-target"));
        const suffix = stat.getAttribute("data-stat-suffix") || "";
        const counter = { value: 0 };
        gsap.fromTo(stat, { opacity: 0, scale: 0.78 }, {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: stat,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
          immediateRender: false,
        });
        gsap.to(counter, {
          value: target,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: { trigger: stat, start: "top 82%", once: true },
          onUpdate: () => { stat.textContent = `${Math.round(counter.value)}${suffix}`; },
        });
      });

      gsap.from("[data-tech-card]", {
        y: 24,
        opacity: 0,
        immediateRender: false,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "[data-tech-section]",
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.from("[data-cta-content]", {
        y: 46,
        opacity: 0,
        immediateRender: false,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-cta]", start: "top 78%", toggleActions: "play none none reverse" },
      });
      gsap.fromTo("[data-cta]", { backgroundColor: "transparent" }, {
        backgroundColor: "hsl(var(--primary) / 0.08)",
        duration: 1,
        scrollTrigger: { trigger: "[data-cta]", start: "top 85%", toggleActions: "play none none reverse" },
      });

    }, root);

    return () => ctx.revert();
  }, [rootRef]);
};

export default useHomeAnimations;
