"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { signup } from "../api/auth";
import useAuth from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import GoogleSignInButton from "../components/GoogleSignInButton";
import AuthPageShell from "../components/AuthPageShell";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const router = useRouter();

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) errs.email = "Work email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const data = await signup({ name, email, password });
      saveAuth(data);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Signup failed";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = password.length >= 6;

  return (
    <AuthPageShell activeTab="signup">
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="p-3 rounded-DEFAULT bg-destructive/10 border-[1.5px] border-destructive text-destructive text-xs font-label font-bold flex items-center gap-2 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <Input
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          leftIcon={<User className="w-4 h-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
          required
        />

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

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          {password.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5 text-[10px] font-label">
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                  isPasswordValid
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Check className="w-2.5 h-2.5" />
              </span>
              <span className={isPasswordValid ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                {isPasswordValid ? "Password meets strength requirement" : "At least 6 characters required"}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full h-11 text-xs font-label uppercase tracking-wider font-bold shadow-stamp-md flex items-center justify-center gap-2 group"
          >
            <span>Claim Workbench</span>
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
            Already have a workbench?{" "}
            <Link href="/login" className="text-primary hover:underline font-label font-bold">
              Sign in to studio
            </Link>
          </p>
        </div>
      </form>
    </AuthPageShell>
  );
};

export default Signup;
