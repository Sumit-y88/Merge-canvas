"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, GitMerge, KeyRound, LogOut, Mail, Save, Sparkles, UserRound } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { changePassword, getProfile, updateProfile } from "../api/profileApi";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ThemeToggle";

const Profile = () => {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user?.name || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#D85A38");
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setName(data.name);
        setAvatarColor(data.avatarColor || "#D85A38");
        updateUser(data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load your profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [updateUser]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError("");
    setProfileMessage("");
    setProfileSaving(true);
    try {
      const data = await updateProfile({ name, avatarColor });
      setProfile(data);
      updateUser(data);
      setProfileMessage("Profile updated successfully");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update your profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    setError("");
    setPasswordMessage("");
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      const data = await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to change your password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const joinedDate = profile?.createdAt
    ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(profile.createdAt))
    : "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-foreground font-body select-none">
      {/* Top App Bar */}
      <header className="h-14 border-b border-foreground bg-surface shadow-stamp flex items-center justify-between px-4 sm:px-6 relative z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 pr-3 border-r border-foreground/20 hover:opacity-85 transition-opacity"
            title="Back to dashboard"
          >
            <div className="w-8 h-8 rounded-DEFAULT bg-primary flex items-center justify-center text-white border-[1.5px] border-foreground shadow-stamp-xs">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-headline text-base font-bold text-foreground hidden sm:inline">
              MergeCanvas
            </span>
          </button>
          <span className="font-label text-xs uppercase font-bold text-muted-foreground">
            Draftsman Settings
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative bg-dot-matrix px-4 sm:px-6 py-10 sm:py-14 min-h-[calc(100vh-56px)]">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-foreground/20">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-DEFAULT bg-secondary border border-foreground font-label text-[10px] uppercase font-bold text-foreground mb-2">
                <span>IDENTITY SPEC // REF 04</span>
              </div>
              <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Your Atelier Presence
              </h1>
              <p className="font-body text-xs text-muted-foreground mt-1">
                Customize how your cursor, avatar monogram, and annotations appear to collaborators.
              </p>
            </div>
            <span className="font-mono text-xs text-emerald-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Synced to Yjs
            </span>
          </div>

          {/* Identity Card with Washi Tape */}
          <div className="relative bg-surface border-[2px] border-foreground rounded-DEFAULT p-6 sm:p-8 shadow-stamp-lg overflow-hidden">
            <div className="washi-tape absolute -top-3 left-10 w-28 h-5 pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-16 h-16 rounded-full border-[2px] border-foreground bg-secondary flex items-center justify-center font-headline text-2xl font-bold text-foreground shadow-stamp-xs">
                {name ? name.slice(0, 2).toUpperCase() : "MC"}
              </div>
              <div className="min-w-0">
                <span className="font-label text-[10px] uppercase font-bold text-primary block">
                  ACTIVE DRAFTSMAN
                </span>
                <h2 className="font-headline text-2xl font-bold truncate text-foreground">
                  {profile?.name || "Anonymous Maker"}
                </h2>
                <p className="font-body text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  {profile?.email}
                </p>
                {joinedDate && (
                  <p className="font-label text-[11px] text-muted-foreground mt-1">
                    Atelier member since {joinedDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-DEFAULT border-[1.5px] border-destructive bg-destructive/10 px-4 py-3 font-label text-xs font-bold text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile details */}
            <div className="bg-surface border-[1.5px] border-foreground rounded-DEFAULT p-5 shadow-stamp space-y-4">
              <div className="border-b border-foreground/15 pb-2">
                <h3 className="font-headline text-base font-bold flex items-center gap-2 text-foreground">
                  <UserRound className="w-4 h-4 text-primary" />
                  Draftsman Details
                </h3>
                <p className="font-body text-xs text-muted-foreground">
                  Update your display signature and collaborative cursor ink tone.
                </p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <Input
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                />
                <Input
                  label="Work Email"
                  value={profile?.email || ""}
                  readOnly
                  leftIcon={<Mail className="w-4 h-4" />}
                  helperText="Email changes require system admin approval."
                />

                <div className="flex items-center justify-between rounded-DEFAULT border-[1.5px] border-foreground bg-secondary px-3 py-2">
                  <div>
                    <p className="font-label text-xs font-bold text-foreground">Cursor Ink Well</p>
                    <p className="font-body text-[11px] text-muted-foreground">Color of your pointer in live rooms.</p>
                  </div>
                  <input
                    aria-label="Cursor color"
                    type="color"
                    value={avatarColor}
                    onChange={(e) => setAvatarColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-DEFAULT border border-foreground bg-transparent p-0.5"
                  />
                </div>

                {profileMessage && (
                  <p className="font-label text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {profileMessage}
                  </p>
                )}

                <Button type="submit" variant="primary" size="sm" isLoading={profileSaving} leftIcon={<Save className="w-3.5 h-3.5" />}>
                  Save Details
                </Button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-surface border-[1.5px] border-foreground rounded-DEFAULT p-5 shadow-stamp space-y-4">
              <div className="border-b border-foreground/15 pb-2">
                <h3 className="font-headline text-base font-bold flex items-center gap-2 text-foreground">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Security Credential
                </h3>
                <p className="font-body text-xs text-muted-foreground">
                  Change password used for workshop access.
                </p>
              </div>

              <form onSubmit={handlePasswordSave} className="space-y-3">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((c) => ({ ...c, currentPassword: e.target.value }))}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((c) => ({ ...c, newPassword: e.target.value }))}
                  minLength={6}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((c) => ({ ...c, confirmPassword: e.target.value }))}
                  minLength={6}
                  required
                />

                {passwordMessage && (
                  <p className="font-label text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {passwordMessage}
                  </p>
                )}

                <Button type="submit" variant="outline" size="sm" isLoading={passwordSaving} leftIcon={<KeyRound className="w-3.5 h-3.5" />}>
                  Update Password
                </Button>
              </form>
            </div>
          </div>

          {/* Sign out */}
          <div className="bg-surface border-[1.5px] border-foreground rounded-DEFAULT p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-stamp-xs">
            <div>
              <p className="font-label text-xs font-bold text-foreground">Sign out of Atelier</p>
              <p className="font-body text-xs text-muted-foreground">End this drafting session on this device.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
              Log out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
