"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export function RequireAuth({ children }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, router, token]);

  if (loading || !token) return <LoadingScreen />;
  return children;
}

export function GuestOnly({ children }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && token) router.replace("/dashboard");
  }, [loading, router, token]);

  if (loading || token) return <LoadingScreen />;
  return children;
}

export default RequireAuth;
