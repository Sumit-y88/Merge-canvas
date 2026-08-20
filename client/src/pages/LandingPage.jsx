import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Pencil,
  WifiOff,
  Wifi,
  Users,
  GitMerge,
  ChevronRight,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import Canvas from "../components/canvas/Canvas";
import Button from "../components/ui/Button";
import useHomeAnimations from "../hooks/useHomeAnimations";
import useHeroScrollAnimation from "../hooks/useHeroScrollAnimation";

/* Inline GitHub SVG since lucide-react dropped brand icons */
const GithubIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);


/* ─── Intersection Observer hook for scroll-triggered animations ─── */
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.15, ...options }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isVisible];
};

/* ─── Animated cursor SVG for the sync story ─── */
/* ─── Pre-populated demo elements for the hero canvas ─── */
const demoElements = [
  {
    id: "demo-rect-1",
    type: "rectangle",
    x: 80,
    y: 60,
    width: 200,
    height: 120,
    strokeColor: "var(--primary)",
    fillColor: "transparent",
    strokeWidth: 2,
    strokeStyle: "solid",
    rotation: 0,
  },
  {
    id: "demo-ellipse-1",
    type: "ellipse",
    x: 360,
    y: 80,
    width: 140,
    height: 100,
    strokeColor: "var(--warning)",
    fillColor: "transparent",
    strokeWidth: 2,
    strokeStyle: "solid",
    rotation: 0,
  },
  {
    id: "demo-text-1",
    type: "text",
    x: 120,
    y: 240,
    text: "Draw together",
    fontSize: 22,
    strokeColor: "var(--primary)",
    fillColor: "transparent",
    strokeWidth: 1,
    width: 200,
  },
  {
    id: "demo-sticky-1",
    type: "sticky",
    x: 340,
    y: 220,
    width: 160,
    height: 120,
    fillColor: "#fef08a",
    strokeColor: "#eab308",
    strokeWidth: 1,
    text: "Even offline!",
    fontSize: 15,
    rotation: -2,
  },
  {
    id: "demo-arrow-1",
    type: "arrow",
    x: 280,
    y: 120,
    width: 80,
    height: 0,
    strokeColor: "var(--success)",
    fillColor: "transparent",
    strokeWidth: 3,
    strokeStyle: "solid",
    points: [
      { x: 280, y: 130 },
      { x: 360, y: 130 },
    ],
  },
  {
    id: "demo-freehand-1",
    type: "freehand",
    strokeColor: "#ec4899",
    fillColor: "transparent",
    strokeWidth: 3,
    strokeStyle: "solid",
    points: [
      { x: 550, y: 60 },
      { x: 560, y: 70 },
      { x: 570, y: 65 },
      { x: 580, y: 80 },
      { x: 590, y: 75 },
      { x: 600, y: 90 },
      { x: 610, y: 85 },
      { x: 620, y: 100 },
      { x: 625, y: 110 },
      { x: 620, y: 125 },
      { x: 610, y: 140 },
      { x: 595, y: 150 },
      { x: 575, y: 155 },
      { x: 560, y: 148 },
      { x: 550, y: 135 },
      { x: 545, y: 120 },
      { x: 548, y: 100 },
      { x: 550, y: 80 },
    ],
  },
];

/* ─── Sync story steps ─── */
const syncSteps = [
  {
    icon: Users,
    tag: "01",
    title: "Two users draw simultaneously",
    body: "User A and User B both connect to the same room. Each keystroke, each shape, each freehand stroke is broadcast in real time through Socket.io. Both users see live cursors — colored, labeled, moving fluidly.",
    visual: "collab",
    color: "bg-primary text-primary-foreground",
    dotColor: "bg-primary",
  },
  {
    icon: WifiOff,
    tag: "02",
    title: "User B loses connection",
    body: "The network drops. But the canvas doesn't freeze — User B's local Yjs CRDT document keeps accepting edits. No error modal, no read-only lock. The UI shows a subtle offline indicator and continues working.",
    visual: "offline",
    color: "bg-amber-600 text-white",
    dotColor: "bg-amber-600",
  },
  {
    icon: Pencil,
    tag: "03",
    title: "Both keep drawing independently",
    body: "User A adds three rectangles. User B draws freehand annotations. Neither knows what the other is doing. Two divergent histories of the same document exist simultaneously — this is where most real-time tools break.",
    visual: "diverge",
    color: "bg-rose-600 text-white",
    dotColor: "bg-rose-600",
  },
  {
    icon: GitMerge,
    tag: "04",
    title: "Reconnect → automatic CRDT merge",
    body: "User B comes back online. Yjs merges both edit histories using Conflict-free Replicated Data Types — not last-write-wins, not manual conflict resolution. Every stroke from both users is preserved. Nothing is lost.",
    visual: "merge",
    color: "bg-emerald-600 text-white",
    dotColor: "bg-emerald-600",
  },
];

