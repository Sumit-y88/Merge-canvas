import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Copy, Check, Settings, Trash2, UserMinus, LogOut, RefreshCw } from "lucide-react";
import { getRoomById, saveCanvas, updateCollaboratorRole, updateRoomSettings, regenerateInviteCode, removeCollaborator, leaveRoom, deleteRoom } from "../api/roomApi";
import { createRoomSocket } from "../api/socket";
import api, { setAuthToken } from "../api/api";
import Button from "../components/ui/Button";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ThemeToggle";
import Canvas from "../components/canvas/Canvas";
import Toolbar from "../components/canvas/Toolbar";
import TemplatesModal from "../components/canvas/TemplatesModal";
import ShortcutsModal from "../components/canvas/ShortcutsModal";
import useAuth from "../hooks/useAuth";
import * as Y from "yjs";
import { base64ToUpdate, canvasToYDoc, updateToBase64, yDocToCanvas } from "../lib/yjsCanvas";

const WhiteboardRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const socketRef = useRef(null);
  const roomJoinedRef = useRef(false);
  const pendingCanvasRef = useRef(null);
  const yDocRef = useRef(null);
  const canvasStateRef = useRef([]);
  const cursorThrottleRef = useRef(null);
  const imageInputRef = useRef(null);

  const [remoteCanvasData, setRemoteCanvasData] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [connectionState, setConnectionState] = useState("connecting");
  const refreshingSocketRef = useRef(false);
  const reconciliationInFlightRef = useRef(false);

  useEffect(
    () => () => {
      clearTimeout(saveTimerRef.current);
      clearTimeout(cursorThrottleRef.current);
    },
    []
  );

  useEffect(() => {
    if (!room) return undefined;
    const socket = createRoomSocket();
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnectionState("connected");
      socket.emit("room:join", id, (result) => {
        if (!result?.ok) setError(result?.message || "Unable to join live room");
        if (!result?.ok) return;
        roomJoinedRef.current = true;
        if (pendingCanvasRef.current) {
          const pendingCanvas = pendingCanvasRef.current;
          pendingCanvasRef.current = null;
          socket.emit("canvas:snapshot", { roomId: id, canvasData: pendingCanvas });
        }
        if (!yDocRef.current) return;
        socket.emit(
          "yjs:sync-request",
          { roomId: id, stateVector: updateToBase64(Y.encodeStateVector(yDocRef.current)) },
          (syncResult) => {
            if (!syncResult?.ok || !yDocRef.current) {
              setSaveState("error");
              setSaveError(syncResult?.message || "Unable to synchronize collaboration state");
              return;
            }
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
            if (!offlineChanges.byteLength) return;
            socket.emit("yjs:update", { roomId: id, update: updateToBase64(offlineChanges) }, (updateResult) => {
              setSaveError(updateResult?.ok ? "" : updateResult?.message || "Unable to upload offline changes");
              setSaveState(updateResult?.ok ? "saved" : "error");
            });
          }
        );
      });
    });
    socket.on("connect_error", async (connectionError) => {
      setConnectionState("disconnected");
      if (refreshingSocketRef.current || !connectionError.message.includes("Unauthorized")) return;
      refreshingSocketRef.current = true;
      try {
        const { data } = await api.post("/auth/refresh", {});
        setAuthToken(data.accessToken);
        socket.auth = { token: data.accessToken };
        socket.connect();
      } catch {
        setSaveState("error");
      } finally {
        refreshingSocketRef.current = false;
      }
    });
    socket.on("disconnect", () => {
      roomJoinedRef.current = false;
      setConnectionState("disconnected");
    });
    socket.on("yjs:update", ({ update }) => {
      if (!yDocRef.current || typeof update !== "string") return;
      Y.applyUpdate(yDocRef.current, base64ToUpdate(update), "remote");
      const canvasData = yDocToCanvas(yDocRef.current);
      canvasStateRef.current = canvasData;
      setRemoteCanvasData(canvasData);
    });
    socket.on("canvas:snapshot", ({ canvasData }) => {
      if (!Array.isArray(canvasData)) return;
      canvasStateRef.current = canvasData;
      setRemoteCanvasData(canvasData);
    });
    socket.on("canvas:error", () => setSaveState("error"));
    socket.on("cursor:update", ({ userId, point, name, color }) => {
      setRemoteCursors((current) => ({ ...current, [userId]: { point, name, color } }));
    });
    socket.on("presence:left", ({ userId }) => {
      setRemoteCursors((current) => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
    });
    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      roomJoinedRef.current = false;
      yDocRef.current?.destroy();
      yDocRef.current = null;
      setConnectionState("disconnected");
    };
  }, [id, room]);

  const handleCursorMove = useCallback(
    (point) => {
      if (cursorThrottleRef.current) return;
      socketRef.current?.emit("cursor:move", { roomId: id, point });
      cursorThrottleRef.current = setTimeout(() => {
        cursorThrottleRef.current = null;
      }, 30);
    },
    [id]
  );

  const handleCanvasChange = useCallback(
    (canvasData) => {
      if (!room) return;
      canvasStateRef.current = canvasData;

      if (yDocRef.current) {
        setSaveState("saving");
        canvasToYDoc(yDocRef.current, canvasData);
        if (socketRef.current?.connected && roomJoinedRef.current) {
          socketRef.current.emit("canvas:snapshot", { roomId: id, canvasData }, (result) => {
            setSaveError(result?.ok ? "" : result?.message || "Unable to synchronize canvas changes");
            setSaveState(result?.ok ? "saved" : "error");
          });
        } else {
          pendingCanvasRef.current = canvasData;
          saveCanvas(id, canvasData)
            .then(() => setSaveState("saved"))
            .catch(() => {
              setSaveError("Unable to save canvas changes");
              setSaveState("error");
            });
        }
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
      try {
        const data = await getRoomById(id);
        setRoom(data);
        const initialCanvasData = data.canvasData || [];
        canvasStateRef.current = initialCanvasData;
        const doc = new Y.Doc();
        canvasToYDoc(doc, initialCanvasData, "initial");
        yDocRef.current = doc;
        setRemoteCanvasData(initialCanvasData);
        if (socketRef.current?.connected && roomJoinedRef.current) {
          socketRef.current.emit(
            "yjs:sync-request",
            { roomId: id, stateVector: updateToBase64(Y.encodeStateVector(doc)) },
            (syncResult) => {
              if (!syncResult?.ok || !yDocRef.current) return;
              if (syncResult.update) Y.applyUpdate(doc, base64ToUpdate(syncResult.update), "remote");
              const synchronizedCanvas = yDocToCanvas(doc);
              canvasStateRef.current = synchronizedCanvas;
              setRemoteCanvasData(synchronizedCanvas);
            }
          );
        }
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
      if (reconciliationInFlightRef.current) return;
      reconciliationInFlightRef.current = true;
      try {
        const latestRoom = await getRoomById(id);
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
    const timer = setInterval(reconcileCanvas, 2000);
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
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to leave room");
    }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm("Delete this room permanently?")) return;
    try {
      await deleteRoom(id);
      navigate("/dashboard");
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
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
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

      {/* Top Navigation Bar */}
      <header className="min-h-14 border-b border-border bg-background/80 backdrop-blur-md px-3 sm:px-4 py-1.5 flex items-center justify-between gap-3 z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            title="Back to Dashboard"
            className="h-9 w-9"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm text-foreground flex items-center gap-2 min-w-0">
              <span className="truncate">{room?.name || "Untitled Canvas"}</span>
              <Badge variant={canEdit ? "default" : "secondary"} className="text-[10px]">
                {canEdit ? "Editor" : "Viewer"}
              </Badge>
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-2 truncate">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  connectionState === "connected" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {connectionState === "connected" ? "Live session" : "Connecting..."}
              <span>•</span>
              <span className={saveState === "error" ? "text-destructive" : ""}>
                {saveState === "saving"
                  ? "Saving..."
                  : saveState === "error"
                  ? saveError || "Save error"
                  : "Saved to cloud"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Room collaborators; the status dot shows who is currently connected. */}
          <div className="flex items-center -space-x-2 mr-1 sm:mr-2">
            {collaborators.slice(0, 4).map((collaborator, index) => {
              const collaboratorUser = collaborator.user;
              const collaboratorId = typeof collaboratorUser === "object" ? collaboratorUser?._id : collaboratorUser;
              const name = typeof collaboratorUser === "object" ? collaboratorUser?.name : "Collaborator";
              const isOnline = collaboratorId?.toString() === user?.id?.toString() || Boolean(remoteCursors[collaboratorId]);
              return (
                <div key={collaboratorId?.toString() || index} title={`${name}${isOnline ? " (online)" : " (offline)"}`} className="ring-2 ring-background rounded-full">
                  <Avatar name={name} size="sm" status={isOnline ? "online" : "offline"} />
                </div>
              );
            })}
            {collaborators.length > 4 && (
              <span className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
                +{collaborators.length - 4}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            title="Share room"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            className="h-9 px-2.5 sm:px-3 gap-1.5 text-xs font-medium shrink-0"
          >
            <span className="hidden sm:inline">Share room</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={openManageModal}
            title={isOwner ? "Manage room" : "Room options"}
            className="h-9 w-9"
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
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
          readOnly={!canEdit}
          clearRequest={canvasVersion}
          exportRequest={exportRequest}
          zoomCommand={zoomCommand}
          onZoomChange={setZoom}
          onElementsChange={handleCanvasChange}
          onCursorMove={handleCursorMove}
          onToolChange={setActiveTool}
          onHistoryChange={setHistoryControls}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
        />

        {/* Floating Bottom Toolbar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <Toolbar
            tool={activeTool}
            setTool={setActiveTool}
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
            history={historyControls}
            onClear={() => {
              handleCanvasChange([]);
              setCanvasVersion((version) => version + 1);
            }}
            disabled={!canEdit}
            onExport={() => setExportRequest((request) => request + 1)}
            onImageUpload={() => imageInputRef.current?.click()}
            onOpenTemplates={() => setShowTemplatesModal(true)}
            onOpenShortcuts={() => setShowShortcutsModal(true)}
            zoom={zoom}
            onZoomIn={() => setZoomCommand({ type: "in", id: Date.now() })}
            onZoomOut={() => setZoomCommand({ type: "out", id: Date.now() })}
            onZoomReset={() => setZoomCommand({ type: "reset", id: Date.now() })}
            onZoomFit={() => setZoomCommand({ type: "fit", id: Date.now() })}
          />
        </div>
      </div>

      {/* Share/Invite Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share this Room"
        description="Send the invite code to collaborators so they can join."
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
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-emerald-500 mt-1 animate-fade-in">
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
