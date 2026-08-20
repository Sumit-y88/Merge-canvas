import { Keyboard } from "lucide-react";
import Modal from "../ui/Modal";

const shortcutGroups = [
  {
    category: "Canvas Tools",
    items: [
      { key: "V / 1", description: "Select / Move tool" },
      { key: "S", description: "Sticky Note tool" },
      { key: "I", description: "Image upload tool" },
      { key: "P / 6", description: "Pen / Freehand tool" },
      { key: "R / 2", description: "Rectangle tool" },
      { key: "O / 3", description: "Ellipse / Circle tool" },
      { key: "L / 4", description: "Line connector" },
      { key: "A / 5", description: "Arrow connector" },
      { key: "T / 7", description: "Text tool" },
      { key: "E / 8", description: "Eraser tool" },
    ],
  },
  {
    category: "Navigation & Viewport",
    items: [
      { key: "Hold Space", description: "Temporary Pan mode" },
      { key: "Middle Click + Drag", description: "Pan canvas" },
      { key: "Ctrl + Scroll", description: "Pinch zoom in / out" },
    ],
  },
  {
    category: "Edit Actions",
    items: [
      { key: "Ctrl + Z", description: "Undo last change" },
      { key: "Ctrl + Shift + Z / Ctrl + Y", description: "Redo change" },
      { key: "Del / Backspace", description: "Delete selected elements" },
      { key: "Shift + Drag / Resize", description: "Lock aspect ratio / straight line" },
    ],
  },
];

const ShortcutsModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
    <div className="p-4 space-y-6 max-h-[75vh] overflow-y-auto">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-lg border border-border/40">
        <Keyboard className="w-4 h-4 text-primary shrink-0" />
        <span>Use hotkeys on your keyboard to switch tools and perform actions instantly.</span>
      </div>

      <div className="space-y-4">
        {shortcutGroups.map((group) => (
          <div key={group.category} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.category}
            </h4>
            <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-background/50 overflow-hidden">
              {group.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                  <span className="text-foreground font-medium">{item.description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono font-semibold bg-secondary text-secondary-foreground rounded border border-border/80 shadow-xs">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </Modal>
);

export default ShortcutsModal;
