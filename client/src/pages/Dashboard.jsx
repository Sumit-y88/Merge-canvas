import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  LogOut,
  TicketCheck,
  Users,
  Clock,
  GitMerge,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { getRooms, createRoom, joinRoom } from "../api/roomApi";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import ThemeToggle from "../components/ThemeToggle";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  // Create room modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Join room modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  const fetchRooms = async () => {
    setRoomsLoading(true);
    setRoomsError("");
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      setRoomsError(err.response?.data?.message || "Failed to load rooms");
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    // Initial data loading is an async side effect; the helper owns its loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setCreateError("Room name is required");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      await createRoom(newRoomName.trim());
      setNewRoomName("");
      setShowCreateModal(false);
      fetchRooms();
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setJoinError("Invite code is required");
      return;
    }
    setJoinLoading(true);
    setJoinError("");
    try {
      const room = await joinRoom(inviteCode.trim());
      setInviteCode("");
      setShowJoinModal(false);
      // Navigate to the joined room
      navigate(`/room/${room._id}`);
    } catch (err) {
      setJoinError(err.response?.data?.message || "Failed to join room");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[282px] border-r border-border bg-background flex flex-col p-[18px] gap-4 shrink-0 hidden md:flex">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 px-2 pb-6 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-glow">
            <GitMerge className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">Merge<span className="text-primary">Canvas</span></span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 pt-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl bg-primary/10 border border-primary/30 text-primary">
            <Users className="w-4 h-4" />
            My Rooms
          </button>
        </nav>

        {/* User section */}
        <div className="border-t border-border pt-4 space-y-3">
          <button className="w-full flex items-center gap-3 p-2 text-left rounded-xl hover:bg-secondary/60 transition-colors" onClick={() => navigate("/profile")}>
            <Avatar name={user?.name || "User"} size="sm" status="online" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </button>
          <ThemeToggle showLabel className="w-full justify-start" />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Log out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-auto" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)", backgroundSize: "26px 26px" }}>
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-background/80 backdrop-blur-xl shrink-0 relative z-10 md:hidden">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <GitMerge className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold">MergeCanvas</span>
          </Link>
          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="rounded-lg" onClick={() => navigate("/profile")} title="Open profile">
              <Avatar name={user?.name || "User"} size="sm" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-5 sm:px-8 lg:px-12 py-9 sm:py-10 relative z-0">
          {/* Actions bar */}
          <div className="max-w-[1255px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl sm:text-[36px] font-bold tracking-tight leading-none">My Rooms</h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>{rooms.length} room{rooms.length !== 1 ? "s" : ""}</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-mono"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> live sync</span>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-11 px-4"
                leftIcon={<TicketCheck className="w-4 h-4" />}
                onClick={() => {
                  setJoinError("");
                  setInviteCode("");
                  setShowJoinModal(true);
                }}
              >
                Join Room
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="h-11 px-5"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setCreateError("");
                  setNewRoomName("");
                  setShowCreateModal(true);
                }}
              >
                Create Room
              </Button>
            </div>
          </div>

          {/* Room grid */}
          <div className="max-w-[1255px] mx-auto">
          {roomsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : roomsError ? (
            <div className="text-center py-20">
              <p className="text-destructive mb-4">{roomsError}</p>
              <Button variant="outline" size="sm" onClick={fetchRooms}>
                Retry
              </Button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20 sm:py-28 space-y-5 rounded-2xl border border-dashed border-border bg-background/80">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <GitMerge className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No rooms yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Create your first whiteboard room or join an existing one with an invite code.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => setShowJoinModal(true)}>
                  Join Room
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                  Create Room
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {rooms.map((room, roomIndex) => (
                <Card
                  key={room._id}
                  variant="interactive"
                  className="group bg-card border-border hover:border-primary/40 hover:shadow-none overflow-hidden text-foreground"
                  onClick={() => navigate(`/room/${room._id}`)}
                >
                  <div className="h-28 m-5 mb-0 rounded-lg border border-border bg-secondary/50 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
                    {roomIndex % 2 === 0 ? <><div className="absolute left-12 top-5 w-16 h-12 rounded-lg border-2 border-[#ffa31a]" /><div className="absolute left-[112px] top-[42px] w-9 h-[2px] bg-emerald-400" /><div className="absolute left-[150px] top-[26px] w-16 h-14 rounded-full border-2 border-[#ffa31a]" /><div className="absolute right-16 top-5 h-16 w-6 border-r-2 border-pink-400 rounded-full" /></> : <><div className="absolute left-14 top-8 w-10 h-10 rounded-full border-t-2 border-l-2 border-pink-400" /><div className="absolute left-18 bottom-3 h-9 w-10 border-2 border-dashed border-white/35" /><div className="absolute right-20 top-5 w-20 h-16 rounded-xl bg-[#4b3515]" /><div className="absolute right-24 top-9 w-12 h-px bg-[#b47a1c]" /><div className="absolute right-24 top-[51px] w-9 h-px bg-[#b47a1c]" /></>}
                  </div>
                  <CardHeader className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base text-foreground">{room.name}</CardTitle>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {room.collaborators?.find(
                          (c) => (c.user?._id || c.user) === user?.id
                        )?.role || "member"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTime(room.updatedAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1">
                      {room.collaborators?.slice(0, 4).map((collab, i) => {
                        const u = collab.user;
                        const uName = typeof u === "object" ? u.name : "User";
                        return (
                          <Avatar
                            key={i}
                            name={uName}
                            size="sm"
                            className={i > 0 ? "-ml-2" : ""}
                          />
                        );
                      })}
                      {room.collaborators?.length > 4 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          +{room.collaborators.length - 4}
                        </span>
                      )}
                      </div>
                      <span className="text-xs text-muted-foreground">{room.collaborators?.length || 0} collaborator{room.collaborators?.length !== 1 ? "s" : ""}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
               <button type="button" onClick={() => { setCreateError(""); setNewRoomName(""); setShowCreateModal(true); }} className="min-h-[260px] rounded-2xl border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/[0.03] transition-colors flex flex-col items-center justify-center gap-3">
                <Plus className="w-6 h-6" />
                <span className="text-sm">Start a new canvas</span>
              </button>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Room"
        description="Give your whiteboard room a name to get started."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={createLoading} onClick={handleCreateRoom}>
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRoom}>
          {createError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4">
              {createError}
            </div>
          )}
          <Input
            label="Room Name"
            placeholder="e.g., Sprint Planning Board"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
        </form>
      </Modal>

      {/* Join Room Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join a Room"
        description="Enter the invite code shared by the room owner."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={joinLoading} onClick={handleJoinRoom}>
              Join
            </Button>
          </>
        }
      >
        <form onSubmit={handleJoinRoom}>
          {joinError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4">
              {joinError}
            </div>
          )}
          <Input
            label="Invite Code"
            placeholder="e.g., a1b2c3d4e5f6"
            leftIcon={<TicketCheck className="w-4 h-4" />}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
