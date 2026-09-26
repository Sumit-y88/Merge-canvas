"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { login } from "../api/auth";
import useAuth from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import GoogleSignInButton from "../components/GoogleSignInButton";
import AuthPageShell from "../components/AuthPageShell";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const router = useRouter();

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = "Work email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const data = await login({ email, password });
      saveAuth(data);
      router.push("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Login failed";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell activeTab="login">
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 rounded-DEFAULT bg-destructive/10 border-[1.5px] border-destructive text-destructive text-xs font-label font-bold flex items-center gap-2 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <Input
          label="Work Email"
          type="email"
          placeholder="architect@studio.design"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full h-11 text-xs font-label uppercase tracking-wider font-bold shadow-stamp-md flex items-center justify-center gap-2 group"
          >
            <span>Enter Studio</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

        {/* Studio Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-foreground/30" />
          </div>
          <span className="relative bg-surface px-2 font-label text-[10px] uppercase font-bold text-muted-foreground">
            — OR QUICK CONNECT —
          </span>
        </div>

        <div className="flex justify-center">
          <GoogleSignInButton />
        </div>

        <div className="mt-4 pt-3 border-t border-foreground/15 text-center">
          <p className="font-body text-xs text-muted-foreground">
            Don't have an atelier yet?{" "}
            <Link href="/signup" className="text-primary hover:underline font-label font-bold">
              Sign up for free
            </Link>
          </p>
        </div>
      </form>
    </AuthPageShell>
  );
};

export default Login;
