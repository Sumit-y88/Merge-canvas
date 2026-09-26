"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  ExternalLink,
  GitMerge,
  MousePointer2,
  Pencil,
  Radio,
  ShieldCheck,
  Sparkles,
  WifiOff,
  Zap,
  Cpu,
  Layers,
  StickyNote,
  Compass,
  FileDown,
  Lock,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import Button from "../components/ui/Button";

const Logo = () => (
  <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-foreground group">
    <div className="w-8 h-8 rounded-DEFAULT bg-primary flex items-center justify-center text-white border-[1.5px] border-foreground shadow-stamp-xs group-hover:-rotate-3 transition-transform">
      <GitMerge className="w-4 h-4" />
    </div>
    <div className="flex flex-col">
      <span className="font-headline text-lg tracking-tight leading-none text-foreground">
        MergeCanvas
      </span>
      <span className="font-label text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
        Studio Atelier
      </span>
    </div>
  </Link>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Top App Header (Stitch Shared TopNavBar) */}
      <header className="sticky top-0 z-50 bg-surface border-b border-foreground shadow-stamp">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full px-4 sm:px-6 py-3">
          {/* Brand & Studio Stamp */}
          <div className="flex items-center gap-3">
            <Logo />
            <div className="hidden sm:inline-flex items-center px-2 py-0.5 border border-foreground rounded-DEFAULT bg-secondary font-label text-[10px] uppercase tracking-wider text-muted-foreground ml-2">
              v2.4 Live Studio
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 font-label text-xs font-semibold uppercase tracking-wider">
            <a href="#canvas-stage" className="text-primary border-b-2 border-primary pb-0.5">
              Drafting Boards
            </a>
            <a href="#protocol" className="text-muted-foreground hover:text-foreground transition-colors">
              CRDT Protocol
            </a>
            <a href="#manifesto" className="text-muted-foreground hover:text-foreground transition-colors">
              Manifesto
            </a>
            <a href="#specs" className="text-muted-foreground hover:text-foreground transition-colors">
              Technical Specs
            </a>
          </nav>

          {/* Actions Cluster */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-DEFAULT border-[1.5px] border-foreground bg-surface text-foreground font-label text-xs font-bold shadow-stamp hover:bg-secondary active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-DEFAULT border-[1.5px] border-foreground bg-primary text-white font-label text-xs font-bold shadow-stamp-md hover:bg-primary-hover active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all"
            >
              <span>Start a Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-DEFAULT border border-foreground bg-surface shadow-stamp mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-label text-xs uppercase tracking-wider text-foreground font-bold">
                COLLABORATION ENGINE FOR WORKSHOPS
              </span>
            </div>

            {/* Headline with Ink Loop Underline */}
            <h1 className="font-headline text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto mb-6 leading-[1.1]">
              The tactile canvas where minds collide in{" "}
              <span className="ink-highlight-loop text-primary">real time</span>.
            </h1>

            <p className="font-body text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Archival cotton vellum, carbon sumi ink, and zero-latency CRDT state convergence.
              Built for engineering architects, product planners, and designers who demand tactile craft.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-DEFAULT border-[2px] border-foreground bg-primary text-white font-label text-sm font-bold shadow-stamp-md hover:bg-primary-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <span>Open Atelier Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#protocol"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-DEFAULT border-[2px] border-foreground bg-surface text-foreground font-label text-sm font-bold shadow-stamp hover:bg-secondary active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <span>Read Sync Protocol</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Interactive Drafting Stage (Simulated Canvas) */}
          <div id="canvas-stage" className="max-w-5xl mx-auto mt-16 px-4">
            <div className="relative rounded-DEFAULT border-[2px] border-foreground bg-surface shadow-stamp-xl overflow-hidden">
              {/* Board Header Bar */}
              <div className="flex items-center justify-between border-b border-foreground px-4 py-2 bg-secondary/80 text-xs font-label font-bold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 border border-foreground" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-foreground" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border border-foreground" />
                  </div>
                  <span className="text-foreground">STUDIO SHEET #418 // SYSTEM ARCHITECTURE</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-label">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    3 Active Peers
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">SCALE 1:1</span>
                </div>
              </div>

              {/* Canvas Board Surface with Dot Matrix */}
              <div className="relative h-[22rem] sm:h-[28rem] bg-dot-matrix p-6 sm:p-8 overflow-hidden select-none">
                {/* Washi-Taped Sticky Note 1: Canary Yellow */}
                <div className="absolute left-8 sm:left-16 top-10 w-52 p-4 bg-[#FFF6CC] dark:bg-amber-950/60 border-[1.5px] border-foreground rounded-DEFAULT shadow-stamp-md -rotate-2 z-10">
                  <div className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4" />
                  <div className="flex items-center justify-between pb-1.5 border-b border-foreground/15 mb-2 text-[10px] font-label uppercase font-bold text-foreground">
                    <span>Key Insight</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-foreground/10 flex items-center justify-center text-[8px]">
                      1
                    </span>
                  </div>
                  <p className="font-sticky text-xs text-foreground leading-snug">
                    Designers miss tactile friction. Crisp borders, archival vellum &amp; printed ink shadows create grounding.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-label text-muted-foreground">
                    <span>@maya_studio</span>
                    <span className="font-bold">#architecture</span>
                  </div>
                </div>

                {/* Sticky Note 2: Sage Green */}
                <div className="absolute left-48 sm:left-72 top-20 w-56 p-4 bg-[#E2F0D9] dark:bg-emerald-950/60 border-[1.5px] border-foreground rounded-DEFAULT shadow-stamp-md rotate-2 z-10 hidden sm:block">
                  <div className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4" />
                  <div className="flex items-center justify-between pb-1.5 border-b border-foreground/15 mb-2 text-[10px] font-label uppercase font-bold text-foreground">
                    <span>Proposition 2</span>
                    <span className="text-[9px] bg-emerald-200/80 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 px-1 py-0.5 rounded font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <p className="font-sticky text-xs text-foreground leading-snug">
                    Zero merge conflicts: Local Yjs CRDT vector state reconciles peer changes without locking.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-label text-muted-foreground">
                    <span>@liam_tech</span>
                    <span>14ms Peer-Sync</span>
                  </div>
                </div>

                {/* Sticky Note 3: Coral Pink */}
                <div className="absolute right-8 sm:right-16 top-14 w-48 p-4 bg-[#FDE2D2] dark:bg-rose-950/60 border-[1.5px] border-foreground rounded-DEFAULT shadow-stamp-md -rotate-1 z-10 hidden md:block">
                  <div className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4" />
                  <div className="flex items-center justify-between pb-1.5 border-b border-foreground/15 mb-2 text-[10px] font-label uppercase font-bold text-foreground">
                    <span>Action Item</span>
                    <span className="text-primary font-bold">!</span>
                  </div>
                  <p className="font-sticky text-xs text-foreground leading-snug">
                    Keep toolbars docked to left and bottom for unencumbered viewport workspace.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-label text-muted-foreground">
                    <span>Sprint 24</span>
                    <span>Done ✓</span>
                  </div>
                </div>

                {/* Connecting Vector Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
                  <path
                    d="M 230 140 C 270 170, 290 175, 340 160"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="text-foreground"
                  />
                  <path
                    d="M 520 180 C 600 200, 680 180, 720 160"
                    stroke="#D85A38"
                    strokeWidth="2.5"
                  />
                </svg>

                {/* Live Collaborator Cursors */}
                <div className="absolute top-36 left-96 flex items-center gap-1 z-20">
                  <MousePointer2 className="w-4 h-4 text-primary fill-primary" />
                  <span className="font-label text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 border border-foreground shadow-stamp-xs">
                    Maya S. [drawing]
                  </span>
                </div>

                <div className="absolute bottom-16 right-64 flex items-center gap-1 z-20 hidden sm:flex">
                  <MousePointer2 className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span className="font-label text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 border border-foreground shadow-stamp-xs">
                    Liam T.
                  </span>
                </div>
              </div>

              {/* Bottom Canvas Chrome Footer */}
              <div className="flex items-center justify-between border-t border-foreground px-4 py-2 bg-secondary/80 font-label text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>SCALE: 1:1</span>
                  <span>·</span>
                  <span>YJS CRDT v13.6</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span className="font-bold text-foreground">ALL PEERS CONVERGED</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: CRDT Protocol */}
        <section id="protocol" className="py-24 border-b border-foreground bg-secondary/30">
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
