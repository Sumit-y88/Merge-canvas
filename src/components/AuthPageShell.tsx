
"use client";

import Link from "next/link";
import { GitMerge, ArrowLeft, MousePointer2 } from "lucide-react";
import { type ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

export interface AuthPageShellProps {
  children: ReactNode;
  activeTab?: "login" | "signup";
}

const AuthPageShell = ({ children, activeTab = "login" }: AuthPageShellProps) => (
  <main className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-background text-foreground font-body select-none">
    {/* Background Dot Matrix */}
    <div className="absolute inset-0 bg-dot-matrix opacity-60 pointer-events-none" />

    {/* Header Navigation */}
    <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-foreground bg-surface shadow-stamp">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-bold tracking-tight text-foreground group"
      >
        <div className="w-8 h-8 rounded-DEFAULT bg-primary flex items-center justify-center text-white border-[1.5px] border-foreground shadow-stamp-xs group-hover:-rotate-3 transition-transform">
          <GitMerge className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-headline text-lg tracking-tight leading-none text-foreground">
            MergeCanvas
          </span>
          <span className="font-label text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Physical Drafting Kit v2.4
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 font-label text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-DEFAULT border border-transparent hover:border-foreground/30 hover:bg-secondary"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </Link>
        <div className="h-4 w-px bg-foreground/20 hidden sm:block" />
        <ThemeToggle />
      </div>
    </header>

    {/* Main Workspace Frame (12-column container from Stitch auth.html) */}
    <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 border-[2px] border-foreground bg-surface shadow-stamp-xl overflow-hidden rounded-DEFAULT">
        
        {/* LEFT SIDE: Editorial Studio Showcase (7 cols) */}
        <section className="lg:col-span-7 bg-surface border-b-[2px] lg:border-b-0 lg:border-r-[2px] border-foreground p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Architectural Header Spec */}
          <div className="flex items-center justify-between border-b border-foreground/20 pb-2 mb-6 text-xs font-label">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider text-muted-foreground font-bold">
                STUDIO SPEC // REF 092
              </span>
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
            <span className="font-mono text-muted-foreground hidden sm:inline">
              WORKSPACE: ARCHIVAL_VELLUM
            </span>
          </div>

          {/* Editorial Seraphic Quote */}
          <div className="space-y-3 mb-6">
            <blockquote className="font-headline text-2xl sm:text-3xl lg:text-4xl text-foreground font-bold leading-tight tracking-tight">
              “A blank sheet of paper and three sharp pencils will always beat a 60-slide deck.”
            </blockquote>
            <div className="flex items-center gap-2 text-muted-foreground font-label text-xs font-bold">
              <span className="h-px w-6 bg-foreground/40" />
              <span className="italic">The Studio Drafting Manifesto</span>
            </div>
          </div>

          {/* Illustrated Tactile Studio Vignette (Physical Drafting Table) */}
          <div className="relative bg-secondary/60 p-4 border-[1.5px] border-foreground shadow-stamp-md rounded-DEFAULT my-4 min-h-[220px] flex items-center justify-center overflow-hidden">
            {/* Background Drafting Metric Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-25 flex flex-col justify-between p-2 font-mono text-[8px] text-muted-foreground">
              <div className="flex justify-between">
                <span>X: 001.402</span>
                <span>GRID: 24MM</span>
                <span>Y: 088.119</span>
              </div>
              <div className="border-b border-dashed border-foreground w-full" />
              <div className="flex justify-between">
                <span>SCALE 1:1</span>
                <span>ROTATION: 0.00°</span>
                <span>CRDT CONVERGED</span>
              </div>
            </div>

            {/* Pinned Sticky Note 1: Canary Yellow with Washi Tape */}
            <div className="absolute top-3 left-4 sm:left-8 w-44 bg-[#FFF6CC] dark:bg-amber-950/80 border border-foreground shadow-stamp-md p-3 -rotate-3 transition-transform hover:rotate-0 z-10">
              <div className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-3" />
              <div className="flex justify-between items-center text-[9px] font-label font-bold text-muted-foreground mb-1 border-b border-foreground/20 pb-0.5">
                <span>NOTES // ARCHITECT</span>
                <span>✓</span>
              </div>
              <p className="font-sticky text-xs text-foreground leading-snug">
                Simultaneous drawing without locks or merge conflicts.
              </p>
            </div>

            {/* Sticky Note 2: Coral Pink */}
            <div className="absolute bottom-3 right-4 sm:right-8 w-44 bg-[#FDE2D2] dark:bg-rose-950/80 border border-foreground shadow-stamp-md p-3 rotate-3 z-10 hidden sm:block">
              <div className="washi-tape absolute -top-2.5 right-6 w-12 h-3 rotate-3" />
              <p className="font-sticky text-xs text-foreground leading-snug">
                ✓ Ink weight matched to 1.5px plotter rules.
              </p>
              <div className="mt-2 flex justify-between items-center text-[9px] font-label text-primary font-bold">
                <span>MAYA S.</span>
                <span>#DESIGN</span>
              </div>
            </div>

            {/* Simulated Live Cursor */}
            <div className="absolute top-10 right-16 z-20 pointer-events-none flex items-center gap-1">
              <MousePointer2 className="w-4 h-4 text-primary fill-primary" />
              <div className="bg-primary text-white text-[9px] font-label font-bold px-1.5 py-0.5 border border-foreground shadow-stamp-xs">
                Kenji R.
              </div>
            </div>
          </div>

          {/* Feature Summary Badge */}
          <div className="mt-4 pt-3 border-t border-foreground/20 flex flex-wrap items-center justify-between gap-2 text-foreground font-label text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Instant multiplayer</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Zero-lag CRDT engine</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-foreground" />
              <span>100% loss-free export</span>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE: Clean Tactile Authentication Form (5 cols) */}
        <section className="lg:col-span-5 bg-surface p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Header Block */}
            <div className="border-b border-foreground/20 pb-3 mb-5">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label text-[10px] text-primary uppercase font-bold tracking-wider">
                  ENTRY PORTAL
                </span>
                <span className="font-label text-[10px] text-muted-foreground font-mono">
                  FORM #01
                </span>
              </div>
              <h2 className="font-headline text-2xl font-bold text-foreground">
                {activeTab === "login" ? "Welcome to the Studio" : "Claim Your Workbench"}
              </h2>
              <p className="font-body text-xs text-muted-foreground mt-1">
                {activeTab === "login"
                  ? "Log in to access your persistent drafting boards and shared libraries."
                  : "Create an account to initialize collaborative canvases and invite peers."}
              </p>
            </div>

            {/* Authentication Tab Switcher */}
            <div className="grid grid-cols-2 gap-0 border-[1.5px] border-foreground p-0.5 bg-secondary mb-5">
              <Link
                href="/login"
                className={`py-1.5 font-label text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTab === "login"
                    ? "bg-surface border border-foreground shadow-stamp-xs text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className={`py-1.5 font-label text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTab === "signup"
                    ? "bg-surface border border-foreground shadow-stamp-xs text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </Link>
            </div>

            {/* Injected Form Content */}
            {children}
          </div>
        </section>

      </div>
    </div>

    {/* Studio Footer */}
    <footer className="relative z-20 py-3 px-6 border-t border-foreground bg-surface text-center font-label text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
        <p>© {new Date().getFullYear()} MergeCanvas Atelier. Handcrafted collaborative canvas.</p>
        <p className="font-mono text-[10px]">Next.js · Yjs · Socket.IO · Tailwind</p>
      </div>
    </footer>
  </main>
);

export default AuthPageShell;
