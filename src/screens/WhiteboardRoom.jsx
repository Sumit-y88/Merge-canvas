"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Share2, Copy, Check, Settings, Trash2, UserMinus, LogOut, RefreshCw } from "lucide-react";
import { getRoomById, saveCanvas, updateCollaboratorRole, updateRoomSettings, regenerateInviteCode, removeCollaborator, leaveRoom, deleteRoom } from "../api/roomApi";
import { connectRoomRealtime } from "../api/pusher";
import api, { setAuthToken } from "../api/api";
import Button from "../components/ui/Button";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ThemeToggle";
import Canvas from "../components/canvas/Canvas";
import { SideToolbar, BottomToolbar } from "../components/canvas/Toolbar";
import TemplatesModal from "../components/canvas/TemplatesModal";
import ShortcutsModal from "../components/canvas/ShortcutsModal";
import useAuth from "../hooks/useAuth";
import * as Y from "yjs";
import { base64ToUpdate, canvasToYDoc, updateToBase64, yDocToCanvas } from "../lib/yjsCanvas";

const WhiteboardRoom = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTool, setActiveTool] = useState("Select");
  const [strokeColor, setStrokeColor] = useState("var(--primary)");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [strokeStyle, setStrokeStyle] = useState("solid");
  const [stickyColor, setStickyColor] = useState("#fef08a");
  const [gridStyle, setGridStyle] = useState("dot");
  const [snapToGrid, setSnapToGrid] = useState(false);

  const [historyControls, setHistoryControls] = useState({});
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [exportRequest, setExportRequest] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [zoomCommand, setZoomCommand] = useState(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState("saved");
  const [saveError, setSaveError] = useState("");
  const [manageName, setManageName] = useState("");
  const [managePublic, setManagePublic] = useState(false);
  const [manageJoinRole, setManageJoinRole] = useState("editor");
  const [manageLoading, setManageLoading] = useState(false);

  const saveTimerRef = useRef(null);
  const realtimeRef = useRef(null);
  const roomJoinedRef = useRef(false);
  const yDocRef = useRef(null);
  const canvasStateRef = useRef([]);
  const pendingYjsUpdatesRef = useRef([]);
  const lastKnownWriteAtRef = useRef(0);
  const isDraggingRef = useRef(false);
  const cursorThrottleRef = useRef(null);
  const imageInputRef = useRef(null);

  const [remoteCanvasData, setRemoteCanvasData] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [remoteDrafts, setRemoteDrafts] = useState({});
  const [connectionState, setConnectionState] = useState("connecting");
  const refreshingSocketRef = useRef(false);
  const reconciliationInFlightRef = useRef(false);
  const draftThrottleRef = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(saveTimerRef.current);
      clearTimeout(cursorThrottleRef.current);
      clearTimeout(draftThrottleRef.current);
    },
    []
  );

  const applyPendingRemoteUpdates = useCallback(() => {
    const doc = yDocRef.current;
    if (!doc || !pendingYjsUpdatesRef.current.length) return;

    const updates = pendingYjsUpdatesRef.current;
    pendingYjsUpdatesRef.current = [];
    for (const update of updates) {
      Y.applyUpdate(doc, base64ToUpdate(update), "remote");
    }
    const canvasData = yDocToCanvas(doc);
    canvasStateRef.current = canvasData;
    setRemoteCanvasData(canvasData);
  }, []);

  useEffect(() => {
    if (loading || !yDocRef.current) return undefined;

    const connection = connectRoomRealtime(id, user, {
      onConnectionStateChange: (state) => {
        setConnectionState(state);
      },
      onSubscribed: (members) => {
        roomJoinedRef.current = true;
        setConnectionState("connected");
        if (yDocRef.current) {
          const stateVector = updateToBase64(Y.encodeStateVector(yDocRef.current));
          api
            .get(`/rooms/${id}/sync?stateVector=${encodeURIComponent(stateVector)}`)
            .then(({ data: syncResult }) => {
              if (!syncResult?.ok || !yDocRef.current) return;
              if (syncResult.update) {
                Y.applyUpdate(yDocRef.current, base64ToUpdate(syncResult.update), "remote");
              }
              const synchronizedCanvas = yDocToCanvas(yDocRef.current);
              canvasStateRef.current = synchronizedCanvas;
              setRemoteCanvasData(synchronizedCanvas);

              const offlineChanges = Y.encodeStateAsUpdate(
                yDocRef.current,
                base64ToUpdate(syncResult.stateVector)
              );
              if (offlineChanges.byteLength > 2) {
                api
                  .post(`/rooms/${id}/sync`, {
                    update: updateToBase64(offlineChanges),
                    socketId: connection.getSocketId(),
                  })
                  .then(({ data: updateResult }) => {
                    setSaveError(updateResult?.ok ? "" : "Unable to upload offline changes");
                    setSaveState(updateResult?.ok ? "saved" : "error");
                  })
                  .catch(() => setSaveState("error"));
              }
            })
            .catch(() => setSaveState("error"));
        }
      },
      onMemberLeft: (member) => {
        const userId = member.id;
        setRemoteCursors((current) => {
          const next = { ...current };
          delete next[userId];
          return next;
        });
        setRemoteDrafts((current) => {
          if (!current[userId]) return current;
          const next = { ...current };
          delete next[userId];
          return next;
        });
      },
      onCursorUpdate: ({ userId, point, name, color }) => {
        if (!userId || userId === (user?._id || user?.id)) return;
        setRemoteCursors((current) => ({ ...current, [userId]: { point, name, color } }));
      },
      onDraftUpdate: ({ userId, name, color, draft }) => {
        if (!userId || userId === (user?._id || user?.id)) return;
        setRemoteDrafts((current) => {
          if (!draft) {
            if (!current[userId]) return current;
            const next = { ...current };
            delete next[userId];
            return next;
          }
          return { ...current, [userId]: { draft, name, color } };
        });
      },
      onYjsUpdate: ({ update, userId }) => {
        if (!yDocRef.current || typeof update !== "string") return;
        if (userId && userId === (user?._id || user?.id)) return;
        try {
          Y.applyUpdate(yDocRef.current, base64ToUpdate(update), "remote");
        } catch {
          // Skip corrupted packet
        }
        const canvasData = yDocToCanvas(yDocRef.current);
        canvasStateRef.current = canvasData;
        setRemoteCanvasData(canvasData);
      },
      onCanvasUpdate: ({ canvasData, userId }) => {
        if (userId && userId === (user?._id || user?.id)) return;
        if (canvasData) {
          canvasStateRef.current = canvasData;
          setRemoteCanvasData(canvasData);
        }
      },
      onRoomDeleted: () => {
        router.push("/dashboard");
      },
    });

    realtimeRef.current = connection;

    return () => {
      connection.disconnect();
      realtimeRef.current = null;
      roomJoinedRef.current = false;
      yDocRef.current?.destroy();
      yDocRef.current = null;
      setConnectionState("disconnected");
    };
  }, [id, loading, user, router]);

  const handleCursorMove = useCallback(
    (point) => {
      if (cursorThrottleRef.current) return;
      realtimeRef.current?.emitCursor(point);
      cursorThrottleRef.current = setTimeout(() => {
        cursorThrottleRef.current = null;
      }, 30);
    },
    []
  );

  const handleDraftChange = useCallback(
    (draft) => {
      if (!realtimeRef.current) return;
      if (!draft) {
        clearTimeout(draftThrottleRef.current);
        draftThrottleRef.current = null;
        realtimeRef.current.emitDraft(null);
        return;
      }
      if (draftThrottleRef.current) return;
      realtimeRef.current.emitDraft(draft);
      draftThrottleRef.current = setTimeout(() => {
        draftThrottleRef.current = null;
      }, 25);
    },
    []
  );

  const handleCanvasChange = useCallback(
    (canvasData) => {
      if (!room) return;
      const prevCanvas = canvasStateRef.current;
      canvasStateRef.current = canvasData;
      lastKnownWriteAtRef.current = Date.now();

      if (yDocRef.current) {
        setSaveState("saving");
        const beforeState = Y.encodeStateVector(yDocRef.current);
        canvasToYDoc(yDocRef.current, canvasData, "local", prevCanvas);
        const update = Y.encodeStateAsUpdate(yDocRef.current, beforeState);
        if (update.byteLength <= 2) {
          setSaveState("saved");
          return;
        }
        api
          .post(`/rooms/${id}/sync`, {
            update: updateToBase64(update),
            socketId: realtimeRef.current?.getSocketId(),
          })
          .then(({ data: result }) => {
            if (result?.ok && result.savedAt) {
              lastKnownWriteAtRef.current = Math.max(
                lastKnownWriteAtRef.current,
                new Date(result.savedAt).getTime()
              );
            }
            setSaveError(result?.ok ? "" : result?.message || "Unable to synchronize canvas changes");
            setSaveState(result?.ok ? "saved" : "error");
          })
          .catch((err) => {
            setSaveError(err.response?.data?.message || "Unable to synchronize canvas changes");
            setSaveState("error");
          });
        return;
      }

      clearTimeout(saveTimerRef.current);
      setSaveState("saving");
      saveTimerRef.current = setTimeout(async () => {
        try {
          await saveCanvas(id, canvasData);
          setSaveState("saved");
        } catch {
          setSaveError("Unable to save canvas changes");
          setSaveState("error");
        }
      }, 500);
    },
    [id, room]
  );

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      setRemoteCanvasData(null);
      pendingYjsUpdatesRef.current = [];
      try {
        const data = await getRoomById(id);
        setRoom(data);
        const initialCanvasData = data.canvasData || [];
        canvasStateRef.current = initialCanvasData;
        const doc = new Y.Doc();
        canvasToYDoc(doc, initialCanvasData, "initial");
        yDocRef.current = doc;
        setRemoteCanvasData(initialCanvasData);
        
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load room");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  // Socket events are the low-latency path. This small reconciliation loop
  // makes missed events self-healing across reconnects and tab suspension.
  useEffect(() => {
    if (!room) return undefined;
    const reconcileCanvas = async () => {
      if (reconciliationInFlightRef.current || isDraggingRef.current) return;
      if (Date.now() - lastKnownWriteAtRef.current < 5000) return;
      if (connectionState === "connected" && roomJoinedRef.current) return;
      reconciliationInFlightRef.current = true;
      const requestedAt = Date.now();
      try {
        const latestRoom = await getRoomById(id);
        if (lastKnownWriteAtRef.current > requestedAt || isDraggingRef.current) return;
        const latestCanvas = latestRoom.canvasData || [];
        if (JSON.stringify(latestCanvas) !== JSON.stringify(canvasStateRef.current)) {
          canvasStateRef.current = latestCanvas;
          setRemoteCanvasData(latestCanvas);
        }
      } catch {
        // Socket.IO remains the primary path; a temporary reconciliation
        // failure should not interrupt the editing session.
      } finally {
        reconciliationInFlightRef.current = false;
      }
    };
    const timer = setInterval(reconcileCanvas, 30_000);
    return () => clearInterval(timer);
  }, [id, room]);

  const handleCopyCode = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentMember = room?.collaborators?.find((collaborator) => {
    const collaboratorId = typeof collaborator.user === "object" ? collaborator.user._id : collaborator.user;
    return collaboratorId?.toString() === user?.id?.toString();
  });
  const canEdit =
    room?.owner?._id?.toString() === user?.id?.toString() ||
    currentMember?.role === "owner" ||
    currentMember?.role === "editor";

  const collaborators = room?.collaborators || [];
  const isOwner = room?.owner?._id?.toString() === user?.id?.toString();

  const openManageModal = () => {
    setManageName(room?.name || "");
    setManagePublic(Boolean(room?.isPublic));
    setManageJoinRole(room?.defaultJoinRole || "editor");
    setShowManageModal(true);
  };

  const handleRoomSettings = async () => {
    setManageLoading(true);
    try {
      const updated = await updateRoomSettings(id, { name: manageName, isPublic: managePublic, defaultJoinRole: manageJoinRole });
      setRoom(updated);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update room settings");
    } finally {
      setManageLoading(false);
    }
  };

  const handleRegenerateInvite = async () => {
    setManageLoading(true);
    try {
      const updated = await regenerateInviteCode(id);
      setRoom(updated);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to regenerate invite code");
    } finally {
      setManageLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm("Remove this collaborator from the room?")) return;
    try {
      const updated = await removeCollaborator(id, collaboratorId);
      setRoom(updated);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove collaborator");
    }
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm("Leave this room?")) return;
    try {
      await leaveRoom(id);
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to leave room");
    }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm("Delete this room permanently?")) return;
    try {
      await deleteRoom(id);
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete room");
    }
  };

  const handleRoleChange = async (collaboratorId, role) => {
    try {
      await updateCollaboratorRole(id, collaboratorId, role);
      setRoom((current) => ({
        ...current,
        collaborators: current.collaborators.map((collaborator) =>
          collaborator.user?._id === collaboratorId || collaborator.user === collaboratorId ? { ...collaborator, role } : collaborator
        ),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change collaborator role");
    }
  };

  // Image Upload handler
  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const aspect = img.width / Math.max(1, img.height);
        const defaultWidth = Math.min(400, Math.max(150, img.width));
        const defaultHeight = defaultWidth / aspect;

        const newElement = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: "image",
          x: 200,
          y: 200,
          width: defaultWidth,
          height: defaultHeight,
          src,
          rotation: 0,
          strokeColor: "transparent",
        };

        const updatedCanvas = [...canvasStateRef.current, newElement];
        canvasStateRef.current = updatedCanvas;
        setRemoteCanvasData(updatedCanvas);
        handleCanvasChange(updatedCanvas);
      };
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  // Template select handler
  const handleSelectTemplate = (templateElements, replace = false) => {
    const updatedCanvas = replace ? templateElements : [...canvasStateRef.current, ...templateElements];
    canvasStateRef.current = updatedCanvas;
    setRemoteCanvasData(updatedCanvas);
    handleCanvasChange(updatedCanvas);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background select-none">
      {/* Hidden file input for Image Upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Top Navigation Bar: Stitch Tactile Workshop Studio Header */}
      <header className="h-14 border-b border-foreground bg-surface px-4 flex items-center justify-between gap-3 z-40 relative shadow-stamp shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 pr-3 border-r border-foreground/20 hover:opacity-85 transition-opacity shrink-0"
            title="Return to Dashboard"
          >
            <div className="w-8 h-8 bg-primary border-[1.5px] border-foreground flex items-center justify-center shadow-stamp-xs">
              <ArrowLeft className="text-white w-4 h-4" />
            </div>
            <span className="font-headline text-base font-bold tracking-tight text-foreground hidden sm:inline">
              MergeCanvas
            </span>
          </button>

          <div className="min-w-0 flex items-center gap-2">
            <span className="font-label text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 border border-foreground/30 hidden md:inline">
              Sheet #{id ? String(id).slice(-4) : "418"}
            </span>
            <span className="text-muted-foreground text-xs hidden md:inline">/</span>
            <h1 className="font-headline text-sm font-bold text-foreground truncate max-w-[160px] sm:max-w-[240px]">
              {room?.name || "Untitled Board"}
            </h1>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-label text-muted-foreground pl-1"
              title={saveError || (saveState === "saving" ? "Saving changes..." : "Synchronized")}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionState !== "connected"
                    ? "bg-amber-500"
                    : saveState === "error"
                    ? "bg-red-500"
                    : saveState === "saving"
                    ? "bg-primary animate-pulse"
                    : "bg-emerald-600 animate-pulse"
                }`}
              />
              <span className="hidden sm:inline">
                {connectionState !== "connected"
                  ? "Connecting..."
                  : saveState === "error"
                  ? "Sync error"
                  : saveState === "saving"
                  ? "Saving..."
                  : "Live sync"}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Collaborators Presence Stack */}
          <div className="flex items-center -space-x-1.5 mr-1">
            {collaborators.slice(0, 4).map((collaborator, index) => {
              const collaboratorUser = collaborator.user;
              const collaboratorId = typeof collaboratorUser === "object" ? collaboratorUser?._id : collaboratorUser;
              const name = typeof collaboratorUser === "object" ? collaboratorUser?.name : "Collaborator";
              const isOnline = collaboratorId?.toString() === user?.id?.toString() || Boolean(remoteCursors[collaboratorId]);
              return (
                <div
                  key={collaboratorId?.toString() || index}
                  title={`${name}${isOnline ? " (online)" : " (offline)"}`}
                  className="w-7 h-7 rounded-full border border-foreground bg-surface-container flex items-center justify-center text-[10px] font-label font-bold text-foreground shadow-stamp-xs transition-transform hover:scale-110"
                >
                  {name.slice(0, 2).toUpperCase()}
                </div>
              );
            })}
            {collaborators.length > 4 && (
              <span className="w-7 h-7 rounded-full border border-foreground bg-secondary flex items-center justify-center text-[10px] font-label font-bold text-muted-foreground shadow-stamp-xs">
                +{collaborators.length - 4}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            title="Share board"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            className="h-8 px-3 gap-1.5 text-xs font-label font-bold"
          >
            <span>Share</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={openManageModal}
            title={isOwner ? "Manage board" : "Board options"}
            className="h-8 w-8 text-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>

          <div className="h-4 w-px bg-foreground/20 shrink-0" />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Canvas Workspace */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas
          tool={activeTool}
          color={strokeColor}
          fillColor={fillColor}
          strokeWidth={strokeWidth}
          strokeStyle={strokeStyle}
          stickyColor={stickyColor}
          gridStyle={gridStyle}
          snapToGrid={snapToGrid}
          initialElements={room?.canvasData || []}
          remoteElements={remoteCanvasData}
          remoteCursors={remoteCursors}
          remoteDrafts={remoteDrafts}
          readOnly={!canEdit}
          clearRequest={canvasVersion}
          exportRequest={exportRequest}
          zoomCommand={zoomCommand}
          onZoomChange={setZoom}
          onElementsChange={handleCanvasChange}
          onDraftChange={handleDraftChange}
          onInteractionActiveChange={(active) => {
            isDraggingRef.current = active;
            if (!active) applyPendingRemoteUpdates();
          }}
          onCursorMove={handleCursorMove}
          onToolChange={setActiveTool}
          onHistoryChange={setHistoryControls}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
        />

        {/* Floating Left Side Tool Palette */}
        <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20">
          <SideToolbar
            tool={activeTool}
            setTool={setActiveTool}
            onImageUpload={() => imageInputRef.current?.click()}
            onOpenTemplates={() => setShowTemplatesModal(true)}
            history={historyControls}
            onClear={() => {
              handleCanvasChange([]);
              setCanvasVersion((version) => version + 1);
            }}
            disabled={!canEdit}
          />
        </div>

        {/* Floating Bottom Properties & Controls Bar */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <BottomToolbar
            tool={activeTool}
            color={strokeColor}
            setColor={setStrokeColor}
            fillColor={fillColor}
            setFillColor={setFillColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            strokeStyle={strokeStyle}
            setStrokeStyle={setStrokeStyle}
            stickyColor={stickyColor}
            setStickyColor={setStickyColor}
            gridStyle={gridStyle}
            setGridStyle={setGridStyle}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
            zoom={zoom}
            onZoomIn={() => setZoomCommand({ type: "in", id: Date.now() })}
            onZoomOut={() => setZoomCommand({ type: "out", id: Date.now() })}
            onZoomReset={() => setZoomCommand({ type: "reset", id: Date.now() })}
            onZoomFit={() => setZoomCommand({ type: "fit", id: Date.now() })}
            onExport={() => setExportRequest((request) => request + 1)}
            onOpenShortcuts={() => setShowShortcutsModal(true)}
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Share/Invite Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Studio Board"
        description="Invite fellow draftsmen, editors and observers to collaborate."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground/90 mb-1.5 block">
              Invite Code
            </label>
            <div className="flex gap-2">
              <Input
                value={room?.inviteCode || ""}
                readOnly
                className="font-mono tracking-widest"
              />
              <Button
                variant={copied ? "secondary" : "outline"}
                size="icon"
                onClick={handleCopyCode}
                className="shrink-0"
              >
{copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-success mt-1 animate-fade-in">
                Copied to clipboard!
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/90 mb-1.5 block">
              Default Join Role
            </label>
            <Badge variant="outline">{room?.defaultJoinRole || "viewer"}</Badge>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/90 mb-1.5 block">
              Current Collaborators ({room?.collaborators?.length || 0})
            </label>
            <div className="space-y-2 max-h-40 overflow-auto">
              {room?.collaborators?.map((collab, i) => {
                const u = collab.user;
                const uName = typeof u === "object" ? u.name : "User";
                const uEmail = typeof u === "object" ? u.email : "";
                return (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <Avatar name={uName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uName}</p>
                      <p className="text-xs text-muted-foreground truncate">{uEmail}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {collab.role}
                    </Badge>
                    {room?.owner?._id === user?.id && typeof u === "object" && u._id !== user.id && (
                      <select
                        value={collab.role}
                        onChange={(event) => handleRoleChange(u._id, event.target.value)}
                        className="h-7 rounded border border-border bg-background px-1 text-[10px] text-foreground"
                        aria-label={`Role for ${uName}`}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        title="Manage Room"
        description={isOwner ? "Update room settings and collaborators." : "Manage your membership in this room."}
        footer={<Button variant="outline" onClick={() => setShowManageModal(false)}>Done</Button>}
      >
        <div className="space-y-5">
          {isOwner && (
            <>
              <Input label="Room name" value={manageName} onChange={(event) => setManageName(event.target.value)} />
              <label className="flex items-center justify-between gap-3 text-sm text-foreground">
                <span><span className="font-medium block">Public room</span><span className="text-xs text-muted-foreground">Allow people with the invite code to join.</span></span>
                <input type="checkbox" checked={managePublic} onChange={(event) => setManagePublic(event.target.checked)} />
              </label>
              <label className="block text-sm font-medium text-foreground">
                Default join role
                <select value={manageJoinRole} onChange={(event) => setManageJoinRole(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm">
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </label>
              <Button variant="primary" isLoading={manageLoading} onClick={handleRoomSettings}>Save settings</Button>
              <Button variant="outline" isLoading={manageLoading} onClick={handleRegenerateInvite} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Regenerate invite code</Button>
            </>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Collaborators ({collaborators.length})</p>
            <div className="space-y-2 max-h-48 overflow-auto">
              {collaborators.map((collaborator) => {
                const collaboratorUser = collaborator.user;
                const collaboratorId = typeof collaboratorUser === "object" ? collaboratorUser?._id : collaboratorUser;
                const name = typeof collaboratorUser === "object" ? collaboratorUser?.name : "Collaborator";
                return <div key={collaboratorId} className="flex items-center gap-2 rounded-md border border-border p-2">
                  <Avatar name={name} size="sm" /><span className="flex-1 truncate text-sm">{name}</span><Badge variant="secondary" className="text-[10px]">{collaborator.role}</Badge>
                  {isOwner && collaborator.role !== "owner" && <Button variant="ghost" size="icon" title="Remove collaborator" onClick={() => handleRemoveCollaborator(collaboratorId)}><UserMinus className="w-3.5 h-3.5 text-destructive" /></Button>}
                </div>;
              })}
            </div>
          </div>

          {isOwner ? <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleDeleteRoom} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Delete room</Button> : <Button variant="outline" className="w-full" onClick={handleLeaveRoom} leftIcon={<LogOut className="w-3.5 h-3.5" />}>Leave room</Button>}
        </div>
      </Modal>

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
};

export default WhiteboardRoom;
