import { Brain, GitBranch, Kanban, LayoutTemplate, Network } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const base = {
  strokeWidth: 2,
  strokeStyle: "solid",
  rotation: 0,
};

const templates = [
  {
    id: "system-architecture",
    name: "System Architecture",
    icon: Network,
    badge: "ENGINEERING",
    description: "Multi-tier architecture with client, gateway, service bus, and database nodes.",
    preview: (
      <svg viewBox="0 0 240 100" className="w-full h-full" fill="none">
        <rect x="15" y="30" width="45" height="40" rx="6" stroke="#6366f1" strokeWidth="1.5" fill="#6366f115" />
        <text x="37" y="54" fill="#6366f1" fontSize="8" fontWeight="bold" textAnchor="middle">CLIENT</text>
        <path d="M60 50 L95 50" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="95" y="25" width="50" height="50" rx="6" stroke="#3b82f6" strokeWidth="1.5" fill="#3b82f615" />
        <text x="120" y="54" fill="#3b82f6" fontSize="8" fontWeight="bold" textAnchor="middle">API MESH</text>
        <path d="M145 50 L180 50" stroke="#94a3b8" strokeWidth="1.5" />
        <ellipse cx="205" cy="50" rx="20" ry="22" stroke="#10b981" strokeWidth="1.5" fill="#10b98115" />
        <text x="205" y="53" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">DB STORE</text>
      </svg>
    ),
    elements: [
      { ...base, id: "arch-client", type: "rectangle", x: 120, y: 220, width: 180, height: 120, strokeColor: "#6366f1", fillColor: "#e0e7ff", strokeWidth: 2 },
      { ...base, id: "arch-client-txt", type: "text", x: 155, y: 275, text: "Client Apps\n(React / Yjs)", fontSize: 18, width: 120, strokeColor: "#4338ca", fillColor: "transparent" },
      { ...base, id: "arch-gateway", type: "rectangle", x: 420, y: 200, width: 200, height: 160, strokeColor: "#3b82f6", fillColor: "#dbeafe", strokeWidth: 2 },
      { ...base, id: "arch-gateway-txt", type: "text", x: 450, y: 275, text: "WebSocket Relay\n& Gateway Node", fontSize: 18, width: 140, strokeColor: "#1d4ed8", fillColor: "transparent" },
      { ...base, id: "arch-db", type: "ellipse", x: 740, y: 210, width: 180, height: 140, strokeColor: "#10b981", fillColor: "#d1fae5", strokeWidth: 2 },
      { ...base, id: "arch-db-txt", type: "text", x: 775, y: 275, text: "MongoDB\nState Vector", fontSize: 18, width: 120, strokeColor: "#047857", fillColor: "transparent" },
      { ...base, id: "arch-conn-1", type: "arrow", points: [{ x: 300, y: 280 }, { x: 420, y: 280 }], strokeColor: "#64748b", fillColor: "transparent" },
      { ...base, id: "arch-conn-2", type: "arrow", points: [{ x: 620, y: 280 }, { x: 740, y: 280 }], strokeColor: "#64748b", fillColor: "transparent" },
      { ...base, id: "arch-note", type: "sticky", x: 420, y: 400, width: 200, height: 100, text: "Zero contention merge\nvia CRDT protocol", strokeColor: "#eab308", fillColor: "#fef08a", fontSize: 15 },
    ],
  },
  {
    id: "project-plan",
    name: "Agile Kanban Board",
    icon: Kanban,
    badge: "WORKFLOW",
    description: "Structured three-column backlog board for sprints and milestone tracking.",
    preview: (
      <svg viewBox="0 0 240 100" className="w-full h-full" fill="none">
        <rect x="15" y="10" width="60" height="80" rx="4" stroke="#93c5fd" strokeWidth="1" fill="#eff6ff40" />
        <rect x="22" y="25" width="46" height="22" rx="3" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
        <rect x="22" y="52" width="46" height="22" rx="3" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
        <rect x="90" y="10" width="60" height="80" rx="4" stroke="#fcd34d" strokeWidth="1" fill="#fffbeb40" />
        <rect x="97" y="25" width="46" height="25" rx="3" fill="#fed7aa" stroke="#f97316" strokeWidth="1" />
        <rect x="165" y="10" width="60" height="80" rx="4" stroke="#86efac" strokeWidth="1" fill="#f0fdf440" />
        <rect x="172" y="25" width="46" height="22" rx="3" fill="#bbf7d0" stroke="#22c55e" strokeWidth="1" />
      </svg>
    ),
    elements: [
      { ...base, id: "plan-todo", type: "rectangle", x: 100, y: 100, width: 240, height: 420, strokeColor: "#93c5fd", fillColor: "#eff6ff" },
      { ...base, id: "plan-progress", type: "rectangle", x: 380, y: 100, width: 240, height: 420, strokeColor: "#fcd34d", fillColor: "#fffbeb" },
      { ...base, id: "plan-done", type: "rectangle", x: 660, y: 100, width: 240, height: 420, strokeColor: "#86efac", fillColor: "#f0fdf4" },
      { ...base, id: "plan-todo-title", type: "text", x: 180, y: 145, text: "To Do", fontSize: 22, width: 80, strokeColor: "#1e40af", fillColor: "transparent" },
      { ...base, id: "plan-progress-title", type: "text", x: 430, y: 145, text: "In Progress", fontSize: 22, width: 130, strokeColor: "#92400e", fillColor: "transparent" },
      { ...base, id: "plan-done-title", type: "text", x: 745, y: 145, text: "Done", fontSize: 22, width: 70, strokeColor: "#166534", fillColor: "transparent" },
      { ...base, id: "plan-note-1", type: "sticky", x: 125, y: 190, width: 190, height: 110, text: "Define canvas tokens", strokeColor: "#eab308", fillColor: "#fef08a", fontSize: 16 },
      { ...base, id: "plan-note-2", type: "sticky", x: 405, y: 190, width: 190, height: 110, text: "Refactor toolbar docks", strokeColor: "#eab308", fillColor: "#fef08a", fontSize: 16 },
    ],
  },
  {
    id: "brainstorm",
    name: "Brainstorming Radar",
    icon: Brain,
    badge: "CREATIVE",
    description: "Central theme core with radial brainstorming nodes and colorful stickies.",
    preview: (
      <svg viewBox="0 0 240 100" className="w-full h-full" fill="none">
        <ellipse cx="120" cy="50" rx="35" ry="20" stroke="#6366f1" strokeWidth="1.5" fill="#6366f115" />
        <rect x="25" y="15" width="42" height="25" rx="3" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
        <rect x="175" y="15" width="42" height="25" rx="3" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" />
        <rect x="25" y="60" width="42" height="25" rx="3" fill="#bbf7d0" stroke="#22c55e" strokeWidth="1" />
        <rect x="175" y="60" width="42" height="25" rx="3" fill="#fbcfe8" stroke="#ec4899" strokeWidth="1" />
        <path d="M67 30 L85 45" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M175 30 L155 45" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M67 70 L85 55" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M175 70 L155 55" stroke="#cbd5e1" strokeWidth="1" />
      </svg>
    ),
    elements: [
      { ...base, id: "brain-core", type: "ellipse", x: 400, y: 250, width: 220, height: 120, strokeColor: "#6366f1", fillColor: "#e0e7ff", strokeWidth: 3 },
      { ...base, id: "brain-core-text", type: "text", x: 455, y: 310, text: "Central Vision", fontSize: 22, width: 140, strokeColor: "#4338ca", fillColor: "transparent" },
      { ...base, id: "brain-note-1", type: "sticky", x: 100, y: 120, width: 190, height: 110, text: "Idea 1: Direct Manipulation", strokeColor: "#eab308", fillColor: "#fef08a", fontSize: 16 },
      { ...base, id: "brain-note-2", type: "sticky", x: 730, y: 120, width: 190, height: 110, text: "Idea 2: Tactile Feedback", strokeColor: "#3b82f6", fillColor: "#bfdbfe", fontSize: 16 },
      { ...base, id: "brain-note-3", type: "sticky", x: 100, y: 430, width: 190, height: 110, text: "Idea 3: Zero-lag CRDT", strokeColor: "#22c55e", fillColor: "#bbf7d0", fontSize: 16 },
      { ...base, id: "brain-note-4", type: "sticky", x: 730, y: 430, width: 190, height: 110, text: "Idea 4: Infinite Viewport", strokeColor: "#ec4899", fillColor: "#fbcfe8", fontSize: 16 },
    ],
  },
  {
    id: "user-flow",
    name: "User Journey Flow",
    icon: GitBranch,
    badge: "UX DESIGN",
    description: "Start-to-finish interaction path mapping onboarding and conversion outcomes.",
    preview: (
      <svg viewBox="0 0 240 100" className="w-full h-full" fill="none">
        <ellipse cx="35" cy="50" rx="20" ry="18" stroke="#22c55e" strokeWidth="1.5" fill="#dcfce7" />
        <path d="M55 50 L95 50" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="95" y="32" width="55" height="36" rx="4" stroke="#3b82f6" strokeWidth="1.5" fill="#dbeafe" />
        <path d="M150 50 L190 50" stroke="#94a3b8" strokeWidth="1.5" />
        <ellipse cx="210" cy="50" rx="20" ry="18" stroke="#ef4444" strokeWidth="1.5" fill="#fee2e2" />
      </svg>
    ),
    elements: [
      { ...base, id: "flow-start", type: "ellipse", x: 120, y: 250, width: 160, height: 80, strokeColor: "#22c55e", fillColor: "#dcfce7" },
      { ...base, id: "flow-start-text", type: "text", x: 175, y: 295, text: "Start", fontSize: 20, width: 60, strokeColor: "#15803d", fillColor: "transparent" },
      { ...base, id: "flow-step", type: "rectangle", x: 390, y: 240, width: 220, height: 100, strokeColor: "#3b82f6", fillColor: "#dbeafe" },
      { ...base, id: "flow-step-text", type: "text", x: 430, y: 295, text: "User Action", fontSize: 20, width: 120, strokeColor: "#1e40af", fillColor: "transparent" },
      { ...base, id: "flow-end", type: "ellipse", x: 720, y: 250, width: 160, height: 80, strokeColor: "#ef4444", fillColor: "#fee2e2" },
      { ...base, id: "flow-end-text", type: "text", x: 765, y: 295, text: "Outcome", fontSize: 20, width: 90, strokeColor: "#b91c1c", fillColor: "transparent" },
      { ...base, id: "flow-arrow-1", type: "arrow", points: [{ x: 280, y: 290 }, { x: 390, y: 290 }], strokeColor: "#64748b", fillColor: "transparent" },
      { ...base, id: "flow-arrow-2", type: "arrow", points: [{ x: 610, y: 290 }, { x: 720, y: 290 }], strokeColor: "#64748b", fillColor: "transparent" },
    ],
  },
];

