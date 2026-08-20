import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleLogin } from "../api/authApi";
import useAuth from "../hooks/useAuth";

const GoogleSignInButton = () => {
  const buttonRef = useRef(null);
  const [error, setError] = useState("");
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const renderButton = () => {
      if (cancelled) return;
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        setError("Google Sign-In is not configured");
        return;
      }
      if (!window.google?.accounts?.id || !buttonRef.current) {
        if (attempts++ < 50) window.setTimeout(renderButton, 100);
        else setError("Google Sign-In is unavailable");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            setError("");
            const data = await googleLogin(credential);
            saveAuth(data);
            navigate("/dashboard");
          } catch (requestError) {
            setError(requestError.response?.data?.message || "Google sign-in failed");
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };

    renderButton();
    return () => {
      cancelled = true;
    };
  }, [navigate, saveAuth]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={buttonRef} />
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default GoogleSignInButton;
