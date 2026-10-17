"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  ExternalLink,
  GitMerge,
  Pencil,
  Radio,
  Zap,
  Cpu,
  StickyNote,
  Compass,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

const OptimizedDemoVideo = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    // Preload & stream video bytes ONLY when scrolled within 200px of viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        } else {
          // Auto-pause when user scrolls away to conserve CPU, GPU, and battery
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { rootMargin: "200px 0px", threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={togglePlayback}
      className="relative bg-stone-950 flex items-center justify-center overflow-hidden cursor-pointer group min-h-[14rem] sm:min-h-[22rem]"
      title="Click to play / pause video"
    >
      {/* Video element without native controls, with preload='none' and lazy loading */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        // @ts-expect-error loading='lazy' on video for modern browser hint
        loading="lazy"
        disablePictureInPicture
        disableRemotePlayback
        onLoadedData={() => setIsLoaded(true)}
        className={`w-full h-auto max-h-[36rem] object-contain mx-auto block transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {isInView && (
          <>
            <source src="/mergeCanvas%20video.mp4" type="video/mp4" />
            <source src="/mergeCanvas video.mp4" type="video/mp4" />
          </>
        )}
        Your browser does not support the video tag.
      </video>

      {/* Lightweight skeleton placeholder while buffering on slow devices */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900 text-stone-400 gap-2 font-mono text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
          <span className="font-label text-[11px] tracking-wider uppercase text-stone-300">
            Buffering Canvas Stream...
          </span>
        </div>
      )}

      {/* Tactile play/pause chip indicator on hover or when paused */}
      <div
        className={`absolute bottom-3 right-3 px-2 py-1 rounded-DEFAULT bg-stone-950/80 border border-stone-700 text-stone-200 font-label text-[10px] font-bold flex items-center gap-1.5 transition-opacity duration-200 pointer-events-none ${
          !isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isPlaying ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
          }`}
        />
        <span>{isPlaying ? "Click to Pause" : "Paused · Click to Play"}</span>
      </div>
    </div>
  );
};

const Logo = () => (
  <Link href="/" className="flex items-center gap-2 sm:gap-2.5 font-bold tracking-tight text-foreground group shrink-0">
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-DEFAULT bg-primary flex items-center justify-center text-white border-[1.5px] border-foreground shadow-stamp-xs group-hover:-rotate-3 transition-transform shrink-0">
      <GitMerge className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </div>
    <div className="flex flex-col">
      <span className="font-headline text-base sm:text-lg tracking-tight leading-none text-foreground whitespace-nowrap">
        MergeCanvas
      </span>
      <span className="font-label text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 hidden sm:inline leading-none">
        Studio Atelier
      </span>
    </div>
  </Link>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Top App Header */}
      <header className="sticky top-0 z-50 bg-surface border-b border-foreground shadow-stamp">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full px-3 sm:px-6 py-2 sm:py-3 gap-2">
          {/* Brand */}
          <Logo />

          {/* Navigation Links - Clean & Focused */}
          <nav className="hidden md:flex items-center gap-7 font-label text-xs font-semibold uppercase tracking-wider">
            <Link
              href="/canvas"
              className="text-foreground hover:text-primary transition-colors font-bold"
            >
              Free Canvas
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Features
            </a>
            <a
              href="#protocol"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("protocol")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Protocol
            </a>
          </nav>

          {/* Actions Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle className="p-1.5 sm:p-2" />
            <Link
              href="/login"
              className="whitespace-nowrap font-label text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-1.5 sm:px-2.5 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="whitespace-nowrap inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-DEFAULT border-[1.5px] border-foreground bg-primary text-white font-label text-xs font-bold shadow-stamp hover:bg-primary-hover active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <span>Start<span className="hidden sm:inline"> a Board</span></span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: Tactile Editorial Studio Atmosphere */}
      <main>
        <section className="relative bg-dot-matrix pt-12 pb-24 overflow-hidden border-b border-foreground">
          {/* Top-Left Floating Studio Project Stamp */}
          <div className="hidden xl:block absolute top-8 left-8 z-10 -rotate-2 bg-surface border border-foreground p-3 shadow-stamp-md max-w-xs pointer-events-none">
            <div className="flex items-center justify-between border-b border-foreground/30 pb-1 mb-2">
              <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
                DRAWING SPEC SHEET
              </span>
              <span className="font-label text-[10px] text-muted-foreground">PL-902</span>
            </div>
            <p className="font-body text-xs text-muted-foreground leading-tight">
              Scale 1:1 Live Sync · Archival Cotton Vellum 240gsm · Latency: &lt;14ms
            </p>
          </div>

          {/* Top-Right Tape Note Decorator */}
          <div className="hidden xl:block absolute top-12 right-12 z-10 rotate-3 bg-[#FAF7F0] dark:bg-card border border-foreground p-3 shadow-stamp-md w-56 pointer-events-none">
            <div className="washi-tape absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-4" />
            <div className="flex items-center gap-1.5 mb-1 text-foreground font-label text-xs font-bold uppercase">
              <Pencil className="w-3.5 h-3.5 text-primary" />
              <span>Studio Rules</span>
            </div>
            <p className="font-body text-xs text-muted-foreground leading-snug">
              No generic corporate decks. Raw intuition, crisp ink rules, and tactile thought.
            </p>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-20">
            {/* Studio Pill Badge */}
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-DEFAULT border border-foreground bg-surface shadow-stamp mb-5 sm:mb-6 max-w-full">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="font-label text-[10px] sm:text-xs uppercase tracking-wider text-foreground font-bold truncate">
                COLLABORATION ENGINE FOR WORKSHOPS
              </span>
            </div>

            {/* Headline with Ink Loop Underline */}
            <h1 className="font-headline text-3xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto mb-4 sm:mb-6 leading-[1.15] sm:leading-[1.1]">
              The tactile canvas where minds collide in{" "}
              <span className="ink-highlight-loop text-primary">real time</span>.
            </h1>

            <p className="font-body text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
              Archival cotton vellum, carbon sumi ink, and zero-latency CRDT state convergence.
              Built for engineering architects, product planners, and designers who demand tactile craft.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/canvas"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-DEFAULT border-[2px] border-foreground bg-amber-500 text-stone-950 font-label text-sm font-bold shadow-stamp-md hover:bg-amber-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all group"
              >
                <Pencil className="w-4 h-4 text-stone-950 group-hover:rotate-12 transition-transform" />
                <span>Try Free Canvas (No Sign In)</span>
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-DEFAULT border-[2px] border-foreground bg-primary text-white font-label text-sm font-bold shadow-stamp hover:bg-primary-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <span>Start a Team Board</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#protocol"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("protocol")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-DEFAULT border-[2px] border-foreground bg-surface text-foreground font-label text-sm font-bold shadow-stamp hover:bg-secondary active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                <span>Sync Protocol</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Interactive Drafting Stage (Features Showcase) */}
          <div id="features" className="max-w-5xl mx-auto mt-16 px-4 scroll-mt-24">
            <div className="relative rounded-DEFAULT border-[2px] border-foreground bg-surface shadow-stamp-xl overflow-hidden">
              {/* Board Header Bar */}
              <div className="flex items-center justify-between border-b border-foreground px-3 sm:px-4 py-2 bg-secondary/80 text-xs font-label font-bold gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 border border-foreground" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 border border-foreground" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border border-foreground" />
                  </div>
                  <span className="text-foreground truncate whitespace-nowrap text-[11px] sm:text-xs">
                    <span className="hidden md:inline">STUDIO SHEET #418 // </span>MERGECANVAS IN ACTION
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-label text-[10px] sm:text-xs whitespace-nowrap font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                    Live<span className="hidden sm:inline"> Canvas</span> Preview
                  </span>
                  <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    SCALE 1:1
                  </span>
                </div>
              </div>

              {/* Video Player Surface */}
              <OptimizedDemoVideo />

              {/* Bottom Canvas Chrome Footer */}
              <div className="flex items-center justify-between border-t border-foreground px-3 sm:px-4 py-2 bg-secondary/80 font-label text-[10px] sm:text-[11px] text-muted-foreground gap-2">
                <div className="flex items-center gap-2 sm:gap-3 truncate">
                  <span className="whitespace-nowrap">SCALE: 1:1</span>
                  <span>·</span>
                  <span className="whitespace-nowrap">YJS CRDT v13.6</span>
                  <span className="hidden md:inline">·</span>
                  <span className="hidden md:inline whitespace-nowrap">REAL-TIME COLLABORATIVE DEMO</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-bold text-foreground whitespace-nowrap">
                    <span className="hidden sm:inline">60FPS </span>ENGINE
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Guest Canvas Launch Prompt */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-surface border-[1.5px] border-foreground rounded-DEFAULT shadow-stamp">
              <div className="flex items-center gap-2.5 text-xs font-body">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="text-foreground font-medium">
                  Want to test the full tactile whiteboard immediately without signing in?
                </span>
              </div>
              <Link
                href="/canvas"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-DEFAULT border border-foreground bg-amber-500/15 text-foreground font-label text-xs font-bold hover:bg-amber-500/25 transition-colors shrink-0 shadow-stamp-xs"
              >
                <span>Launch Free Sandbox →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: CRDT Protocol */}
        <section id="protocol" className="py-24 border-b border-foreground bg-secondary/30 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <span className="font-label text-xs uppercase tracking-widest text-primary font-bold">
                Under the Hood // Protocol
              </span>
              <h2 className="font-headline text-3xl sm:text-5xl font-bold tracking-tight text-foreground mt-2">
                No locked screens. <br />
                No merge conflict dialogs.
              </h2>
              <p className="font-body text-sm sm:text-base text-muted-foreground mt-4 leading-relaxed">
                Traditional whiteboards lock layers or overwrite edits when networks jitter.
                MergeCanvas treats canvas state as a Conflict-Free Replicated Data Type (CRDT) with deterministic convergence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Local-First Mutation",
                  desc: "Your pencil, shape, or sticky mutation writes immediately to the local Yjs document at 60fps.",
                  icon: Zap,
                },
                {
                  step: "02",
                  title: "Delta Encoding",
                  desc: "Only binary diffs are serialized, keeping packet sizes minuscule and bandwidth efficient.",
                  icon: Cpu,
                },
                {
                  step: "03",
                  title: "Peer Mesh Broadcast",
                  desc: "WebSocket relays forward binary updates across connected participants in milliseconds.",
                  icon: Radio,
                },
                {
                  step: "04",
                  title: "Formal Convergence",
                  desc: "Mathematically proven merge algorithms guarantee all users arrive at the identical state.",
                  icon: GitMerge,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="p-6 rounded-DEFAULT border-[1.5px] border-foreground bg-surface shadow-stamp hover:shadow-stamp-md transition-all space-y-4 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        STEP // {item.step}
                      </span>
                      <div className="w-8 h-8 rounded-DEFAULT bg-primary/10 border border-foreground/30 flex items-center justify-center text-primary">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="font-headline text-base font-bold text-foreground">{item.title}</h3>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: The Manifesto */}
        <section id="manifesto" className="py-24 border-b border-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <span className="font-label text-xs uppercase tracking-widest text-primary font-bold">
                Design Philosophy
              </span>
              <h2 className="font-headline text-3xl sm:text-5xl font-bold tracking-tight text-foreground mt-2">
                The Tactile Workshop Manifesto
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Physical Studio Craft",
                  desc: "The interface mirrors authentic studio tools. Canvases emulate heavy cotton vellum and technical graph paper, while interface containers feel like dense chipboard and draftsman rulers.",
                  badge: "PILLAR // 01",
                  icon: Compass,
                },
                {
                  title: "Ink & Vellum Contrast",
                  desc: "Deep, carbon-rich ink rules interact with warm paper fibers. Information is bounded by deliberate, crisp strokes rather than vague shadow drops.",
                  badge: "PILLAR // 02",
                  icon: Pencil,
                },
                {
                  title: "Asymmetric Human Precision",
                  desc: "The layout balances mathematical drafting grids with slight organic misalignments—subtle angular offsets, tape swatches, and hand-annotated accents.",
                  badge: "PILLAR // 03",
                  icon: StickyNote,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-7 rounded-DEFAULT border-[1.5px] border-foreground bg-surface shadow-stamp hover:shadow-stamp-md transition-all space-y-4"
                  >
                    <div className="w-10 h-10 rounded-DEFAULT bg-secondary flex items-center justify-center text-primary border border-foreground">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold block">
                      {item.badge}
                    </span>
                    <h3 className="font-headline text-lg font-bold text-foreground">{item.title}</h3>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 4: Technical Specs */}
        <section id="specs" className="py-20 bg-secondary/20 border-b border-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="font-label text-xs uppercase tracking-widest text-primary font-bold">
                Open Engineering Architecture
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold mt-1">
                Technical Specifications
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "State Engine", val: "Yjs CRDT v13.6" },
                { label: "Rendering", val: "HTML5 Canvas 2D" },
                { label: "Transport", val: "Socket.IO Binary" },
                { label: "App Framework", val: "Next.js 16 App" },
                { label: "Persistence", val: "MongoDB Snapshots" },
                { label: "Security", val: "JWT & Scoped ACL" },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="p-4 rounded-DEFAULT border-[1.5px] border-foreground bg-surface text-center space-y-1 shadow-stamp-xs"
                >
                  <p className="font-label text-[10px] uppercase text-muted-foreground font-bold">{spec.label}</p>
                  <p className="font-mono text-xs font-bold text-foreground">{spec.val}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="max-w-4xl mx-auto my-20 px-4 text-center">
          <div className="p-8 sm:p-12 rounded-DEFAULT border-[2px] border-foreground bg-surface shadow-stamp-xl relative overflow-hidden">
            <div className="washi-tape absolute -top-3 left-1/2 -translate-x-1/2 w-36 h-6" />

            <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Ready to draft your next system?
            </h2>

            <p className="font-body text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-3 leading-relaxed">
              Create an account or spin up an atelier board in under 5 seconds.
            </p>

            <div className="pt-6">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-DEFAULT border-[2px] border-foreground bg-primary text-white font-label text-sm font-bold shadow-stamp hover:bg-primary-hover active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all"
              >
                <span>Open Atelier Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Studio Footer */}
      <footer className="border-t border-foreground bg-surface py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />

          <p className="font-body text-xs text-muted-foreground text-center">
            Handcrafted for teams who think in architecture and systems. Built with Yjs, Next.js, and Canvas 2D.
          </p>

          <div className="flex items-center gap-4 font-label text-xs font-bold text-muted-foreground">
            <a
              href="https://github.com/Sumit-y88/Merge-canvas"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Code2 className="w-4 h-4" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