/* ─── Capability items ─── */
const capabilities = [
  {
    label: "realtime.collab",
    title: "Real-time collaborative drawing",
    desc: "Shapes, freehand, text, sticky notes, arrows — all synchronized across connected clients instantly via Socket.io WebSockets.",
  },
  {
    label: "offline.sync",
    title: "Offline-first via CRDTs",
    desc: "Yjs manages a conflict-free replicated document. Edits persist locally in the CRDT, and merge automatically when the connection returns.",
  },
  {
    label: "presence.cursors",
    title: "Live cursors & presence",
    desc: "Every connected user gets a colored cursor visible to all others. You see who's drawing, where they're drawing, and what tool they're using — in real time.",
  },
  {
    label: "room.permissions",
    title: "Room-based access control",
    desc: "Owner, editor, and viewer roles per room. Rooms are created instantly and shared via invite links. Permissions are enforced server-side.",
  },
];

/* ─── Tech stack items ─── */
const techStack = [
  { name: "React", desc: "UI layer" },
  { name: "Canvas API", desc: "Rendering" },
  { name: "Yjs", desc: "CRDT engine" },
  { name: "Socket.io", desc: "Real-time transport" },
  { name: "Node.js", desc: "Server runtime" },
  { name: "MongoDB", desc: "Persistence" },
];

