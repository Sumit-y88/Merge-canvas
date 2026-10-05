"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  LogOut,
  TicketCheck,
  GitMerge,
  Search,
  Copy,
  Check,
  Compass,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { getRooms, createRoom, joinRoom } from "../api/roomApi";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import ThemeToggle from "../components/ThemeToggle";

const TEMPLATE_SUGGESTIONS = [
  "Brand Strategy & System Flow",
  "Q3 Architecture & Database Bus",
  "Sprint 24 Planning & Backlog",
  "User Journey Onboarding Flow",
  "Engineering API Design Review",
  "Tactile UI Components Brainstorm",
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [copiedRoomId, setCopiedRoomId] = useState(null);

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
      setRoomsError(err.response?.data?.message || "Failed to load studio boards");
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    getRooms()
      .then((data) => {
        if (!ignore) setRooms(data);
      })
      .catch((err) => {
        if (!ignore) setRoomsError(err.response?.data?.message || "Failed to load studio boards");
      })
      .finally(() => {
        if (!ignore) setRoomsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setCreateError("Board name is required");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      const newRoom = await createRoom(newRoomName.trim());
      setNewRoomName("");
      setShowCreateModal(false);
      if (newRoom?._id) {
        router.push(`/room/${newRoom._id}`);
      } else {
        fetchRooms();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create board");
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
      router.push(`/room/${room._id}`);
    } catch (err) {
      setJoinError(err.response?.data?.message || "Failed to join board");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCopyInvite = (e, room) => {
    e.stopPropagation();
    if (!room.inviteCode) return;
    navigator.clipboard.writeText(room.inviteCode);
    setCopiedRoomId(room._id);
    setTimeout(() => {
      setCopiedRoomId(null);
    }, 2000);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
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

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch = room.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

      const userRole = room.collaborators?.find(
        (c) => (c.user?._id || c.user) === user?.id
      )?.role;

      if (!matchesSearch) return false;
      if (filterTab === "created") return userRole === "owner";
      if (filterTab === "shared") return userRole !== "owner";
      return true;
    });
  }, [rooms, searchQuery, filterTab, user?.id]);

  const userMonogram = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MC";

  return (
    <div className="min-h-screen bg-surface text-foreground flex flex-col font-body antialiased selection:bg-primary selection:text-white">
      {/* Stitch Shared TopNavBar */}
      <header className="flex justify-between items-center w-full px-4 sm:px-6 py-2.5 border-b border-foreground bg-surface shadow-stamp z-30 sticky top-0">
        {/* Brand Stamp & Workspace Picker */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 bg-primary text-white flex items-center justify-center border-[1.5px] border-foreground shadow-stamp-xs font-label font-bold text-xs group-hover:-rotate-3 transition-transform">
              <GitMerge className="w-4 h-4" />
            </span>
            <span className="font-headline text-lg font-bold text-foreground tracking-tight hidden sm:inline">
              MergeCanvas
            </span>
          </Link>

          <div className="h-5 w-px bg-foreground/20 hidden md:block" />

          <div className="hidden sm:flex items-center gap-1.5 bg-secondary border border-foreground px-2.5 py-1 shadow-stamp-xs">
            <span className="font-label text-xs text-foreground font-bold">
              {user?.name ? `${user.name.split(" ")[0]}'s Studio` : "Studio Atelier"}
            </span>
          </div>
        </div>

        {/* Universal Studio Search Input */}
        <div className="relative w-48 sm:w-72">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drafting boards... /"
            className="w-full bg-surface border border-foreground py-1 pl-8 pr-7 font-label text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-stamp-terracotta rounded-DEFAULT transition-all"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground pointer-events-none">
            /
          </span>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <div className="flex items-center gap-1.5 border border-foreground bg-secondary px-2 py-1 shadow-stamp-xs">
            <div className="w-6 h-6 bg-primary text-white border border-foreground flex items-center justify-center font-label text-[10px] font-bold">
              {userMonogram}
            </div>
            <span className="font-label text-xs text-foreground hidden md:inline font-bold">
              {user?.name || "Architect"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary rounded-DEFAULT transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Board Pinboard Section */}
      <main className="flex-1 bg-dot-matrix p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Architectural Header & Action Row with Washi Tape */}
          <div className="bg-surface border-[2px] border-foreground p-5 sm:p-6 shadow-stamp-lg relative">
            <div className="washi-tape absolute -top-2.5 left-10 w-28 h-4 -rotate-1 pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 text-[11px] font-label uppercase font-bold text-muted-foreground">
                  <span className="px-2 py-0.5 bg-secondary text-foreground border border-foreground">
                    Studio Workspace
                  </span>
                  <span>/ 35.0116° N, 135.7681° E</span>
                </div>
                <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  My Drafting Boards
                </h1>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  {rooms.length} active studio {rooms.length === 1 ? "board" : "boards"} across workspaces
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3.5 text-xs font-label font-bold"
                  leftIcon={<TicketCheck className="w-4 h-4 text-muted-foreground" />}
                  onClick={() => {
                    setJoinError("");
                    setInviteCode("");
                    setShowJoinModal(true);
                  }}
                >
                  Join via Code
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  className="h-9 px-4 text-xs font-label font-bold shadow-stamp-md"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setCreateError("");
                    setNewRoomName("");
                    setShowCreateModal(true);
                  }}
                >
                  + New Board
                </Button>
              </div>
            </div>

            {/* Filter Matrix Pills Strip */}
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-foreground/20">
              <span className="font-label text-xs text-muted-foreground mr-1 uppercase font-bold">
                Filter:
              </span>
              {[
                { id: "all", label: `All Boards (${rooms.length})` },
                { id: "created", label: "Created by Me" },
                { id: "shared", label: "Shared with Me" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1 font-label text-xs font-bold rounded-DEFAULT border border-foreground transition-all ${
                    filterTab === tab.id
                      ? "bg-foreground text-surface shadow-stamp-xs"
                      : "bg-surface hover:bg-secondary text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Boards Grid */}
          {roomsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="font-label text-xs text-muted-foreground font-bold">
                Retrieving archival drafting boards...
              </p>
            </div>
          ) : roomsError ? (
            <div className="text-center py-16 bg-surface rounded-DEFAULT border-[1.5px] border-destructive p-8 shadow-stamp">
              <p className="text-destructive font-label text-xs font-bold mb-3">{roomsError}</p>
              <Button variant="outline" size="sm" onClick={fetchRooms}>
                Retry Loading
              </Button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20 rounded-DEFAULT border-[2px] border-dashed border-foreground/40 bg-surface p-8 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-DEFAULT bg-primary/10 border border-foreground flex items-center justify-center text-primary shadow-stamp-xs">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-headline text-lg font-bold">
                {searchQuery ? "No matching boards found" : "Your drafting easel is empty"}
              </h3>
              <p className="font-body text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "Try clearing or changing your search terms."
                  : "Start your first collaborative canvas or join an existing session with an invite code."}
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                  Create Your First Board
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, idx) => {
                const userRole =
                  room.collaborators?.find(
                    (c) => (c.user?._id || c.user) === user?.id
                  )?.role || "member";

                return (
                  <article
                    key={room._id}
                    onClick={() => router.push(`/room/${room._id}`)}
                    className="bg-surface border-[1.5px] border-foreground rounded-DEFAULT shadow-stamp hover:shadow-stamp-lg hover:-translate-y-0.5 transition-all duration-100 cursor-pointer flex flex-col justify-between group overflow-hidden"
                  >
                    {/* Card Thumbnail with Miniature Drafting Elements */}
                    <div className="h-40 bg-surface border-b border-foreground relative overflow-hidden p-3 bg-dot-matrix">
                      {/* Washi tape accent on alternate cards */}
                      {idx % 2 === 0 && (
                        <div className="washi-tape absolute -top-2 right-6 w-16 h-3.5 rotate-2 pointer-events-none" />
                      )}

                      {/* Mini Draft Container */}
                      <div className="relative w-full h-full border border-dashed border-foreground/30 p-2.5 flex flex-col justify-between">
                        {/* Live Presence Badge & Collaborators */}
                        <div className="flex justify-between items-start">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FFF6CC] dark:bg-amber-950/80 border border-foreground text-[10px] font-label font-bold text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Live Sync
                          </span>

                          <div className="flex -space-x-1.5">
                            {room.collaborators?.slice(0, 3).map((collab, cIdx) => {
                              const uName = typeof collab.user === "object" ? collab.user.name : "Maker";
                              return (
                                <div
                                  key={cIdx}
                                  className="w-5 h-5 bg-secondary border border-foreground text-[8px] font-label font-bold flex items-center justify-center"
                                >
                                  {uName.slice(0, 2).toUpperCase()}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sketched sticky notes & diagram wires */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-16 h-12 bg-[#FFF6CC] dark:bg-amber-950/80 border border-foreground p-1 shadow-stamp-xs -rotate-2">
                            <div className="h-0.5 w-6 bg-foreground/30 mb-1" />
                            <p className="text-[7px] font-body leading-tight text-foreground line-clamp-2">
                              System Specs
                            </p>
                          </div>
                          <div className="h-px w-5 bg-foreground border-t border-dashed border-foreground" />
                          <div className="w-16 h-12 bg-[#E2F0D9] dark:bg-emerald-950/80 border border-foreground p-1 shadow-stamp-xs rotate-2">
                            <div className="h-0.5 w-5 bg-foreground/30 mb-1" />
                            <p className="text-[7px] font-body leading-tight text-foreground line-clamp-2">
                              CRDT Mesh
                            </p>
                          </div>
                        </div>

                        {/* Sheet identifier */}
                        <span className="text-[9px] font-label uppercase font-bold text-muted-foreground text-right">
                          SHEET #{String(idx + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    {/* Card Meta Content */}
                    <div className="p-4 bg-surface flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-headline text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {room.name}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => handleCopyInvite(e, room)}
                            title="Copy invite code"
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                          >
                            {copiedRoomId === room._id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="font-body text-xs text-muted-foreground mt-0.5">
                          Inked {formatTime(room.updatedAt)} · <span className="font-semibold capitalize">{userRole}</span>
                        </p>
                      </div>

                      {/* Card Tags & Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-foreground/15 text-xs">
                        <div className="flex gap-1">
                          <span className="font-label text-[10px] px-1.5 py-0.5 bg-secondary border border-foreground/30 text-foreground">
                            #Draft
                          </span>
                          <span className="font-label text-[10px] px-1.5 py-0.5 bg-secondary border border-foreground/30 text-foreground">
                            #CRDT
                          </span>
                        </div>
                        <span className="font-label text-xs font-bold text-primary group-hover:underline">
                          Open Board →
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create Room */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Initialize Drafting Board"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <Input
            label="Board Title"
            placeholder="e.g. Distributed System Architecture v3"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            error={createError}
            autoFocus
          />

          <div className="space-y-1.5">
            <span className="font-label text-[10px] uppercase font-bold text-muted-foreground">
              Or pick an architectural preset:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_SUGGESTIONS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setNewRoomName(s)}
                  className="px-2 py-1 text-xs font-label rounded-DEFAULT border border-foreground/40 bg-surface hover:bg-secondary hover:border-foreground text-foreground transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-foreground/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createLoading}
            >
              Start Inking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Join Room */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join via Invite Code"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <Input
            label="Invite Code"
            placeholder="Paste code (e.g. RM-9482-XK)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            error={joinError}
            autoFocus
          />

          <p className="font-body text-xs text-muted-foreground">
            Invite codes are issued by room owners and grant immediate collaborative access.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-foreground/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowJoinModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={joinLoading}
            >
              Join Board
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
