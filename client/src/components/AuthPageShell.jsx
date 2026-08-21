import { Link } from "react-router-dom";
import { GitMerge } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const AuthPageShell = ({ children }) => (
  <main className="auth-page relative flex min-h-screen items-start justify-center overflow-x-hidden overflow-y-auto bg-background px-4 pb-10 pt-24 sm:items-center sm:p-6">
    <div className="absolute left-4 top-4 z-20 sm:left-5 sm:top-5"><Link to="/" className="flex items-center gap-2 font-semibold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground"><GitMerge className="h-4 w-4" /></span>Merge<span className="text-primary">Canvas</span></Link></div>
    <div className="absolute right-4 top-4 z-20 sm:right-5 sm:top-5"><ThemeToggle /></div>
    <div className="auth-page__grid absolute inset-0" aria-hidden="true" />
    <div className="auth-page__glow auth-page__glow--primary absolute" aria-hidden="true" />
    <div className="auth-page__glow auth-page__glow--secondary absolute" aria-hidden="true" />

    <svg
      className="auth-page__network pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      fill="none"
      aria-hidden="true"
    >
      <path className="auth-page__path auth-page__path--one" d="M-80 610C130 480 190 690 370 535S650 245 820 360s230 50 460-145" />
      <path className="auth-page__path auth-page__path--two" d="M-100 210C100 350 245 90 430 220s250 300 430 175 245-100 440 20" />
      <circle className="auth-page__node auth-page__node--one" cx="370" cy="535" r="7" />
      <circle className="auth-page__node auth-page__node--two" cx="820" cy="360" r="7" />
      <circle className="auth-page__node auth-page__node--three" cx="430" cy="220" r="7" />
    </svg>

    <div className="relative z-10 w-full max-w-md">{children}</div>
  </main>
);

export default AuthPageShell;
