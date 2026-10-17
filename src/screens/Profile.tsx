"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Save,
  UserRound,
  Camera,
  Trash2,
  Palette,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { changePassword, getProfile, updateProfile } from "../api/profileApi";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Avatar from "../components/ui/Avatar";
import ThemeToggle from "../components/ThemeToggle";

const PIGMENT_SWATCHES = [
  { name: "Terracotta", value: "#D85A38" },
  { name: "Cobalt Blue", value: "#2563EB" },
  { name: "Sage Mint", value: "#2E7D32" },
  { name: "Canary Ochre", value: "#D97706" },
  { name: "Coral Rose", value: "#E11D48" },
  { name: "Deep Cyan", value: "#0891B2" },
  { name: "Studio Violet", value: "#7C3AED" },
  { name: "Carbon Ink", value: "#1C1A17" },
];

const Profile = () => {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user?.name || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#D85A38");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setName(data.name);
        setAvatarColor(data.avatarColor || "#D85A38");
        setAvatar(data.avatar || "");
        updateUser(data);
      } catch (requestError: any) {
        setError(requestError.response?.data?.message || "Unable to load your profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [updateUser]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 180;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatar(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError("");
    setProfileMessage("");
    setProfileSaving(true);
    try {
      const data = await updateProfile({ name, avatarColor, avatar });
      setProfile(data);
      updateUser(data);
      setProfileMessage("Profile and avatar updated successfully");
    } catch (requestError: any) {
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
      {/* Hidden file input for Avatar upload */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />

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
              <div className="relative group">
                <Avatar
                  name={name || profile?.name}
                  color={avatarColor}
                  src={avatar}
                  size="xl"
                  status="online"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-white border border-foreground shadow-stamp-xs hover:scale-110 transition-transform"
                  title="Upload profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
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
                  Update your display signature, avatar pigment tone, and profile photo.
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

                {/* Avatar Appearance & Pigment Well */}
                <div className="rounded-DEFAULT border-[1.5px] border-foreground bg-secondary/60 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-label text-xs font-bold text-foreground">Avatar &amp; Cursor Pigment</p>
                      <p className="font-body text-[11px] text-muted-foreground">Color tone of your avatar &amp; room cursor.</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-label font-bold rounded-DEFAULT border border-foreground bg-surface hover:bg-secondary transition-colors shadow-stamp-xs"
                      >
                        <Camera className="w-3 h-3 text-primary" />
                        <span>{avatar ? "Change Photo" : "Upload Photo"}</span>
                      </button>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar("")}
                          className="p-1 rounded-DEFAULT border border-foreground/30 hover:bg-destructive/10 text-destructive transition-colors"
                          title="Remove custom photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pigment Swatches Grid */}
                  <div className="space-y-1.5">
                    <span className="font-label text-[10px] uppercase font-bold text-muted-foreground">Studio Palette:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {PIGMENT_SWATCHES.map((swatch) => {
                        const isSelected = avatarColor.toLowerCase() === swatch.value.toLowerCase();
                        return (
                          <button
                            key={swatch.value}
                            type="button"
                            onClick={() => setAvatarColor(swatch.value)}
                            title={swatch.name}
                            className={`w-7 h-7 rounded-DEFAULT border-[1.5px] border-foreground flex items-center justify-center transition-all shadow-stamp-xs ${
                              isSelected ? "scale-110 ring-2 ring-primary ring-offset-1" : "hover:scale-105 opacity-90 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: swatch.value }}
                          >
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                          </button>
                        );
                      })}

                      {/* Custom Color input */}
                      <div className="relative w-7 h-7 ml-1">
                        <input
                          aria-label="Custom pigment well"
                          type="color"
                          value={avatarColor}
                          onChange={(e) => setAvatarColor(e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div
                          className="w-7 h-7 rounded-DEFAULT border-[1.5px] border-foreground flex items-center justify-center bg-surface hover:bg-secondary transition-colors shadow-stamp-xs"
                          title="Custom pigment"
                        >
                          <Palette className="w-3.5 h-3.5 text-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
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
