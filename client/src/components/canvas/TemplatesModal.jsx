import { Brain, GitBranch, Kanban, LayoutTemplate } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const base = {
  strokeWidth: 2,
  strokeStyle: "solid",
  rotation: 0,
};

const templates = [
  {
    id: "project-plan",
    name: "Project Planning",
    icon: Kanban,
    description: "A focused three-column board for planning and tracking work.",
    elements: [
      { ...base, id: "plan-todo", type: "rectangle", x: 100, y: 100, width: 240, height: 420, strokeColor: "#93c5fd", fillColor: "#eff6ff" },
      { ...base, id: "plan-progress", type: "rectangle", x: 380, y: 100, width: 240, height: 420, strokeColor: "#fcd34d", fillColor: "#fffbeb" },
      { ...base, id: "plan-done", type: "rectangle", x: 660, y: 100, width: 240, height: 420, strokeColor: "#86efac", fillColor: "#f0fdf4" },
      { ...base, id: "plan-todo-title", type: "text", x: 180, y: 145, text: "To Do", fontSize: 22, width: 80, strokeColor: "#1e40af", fillColor: "transparent" },
      { ...base, id: "plan-progress-title", type: "text", x: 430, y: 145, text: "In Progress", fontSize: 22, width: 130, strokeColor: "#92400e", fillColor: "transparent" },
      { ...base, id: "plan-done-title", type: "text", x: 745, y: 145, text: "Done", fontSize: 22, width: 70, strokeColor: "#166534", fillColor: "transparent" },
      { ...base, id: "plan-note-1", type: "sticky", x: 125, y: 190, width: 190, height: 110, text: "Add your first task", strokeColor: "#eab308", fillColor: "#fef08a", fontSize: 16 },
      { ...base, id: "plan-note-2", type: "sticky", x: 405, y: 190, width: 190, height: 110, text: "Current priority", strokeColor: "#eab308", fillColor: "#fef08a", fontSize: 16 },
    ],
  },
  {
    id: "brainstorm",
    name: "Brainstorming",
    icon: Brain,
    description: "A simple central idea with space for four supporting thoughts.",
    elements: [
      { ...base, id: "brain-core", type: "ellipse", x: 400, y: 250, width: 220, height: 120, strokeColor: "var(--primary)", fillColor: "transparent", strokeWidth: 3 },
      { ...base, id: "brain-core-text", type: "text", x: 455, y: 320, text: "Main Idea", fontSize: 24, width: 120, strokeColor: "var(--primary)", fillColor: "transparent" },
      { ...base, id: "brain-note-1", type: "sticky", x: 100, y: 120, width: 190, height: 110, text: "Idea one", strokeColor: "#eab308", fillColor: "#fef08a", fontSize: 16 },
      { ...base, id: "brain-note-2", type: "sticky", x: 730, y: 120, width: 190, height: 110, text: "Idea two", strokeColor: "#3b82f6", fillColor: "#bfdbfe", fontSize: 16 },
      { ...base, id: "brain-note-3", type: "sticky", x: 100, y: 430, width: 190, height: 110, text: "Idea three", strokeColor: "#22c55e", fillColor: "#bbf7d0", fontSize: 16 },
      { ...base, id: "brain-note-4", type: "sticky", x: 730, y: 430, width: 190, height: 110, text: "Idea four", strokeColor: "#ec4899", fillColor: "#fbcfe8", fontSize: 16 },
    ],
  },
  {
    id: "user-flow",
    name: "User Flow",
    icon: GitBranch,
    description: "A compact start-to-finish flow for mapping a user journey.",
    elements: [
      { ...base, id: "flow-start", type: "ellipse", x: 120, y: 250, width: 160, height: 80, strokeColor: "#22c55e", fillColor: "#dcfce7" },
      { ...base, id: "flow-start-text", type: "text", x: 175, y: 300, text: "Start", fontSize: 20, width: 60, strokeColor: "#15803d", fillColor: "transparent" },
      { ...base, id: "flow-step", type: "rectangle", x: 390, y: 240, width: 220, height: 100, strokeColor: "#3b82f6", fillColor: "#dbeafe" },
      { ...base, id: "flow-step-text", type: "text", x: 430, y: 300, text: "User action", fontSize: 20, width: 120, strokeColor: "#1e40af", fillColor: "transparent" },
      { ...base, id: "flow-end", type: "ellipse", x: 720, y: 250, width: 160, height: 80, strokeColor: "#ef4444", fillColor: "#fee2e2" },
      { ...base, id: "flow-end-text", type: "text", x: 765, y: 300, text: "Outcome", fontSize: 20, width: 90, strokeColor: "#b91c1c", fillColor: "transparent" },
      { ...base, id: "flow-arrow-1", type: "arrow", points: [{ x: 280, y: 290 }, { x: 390, y: 290 }], strokeColor: "#64748b", fillColor: "transparent" },
      { ...base, id: "flow-arrow-2", type: "arrow", points: [{ x: 610, y: 290 }, { x: 720, y: 290 }], strokeColor: "#64748b", fillColor: "transparent" },
    ],
  },
];

const TemplatesModal = ({ isOpen, onClose, onSelectTemplate }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Choose a Template" size="lg">
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Start with a clean structure, then customize it with your team.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {templates.map((template) => {
          const Icon = template.icon || LayoutTemplate;
          return (
            <div
              key={template.id}
              className="glass-panel p-4 rounded-xl border border-border/60 hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="p-2.5 w-fit rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{template.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onSelectTemplate(template.elements, false);
                    onClose();
                  }}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onSelectTemplate(template.elements, true);
                    onClose();
                  }}
                >
                  Replace
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