const TemplatesModal = ({ isOpen, onClose, onSelectTemplate }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Architectural Templates Catalog" size="xl">
    <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs text-muted-foreground">
        <span>Select an architectural blueprint to initialize your canvas workspace.</span>
        <span className="font-mono text-[11px] uppercase bg-secondary px-2 py-0.5 rounded">
          4 Blueprints
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((template) => {
          const Icon = template.icon || LayoutTemplate;
          return (
            <div
              key={template.id}
              className="p-4 rounded-xl border border-border/80 bg-card hover:border-primary/60 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Blueprint Mini Preview Box */}
                <div className="h-28 rounded-lg border border-border/60 bg-secondary/30 relative overflow-hidden flex items-center justify-center p-2">
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: "radial-gradient(hsl(var(--muted-foreground) / 0.25) 1px, transparent 1px)",
                      backgroundSize: "12px 12px",
                    }}
                  />
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {template.preview}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">{template.name}</h3>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    {template.badge}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {template.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-3"
                  onClick={() => {
                    onSelectTemplate(template.elements, false);
                    onClose();
                  }}
                >
                  Insert on Canvas
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs h-8 px-3"
                  onClick={() => {
                    onSelectTemplate(template.elements, true);
                    onClose();
                  }}
                >
                  Replace Canvas
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </Modal>
);

export default TemplatesModal;