/* ─── Small visual vignettes for sync story ─── */
const SyncVisual = ({ type }) => {
  if (type === "collab") {
    return (
      <div className="relative w-full h-32 rounded-xl bg-card/60 border border-border/40 overflow-hidden">
        <svg viewBox="0 0 320 128" className="w-full h-full" fill="none">
          {/* User A path */}
          <path
            d="M 30 90 Q 80 20, 140 60 T 250 50"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="250"
            strokeDashoffset="250"
            className="landing-draw-path"
          />
          {/* User B path */}
          <path
            d="M 60 110 Q 120 50, 180 80 T 290 40"
            stroke="hsl(var(--warning))"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="250"
            strokeDashoffset="250"
            className="landing-draw-path"
            style={{ animationDelay: "400ms" }}
          />
          {/* Cursor A */}
          <circle r="4" fill="hsl(var(--primary))" opacity="0.9">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path="M 30 90 Q 80 20, 140 60 T 250 50"
            />
          </circle>
          {/* Cursor B */}
          <circle r="4" fill="hsl(var(--warning))" opacity="0.9">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              begin="0.4s"
              path="M 60 110 Q 120 50, 180 80 T 290 40"
            />
          </circle>
        </svg>
        <div className="absolute top-2 right-2 flex gap-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono">
            User A
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
            User B
          </span>
        </div>
      </div>
    );
  }

  if (type === "offline") {
    return (
      <div className="relative w-full h-32 rounded-xl bg-card/60 border border-border/40 overflow-hidden">
        <svg viewBox="0 0 320 128" className="w-full h-full" fill="none">
          {/* A keeps drawing */}
          <path
            d="M 40 80 Q 90 30, 160 60"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="150"
            strokeDashoffset="150"
            className="landing-draw-path"
          />
          {/* B's path frozen */}
          <path
            d="M 200 90 L 260 90"
            stroke="hsl(var(--warning))"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
            strokeDasharray="6 6"
          />
          {/* Disconnected line */}
          <line
            x1="160"
            y1="10"
            x2="160"
            y2="118"
            stroke="hsl(var(--destructive))"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          <circle r="4" fill="hsl(var(--primary))" opacity="0.9">
            <animateMotion
              dur="2.5s"
              repeatCount="indefinite"
              path="M 40 80 Q 90 30, 160 60"
            />
          </circle>
        </svg>
        <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-mono">
          <WifiOff className="w-2.5 h-2.5" /> disconnected
        </div>
        <div className="absolute top-2 right-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono">
            User A online
          </span>
        </div>
      </div>
    );
  }

  if (type === "diverge") {
    return (
      <div className="relative w-full h-32 rounded-xl bg-card/60 border border-border/40 overflow-hidden">
        <svg viewBox="0 0 320 128" className="w-full h-full" fill="none">
          {/* A side — rectangles */}
          <rect
            x="20"
            y="25"
            width="55"
            height="35"
            rx="4"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            fill="hsl(var(--primary) / 0.03)"
          />
          <rect
            x="30"
            y="75"
            width="45"
            height="30"
            rx="4"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            fill="hsl(var(--primary) / 0.03)"
          />
          <rect
            x="85"
            y="50"
            width="50"
            height="35"
            rx="4"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            fill="hsl(var(--primary) / 0.03)"
          />
          {/* divider */}
          <line
            x1="160"
            y1="10"
            x2="160"
            y2="118"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          {/* B side — freehand */}
          <path
            d="M 180 40 C 200 20, 230 60, 250 35 S 280 55, 300 30"
            stroke="hsl(var(--warning))"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="200"
            strokeDashoffset="200"
            className="landing-draw-path"
            style={{ animationDelay: "300ms" }}
          />
          <path
            d="M 190 80 C 210 60, 240 100, 260 75 S 290 95, 305 70"
            stroke="hsl(var(--warning))"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="200"
            strokeDashoffset="200"
            className="landing-draw-path"
            style={{ animationDelay: "600ms" }}
          />
        </svg>
        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-muted-foreground">
          history A
        </div>
        <div className="absolute bottom-2 right-3 text-[10px] font-mono text-muted-foreground">
          history B
        </div>
      </div>
    );
  }

  if (type === "merge") {
    return (
      <div className="relative w-full h-32 rounded-xl bg-card/60 border border-border/40 overflow-hidden">
        <svg viewBox="0 0 320 128" className="w-full h-full" fill="none">
          {/* merged elements — all present */}
          <rect
            x="20"
            y="25"
            width="50"
            height="30"
            rx="4"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            fill="hsl(var(--primary) / 0.06)"
          />
          <rect
            x="80"
            y="50"
            width="45"
            height="30"
            rx="4"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            fill="hsl(var(--primary) / 0.06)"
          />
          <path
            d="M 140 30 C 170 15, 200 50, 230 25 S 270 40, 300 20"
            stroke="hsl(var(--warning))"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 150 80 C 180 60, 210 95, 240 70 S 280 85, 305 65"
            stroke="hsl(var(--warning))"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <rect
            x="25"
            y="75"
            width="40"
            height="28"
            rx="4"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            fill="hsl(var(--primary) / 0.06)"
          />
          {/* merge indicator */}
          <path
            d="M 160 118 L 160 95"
            stroke="hsl(var(--success))"
            strokeWidth="2"
            strokeLinecap="round"
            className="landing-merge-line"
          />
          <circle
            cx="160"
            cy="92"
            r="4"
            fill="hsl(var(--success))"
            className="landing-merge-dot"
          />
        </svg>
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono">
          <Wifi className="w-2.5 h-2.5" /> synced
        </div>
      </div>
    );
  }

  return null;
};

