"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Cloud,
  Trash2,
  Lock,
  Users,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ThemeToggle from "../components/ThemeToggle";
import Canvas from "../components/canvas/Canvas";
import { SideToolbar, BottomToolbar } from "../components/canvas/Toolbar";
import TemplatesModal from "../components/canvas/TemplatesModal";
import ShortcutsModal from "../components/canvas/ShortcutsModal";
import useAuth from "../hooks/useAuth";
import { createRoom, saveCanvas } from "../api/roomApi";

const STORAGE_KEY = "mergecanvas_free_canvas_v1";
const PENDING_IMPORT_KEY = "mergecanvas_pending_import";

const getInitialGuestElements = (): any[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore corrupted localStorage
  }
  return [];
};

const FreeCanvas = () => {
  const router = useRouter();
  const { user, token } = useAuth();

  // Canvas tool & style state
  const [activeTool, setActiveTool] = useState("Pen");
  const [strokeColor, setStrokeColor] = useState("var(--primary)");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [strokeStyle, setStrokeStyle] = useState("solid");
  const [stickyColor, setStickyColor] = useState("#fef08a");
  const [gridStyle, setGridStyle] = useState("dot");
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Canvas action & history state initialized from localStorage
  const [elements, setElements] = useState<any[]>(getInitialGuestElements);
  const [historyControls, setHistoryControls] = useState<any>({});
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [exportRequest, setExportRequest] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [zoomCommand, setZoomCommand] = useState<any>(null);

  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Saving to account state
  const [saveBoardName, setSaveBoardName] = useState("My Guest Scratchpad");
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [saveCloudError, setSaveCloudError] = useState("");
  const [lastSavedTime, setLastSavedTime] = useState<string>(() =>
    elements.length > 0 ? "Restored from browser" : ""
  );

  const canvasStateRef = useRef<any[]>(elements);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  // 2. Auto-save elements to localStorage with debounce
  const handleCanvasChange = useCallback((updatedElements: any[]) => {
    canvasStateRef.current = updatedElements;
    setElements(updatedElements);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedElements));
          setLastSavedTime("Saved locally");
        }
      } catch {
        // LocalStorage quota exceeded or private mode
      }
    }, 600);
  }, []);

  // 3. Clear canvas
  const handleClearCanvas = () => {
    canvasStateRef.current = [];
    setElements([]);
    setCanvasVersion((v) => v + 1);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLastSavedTime("Canvas cleared");
    setShowClearConfirm(false);
  };

  // 4. Image upload handler
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 450;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = img.width * scale;
        const height = img.height * scale;

        const newElement = {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: "image",
          x: 200,
          y: 150,
          width,
          height,
          src: reader.result as string,
          strokeWidth: 0,
          strokeColor: "transparent",
          fillColor: "transparent",
        };

        const nextElements = [...canvasStateRef.current, newElement];
        handleCanvasChange(nextElements);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  // 5. Template select handler
  const handleSelectTemplate = (templateElements: any[], replace = false) => {
    const updated = replace
      ? templateElements
      : [...canvasStateRef.current, ...templateElements];
    handleCanvasChange(updated);
  };

  // 6. Save board to account (for logged-in user or prepare for sign-up)
  const handleSaveToCloud = async () => {
    if (!token || !user) {
      // Store current drawing in localStorage so it can be migrated after sign in
      try {
        localStorage.setItem(
          PENDING_IMPORT_KEY,
          JSON.stringify({
            name: saveBoardName || "Imported Guest Board",
            elements: canvasStateRef.current,
            savedAt: Date.now(),
          })
        );
      } catch {
        // Ignore
      }
      router.push("/signup?from=free-canvas");
      return;
    }

    // User is logged in: create real room and save canvas directly!
    setIsSavingToCloud(true);
    setSaveCloudError("");
    try {
      const room = await createRoom(saveBoardName.trim() || "Guest Scratchpad");
      if (room?._id) {
        if (canvasStateRef.current.length > 0) {
          await saveCanvas(room._id, canvasStateRef.current);
        }
        // Clear local scratchpad since it's now in cloud
        localStorage.removeItem(STORAGE_KEY);
        router.push(`/room/${room._id}`);
      } else {
        throw new Error("Could not initialize new room");
      }
    } catch (err: any) {
      setSaveCloudError(
        err.response?.data?.message || err.message || "Failed to save board to account"
      );
    } finally {
      setIsSavingToCloud(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-w-full max-h-[100dvh] flex flex-col overflow-hidden overscroll-none touch-none select-none bg-background">
      {/* Hidden file input for Image Upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Top Header: Free Guest Sandbox Header */}
      <header className="h-14 border-b border-foreground bg-surface px-2.5 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 z-40 relative shadow-stamp shrink-0 max-w-full overflow-hidden">
        {/* Left: Brand & Mode Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 pr-3 border-r border-foreground/20 hover:opacity-85 transition-opacity shrink-0"
            title="Return to Home"
          >
            <div className="w-8 h-8 bg-primary border-[1.5px] border-foreground flex items-center justify-center shadow-stamp-xs">
              <ArrowLeft className="text-white w-4 h-4" />
            </div>
            <span className="font-headline text-base font-bold tracking-tight text-foreground hidden sm:inline">
              MergeCanvas
            </span>
          </Link>

          <div className="min-w-0 flex items-center gap-2">
            {/* Free Sandbox Pill */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-600/40 rounded-DEFAULT bg-amber-500/15 font-label text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Free Sandbox
            </span>

            <span className="text-muted-foreground text-xs hidden md:inline">/</span>

            <h1 className="font-headline text-xs sm:text-sm font-bold text-foreground truncate max-w-[120px] sm:max-w-[200px]">
              Guest Scratchpad
            </h1>

            {/* Offline / Local Status */}
            <span
              className="inline-flex items-center gap-1 text-[11px] font-label text-muted-foreground pl-1 hidden sm:inline-flex"
              title="Draw freely! Canvas is saved locally in this browser."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{lastSavedTime || "Saved locally"}</span>
            </span>
          </div>
        </div>

        {/* Right: Actions Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Share Button (Triggers Feature Upgrade Info) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            title="Live multiplayer requires a free account"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            className="h-8 px-2 sm:px-3 gap-1.5 text-xs font-label font-bold"
          >
            <span className="hidden sm:inline">Share</span>
            <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 ml-0.5" />
          </Button>

          {/* Save to Cloud Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSaveModal(true)}
            title={user ? "Save to your dashboard" : "Sign in to save board permanently"}
            leftIcon={<Cloud className="w-3.5 h-3.5" />}
            className="h-8 px-2.5 sm:px-3 gap-1.5 text-xs font-label font-bold shadow-stamp-xs"
          >
            <span className="hidden sm:inline">
              {user ? "Save to Cloud" : "Sign In to Save"}
            </span>
            <span className="sm:hidden">Save</span>
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
          initialElements={elements}
          remoteElements={null}
          remoteCursors={{}}
          remoteDrafts={{}}
          readOnly={false}
          clearRequest={canvasVersion}
          exportRequest={exportRequest}
          zoomCommand={zoomCommand}
          onZoomChange={setZoom}
          onElementsChange={handleCanvasChange}
          onToolChange={setActiveTool}
          onHistoryChange={setHistoryControls}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
        />

        {/* Floating Tool Palette: Docked on desktop left / mobile top */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:left-4 md:translate-x-0 z-30 max-w-[calc(100vw-16px)] md:max-w-none">
          <SideToolbar
            tool={activeTool}
            setTool={setActiveTool}
            onImageUpload={() => imageInputRef.current?.click()}
            onOpenTemplates={() => setShowTemplatesModal(true)}
            history={historyControls}
            onClear={() => setShowClearConfirm(true)}
            disabled={false}
          />
        </div>

        {/* Floating Bottom Properties & Controls Bar: Docked at bottom */}
        <div className="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-16px)] md:max-w-none">
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
            onExport={() => setExportRequest((c) => c + 1)}
            onOpenShortcuts={() => setShowShortcutsModal(true)}
            disabled={false}
          />
        </div>
      </div>

      {/* MODAL 1: Share / Multiplayer Restricted Notice */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Live Multiplayer is Locked"
        size="md"
      >
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-DEFAULT bg-amber-500/10 border-[1.5px] border-amber-500/30 text-foreground">
            <div className="w-10 h-10 rounded-DEFAULT bg-amber-500/20 border border-amber-600/40 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-headline text-sm font-bold">
                Guest Mode is Local to Your Browser
              </h4>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                In this free section, you have unlimited access to all drawing tools,
                templates, colors, and image export.
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-foreground/15 pt-3">
            <h5 className="font-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sign in or create a free account to unlock:
            </h5>
            <ul className="space-y-1.5 text-xs text-foreground font-body">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Live multiplayer with interactive peer cursors</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Real-time conflict-free CRDT synchronization</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Shareable invite codes with owner/editor/viewer roles</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Persistent cloud boards saved to your personal dashboard</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-foreground/15">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(false)}
              className="w-full sm:w-auto"
            >
              Continue Drawing Free
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowShareModal(false);
                handleSaveToCloud();
              }}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto"
            >
              Create Free Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Save to Cloud Account */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title={user ? "Save Board to Your Account" : "Sign In to Save Board"}
        size="md"
      >
        <div className="p-4 sm:p-5 space-y-4">
          {saveCloudError && (
            <div className="p-3 rounded-DEFAULT bg-destructive/10 border-[1.5px] border-destructive text-destructive text-xs font-label font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
              <span>{saveCloudError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Board Name
            </label>
            <input
              type="text"
              value={saveBoardName}
              onChange={(e) => setSaveBoardName(e.target.value)}
              placeholder="e.g. Brainstorming Session"
              className="w-full px-3 py-2 border-[1.5px] border-foreground bg-surface text-foreground font-body text-sm rounded-DEFAULT shadow-stamp-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <p className="font-body text-xs text-muted-foreground leading-relaxed">
            {user
              ? `You are signed in as ${user.name || user.email}. We will save your scratchpad into a permanent cloud room on your dashboard.`
              : "Create an account or sign in to permanently save your drawing to the cloud, access it anywhere, and collaborate with your team."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-foreground/15">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSavingToCloud}
              onClick={handleSaveToCloud}
              className="w-full sm:w-auto"
            >
              {user ? "Save & Open Room" : "Sign Up / Log In to Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Clear Canvas Confirmation */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Guest Canvas?"
        size="sm"
      >
        <div className="p-4 space-y-3">
          <p className="font-body text-xs text-muted-foreground">
            Are you sure you want to clear your scratchpad? All drawing elements in
            this session will be erased.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
            >
              Keep Drawing
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearCanvas}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear Everything
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Templates Modal */}
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelect={(templateElements, replace) => {
          handleSelectTemplate(templateElements, replace);
          setShowTemplatesModal(false);
        }}
      />

      {/* MODAL 5: Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
};

export default FreeCanvas;
