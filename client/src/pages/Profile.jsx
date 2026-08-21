import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, GitMerge, KeyRound, LogOut, Mail, Save, Sparkles, UserRound } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { changePassword, getProfile, updateProfile } from "../api/profileApi";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ThemeToggle";

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user?.name || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#6b7280");
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
        setAvatarColor(data.avatarColor || "#6b7280");
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
      setProfileMessage("Profile updated");
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
    navigate("/login");
  };

  const joinedDate = profile?.createdAt
    ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(profile.createdAt))
    : "";

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <header className="h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 relative z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} title="Back to dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm"><GitMerge className="w-4 h-4" /></div>
            <span className="font-semibold tracking-tight hidden sm:inline">Merge<span className="text-primary">Canvas</span></span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative px-4 sm:px-6 py-10 sm:py-14">
        <div className="absolute -top-52 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-48 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto space-y-6 relative">
          <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-7 lg:gap-12 items-end mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-5"><Sparkles className="w-3 h-3" /> Your account</div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">Your canvas, <span className="text-primary">your presence.</span></h1>
              <p className="text-muted-foreground mt-3 leading-relaxed max-w-xl">Keep your details current and make your collaboration identity feel like you.</p>
            </div>
            <div className="hidden lg:flex items-center justify-end gap-3 text-xs font-mono text-muted-foreground"><span className="w-2 h-2 bg-success rounded-full animate-pulse" /> account synced</div>
          </section>

        <Card className="glass-card border-border/60 shadow-glass">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative w-fit rounded-full bg-gradient-to-br from-primary/60 via-accent/40 to-primary/20 p-1">
              <Avatar name={name || "User"} size="xl" status="online" statusColor={avatarColor} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-primary mb-1">Collaboration identity</p>
              <h2 className="text-2xl font-bold truncate">{profile?.name || "Your profile"}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5" />{profile?.email}</p>
              {joinedDate && <p className="text-xs text-muted-foreground mt-2">Member since {joinedDate}</p>}
            </div>
          </CardContent>
        </Card>

        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card/70 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserRound className="w-5 h-5 text-primary" />Profile details</CardTitle>
              <CardDescription>Choose the name and color collaborators see in your rooms.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <Input label="Display name" value={name} onChange={(event) => setName(event.target.value)} minLength="2" maxLength="80" required />
                <Input label="Email address" value={profile?.email || ""} readOnly leftIcon={<Mail className="w-4 h-4" />} helperText="Email changes are not available yet." />
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3">
                  <div><p className="text-sm font-medium">Cursor color</p><p className="text-xs text-muted-foreground">Used for your live collaboration cursor.</p></div>
                  <input aria-label="Cursor color" type="color" value={avatarColor} onChange={(event) => setAvatarColor(event.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1" />
                </div>
                {profileMessage && <p className="text-sm text-success flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{profileMessage}</p>}
                <Button type="submit" isLoading={profileSaving} leftIcon={<Save className="w-4 h-4" />}>Save profile</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" />Change password</CardTitle>
              <CardDescription>Use at least six characters and keep it unique.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <Input label="Current password" type="password" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} required />
                <Input label="New password" type="password" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} minLength="6" required />
                <Input label="Confirm new password" type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))} minLength="6" required />
                {passwordMessage && <p className="text-sm text-success flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{passwordMessage}</p>}
                <Button type="submit" variant="outline" isLoading={passwordSaving} leftIcon={<KeyRound className="w-4 h-4" />}>Update password</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-primary/[0.035]">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><p className="font-medium">Sign out of MergeCanvas</p><p className="text-sm text-muted-foreground">End this session on this device.</p></div>
            <Button variant="ghost" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />}>Log out</Button>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