/* ─────────────────────────────────────────────────────── */
/*                    LANDING PAGE                         */
/* ─────────────────────────────────────────────────────── */
const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [demoTool, setDemoTool] = useState("Freehand");
  const homeRef = useRef(null);
  const heroRef = useRef(null);
  useHomeAnimations(homeRef);
  useHeroScrollAnimation(heroRef);

  /* Nav transparency → glass on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Intersection observers for each section */
  const [syncRef] = useInView();
  const [capRef] = useInView();
  const [techRef] = useInView();
  const [ctaRef] = useInView();

  return (
    <div ref={homeRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ──── NAV ──── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-panel shadow-sm py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <GitMerge className="w-4 h-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Merge<span className="text-primary">Canvas</span>
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Try it <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── HERO ──── */}
      <section ref={heroRef} data-hero className="relative pt-28 pb-12 lg:pt-36 lg:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.42fr_0.58fr] gap-10 lg:gap-6 items-start">
            {/* Left — Copy */}
            <div className="lg:pt-10 lg:pr-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
                <GitMerge className="w-3 h-3" />
                CRDT-powered offline-first sync
              </div>

              <h1 data-home-animate className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.1] tracking-tight mb-5">
                <span data-hero-word className="inline-block">Draw together.</span>{" "}
                <span data-hero-word className="inline-block text-primary">Lose connection.</span>{" "}
                <span data-hero-word className="inline-block">Keep drawing.</span>{" "}
                <span data-hero-word className="inline-block text-muted-foreground font-normal text-3xl sm:text-4xl lg:text-[2.5rem]">Nothing is lost.</span>
              </h1>

              <p className="text-muted-foreground text-base lg:text-lg leading-relaxed mb-8 max-w-md">
                A real-time collaborative whiteboard where multiple users
                draw on the same canvas simultaneously. When someone goes
                offline, their edits merge back automatically — no
                conflicts, no overwrites — powered by CRDTs via Yjs.
              </p>

              <div className="flex items-center gap-4">
                <Link to="/signup">
                  <Button variant="primary" size="lg">
                    Create a room
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <GithubIcon className="w-4 h-4" />
                  Source code
                </a>
              </div>
            </div>

            {/* Right — Live Canvas */}
            <div data-hero-parallax data-home-animate className="relative lg:-mr-6 xl:-mr-12">
              {/* Mini toolbar for demo */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1 glass-panel rounded-xl px-2 py-1.5 shadow-sm">
                {[["Select", "Select"], ["Pen", "Freehand"], ["Rectangle", "Rectangle"], ["Ellipse", "Ellipse"], ["Text", "Text"]].map(
                  (t) => (
                    <button
                      key={t[0]}
                      onClick={() => setDemoTool(t[0])}
                      className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${
                        demoTool === t[0]
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {t[1]}
                    </button>
                  )
                )}
              </div>

              {/* Status badges */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                  live demo
                </span>
              </div>

              {/* Canvas container */}
              <div className="relative rounded-2xl lg:rounded-r-none overflow-hidden border border-border/50 shadow-glass bg-background h-[400px] sm:h-[460px] lg:h-[520px]">
                <Canvas
                  tool={demoTool}
                  color="var(--primary)"
                  fillColor="transparent"
                  strokeWidth={3}
                  strokeStyle="solid"
                  stickyColor="#fef08a"
                  gridStyle="dot"
                  snapToGrid={false}
                  initialElements={demoElements}
                  readOnly={false}
                  onToolChange={(t) => setDemoTool(t)}
                />
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  viewBox="0 0 640 520"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    data-hero-stroke
                    d="M80 130 C140 75 210 190 280 130 S420 70 520 150"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    data-hero-stroke
                    d="M90 300 C150 250 205 350 270 285 S410 245 530 330"
                    fill="none"
                    stroke="hsl(var(--success))"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Faux presence bar */}
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center text-primary-foreground font-bold">
                    Y
                  </div>
                  <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center text-[10px] text-white font-bold">
                    A
                  </div>
                </div>
                <span className="font-mono">2 users drawing</span>
                <span className="ml-auto font-mono opacity-60">
                  try it — draw something ↑
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── HOW SYNC WORKS ──── */}
      <section ref={syncRef} className="py-20 lg:py-28 relative">
        {/* Vertical connector line */}
        <div
          className="absolute left-1/2 top-32 bottom-24 w-px bg-border/60 hidden lg:block"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16 lg:mb-20">
            <span className="text-xs font-mono text-primary tracking-wider uppercase">
              How the sync works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 mb-4">
              Offline-first CRDT merge,{" "}
              <span className="text-muted-foreground font-normal">
                not just real-time broadcast.
              </span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
              Most "real-time" tools only work while you're connected. MergeCanvas
              uses Yjs — a CRDT library — so every client maintains its own
              document replica. Edits are merged mathematically, not by
              timestamp ordering. Here's what that actually looks like:
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-16 lg:space-y-0 lg:grid lg:grid-rows-4 lg:gap-0">
            {syncSteps.map((step, i) => {
              const isRight = i % 2 === 1;
              return (
                <div
                  data-sync-step
                  key={step.tag}
                  className="relative lg:grid lg:grid-cols-2 lg:gap-16 items-center"
                >
                  {/* Connector dot on the center line */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${step.dotColor} hidden lg:block ring-4 ring-background z-10`}
                    style={{ top: "50%" }}
                    aria-hidden="true"
                  />

                  {/* Content & visual — alternate left/right */}
                  <div
                    className={`${
                      isRight ? "lg:col-start-2 lg:text-left" : "lg:col-start-1 lg:text-left"
                    }`}
                    style={{ order: isRight ? 2 : 1 }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`shrink-0 w-10 h-10 rounded-xl ${step.color} flex items-center justify-center shadow-sm`}
                      >
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-muted-foreground tracking-wider">
                          STEP {step.tag}
                        </span>
                        <h3 className="text-lg font-semibold tracking-tight mt-0.5">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-4 lg:mb-0">
                      {step.body}
                    </p>
                  </div>

                  <div
                    className={`${
                      isRight ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2"
                    }`}
                    style={{ order: isRight ? 1 : 2 }}
                  >
                    <SyncVisual type={step.visual} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──── CORE CAPABILITIES ──── */}
      <section ref={capRef} data-capabilities className="py-20 lg:py-28 bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-mono text-primary tracking-wider uppercase">
              Core capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3">
              What's actually built.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {capabilities.map((cap) => (
              <div
                data-capability
                key={cap.label}
                className="group relative p-6 rounded-2xl border border-border/50 bg-background/60 hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-500"
              >
                {/* Left accent */}
                <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full bg-border group-hover:bg-primary transition-colors" />

                <span className="text-xs font-mono text-primary/70 tracking-wide">
                  {cap.label}
                </span>
                <h3 className="text-base font-semibold mt-2 mb-2 tracking-tight">
                  {cap.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── PROJECT SNAPSHOT ──── */}
      <section className="py-16 lg:py-20 border-y border-border/40 bg-primary/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              ["2", "collaborators", ""],
              ["0", "conflicts", ""],
              ["100", "offline-safe edits", "%"],
              ["24", "hour session", "/7"],
            ].map(([target, label, suffix]) => (
              <div key={label} className="text-center">
                <div data-stat data-stat-target={target} data-stat-suffix={suffix} className="text-3xl sm:text-4xl font-bold text-primary" aria-label={`${target}${suffix} ${label}`}>
                  0{suffix}
                </div>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-mono">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── TECH STACK ──── */}
      <section ref={techRef} data-tech-section className="py-16 lg:py-20 border-t border-border/40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-16 mb-10">
            <div>
              <span className="text-xs font-mono text-primary tracking-wider uppercase">
                Under the hood
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3">
                How it's built.
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md lg:pb-1">
              A portfolio-grade implementation of real-time collaborative
              editing with offline-first conflict resolution. Built to
              demonstrate distributed systems thinking, not to sell SaaS.
            </p>
          </div>

          {/* Stack chain */}
          <div
            className="flex flex-wrap items-stretch gap-0"
          >
            {techStack.map((tech, i) => (
              <div key={tech.name} className="flex items-stretch">
                <div
                  data-tech-card
                  className="flex flex-col justify-center px-5 py-4 border border-border/50 bg-card/60 hover:bg-primary/[0.04] hover:border-primary/30 transition-colors first:rounded-l-xl last:rounded-r-xl"
                  style={{
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  <span className="text-sm font-semibold font-mono">
                    {tech.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {tech.desc}
                  </span>
                </div>
                {i < techStack.length - 1 && (
                  <div className="flex items-center text-muted-foreground/40 px-1">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section ref={ctaRef} data-cta className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div
            data-cta-content
            className="max-w-lg"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Create a room.{" "}
              <span className="text-muted-foreground">
                Start drawing. Invite someone.
              </span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-md">
              No setup required. Create a whiteboard room, share the invite
              link, and start collaborating. Try going offline mid-session —
              your edits will merge when you return.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/signup">
                <Button variant="primary" size="lg">
                  Create a room
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
              <GitMerge className="w-3 h-3" />
            </div>
            <span>
              MergeCanvas — built by{" "}
              <span className="text-foreground font-medium">Sumit Yadav</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
