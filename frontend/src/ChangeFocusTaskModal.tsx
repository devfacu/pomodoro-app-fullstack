import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type ProjectSummary = {
  id: string;
  name: string;
};

export type TaskSummary = {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  projectName: string;
  status: TaskStatus;
  priority?: number;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  dueAt?: string | null;
};

export type ModalTokens = {
  text: string;
  subtleText: string;
  surface: string;
  border: string;
  hover: string;
  highlight: string;
  primary: string;
};

export type ChangeFocusTaskModalProps = {
  open: boolean;
  onClose: () => void;
  tasks: TaskSummary[];
  projects: ProjectSummary[];
  selectedTaskId?: string | null;
  defaultProjectId?: string | null;
  onSelect: (task: TaskSummary) => void;
  onCreateNewTask?: () => void;
  tokens: ModalTokens;
  className?: string;
};

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function formatDue(dueAt?: string | null) {
  if (!dueAt) return null;
  try {
    const d = new Date(dueAt);
    return d.toLocaleString();
  } catch {
    return dueAt;
  }
}

const ChangeFocusTaskModal: React.FC<ChangeFocusTaskModalProps> = ({
  open,
  onClose,
  tasks,
  projects,
  selectedTaskId = null,
  defaultProjectId = null,
  onSelect,
  onCreateNewTask,
  tokens,
  className = "",
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string | "">(
    defaultProjectId || ""
  );
  const [status, setStatus] = useState<TaskStatus | "">("TODO");
  const [sortKey, setSortKey] = useState<"relevance" | "priority" | "due">(
    "relevance"
  );
  const [current, setCurrent] = useState<string | null>(selectedTaskId);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setQuery("");
      setProjectId(defaultProjectId || "");
      setStatus("TODO");
      setSortKey("relevance");
      setCurrent(selectedTaskId ?? null);
      // Foco inicial
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open, defaultProjectId, selectedTaskId]);

  // Cerrar con Escape + focus trap simple
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      if (!modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
      );
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && active === last) {
        first.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    let list = tasks;

    if (projectId) list = list.filter((t) => t.projectId === projectId);
    if (status) list = list.filter((t) => t.status === status);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.projectName.toLowerCase().includes(q)
      );
    }

    // Orden
    if (sortKey === "priority") {
      list = [...list].sort((a, b) => (a.priority || 99) - (b.priority || 99));
    } else if (sortKey === "due") {
      list = [...list].sort((a, b) => {
        const da = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const db = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        return da - db;
      });
    } // relevance = orden original

    return list;
  }, [tasks, projectId, status, query, sortKey]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === current) || null,
    [current, tasks]
  );

  const canConfirm = Boolean(selectedTask);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="changefocus-title"
      className="fixed inset-0 z-50 grid place-items-center"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className={`relative w-full max-w-3xl rounded-2xl border ${tokens.border} ${tokens.surface} p-4 shadow-xl ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="changefocus-title" className="text-lg font-semibold">
              Change Focus Task
            </h2>
            <p className={`text-sm ${tokens.subtleText}`}>
              Pick a task to focus this Pomodoro session
            </p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-xl border ${tokens.border} px-3 py-1 ${tokens.hover}`}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Search</label>
            <input
              ref={searchRef}
              className={`mt-1 w-full rounded-xl border ${tokens.border} ${tokens.surface} px-3 py-2 outline-none ${tokens.hover}`}
              placeholder="Type to search by title or project…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Project</label>
            <select
              className={`mt-1 w-full rounded-xl border ${tokens.border} ${tokens.surface} px-3 py-2 outline-none ${tokens.hover}`}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className={`mt-1 w-full rounded-xl border ${tokens.border} ${tokens.surface} px-3 py-2 outline-none ${tokens.hover}`}
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus | "")}
            >
              <option value="">All</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "TODO" ? "To do" : s === "IN_PROGRESS" ? "In progress" : "Done"}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="text-sm font-medium">Sort by</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {[
                { key: "relevance", label: "Relevance" },
                { key: "priority", label: "Priority" },
                { key: "due", label: "Due date" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key as any)}
                  className={`rounded-xl border px-3 py-1 text-sm ${
                    sortKey === opt.key
                      ? `${tokens.primary} border-transparent`
                      : `${tokens.border} ${tokens.hover}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className={`mt-4 max-h-[52vh] overflow-auto rounded-xl border ${tokens.border}`}>
          {filtered.length === 0 ? (
            <div className={`p-8 text-center ${tokens.subtleText}`}>
              No tasks match your filters.
            </div>
          ) : (
            <ul className={`divide-y ${tokens.border}`}>
              {filtered.map((t) => (
                <li
                  key={t.id}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-3 ${tokens.hover}`}
                  onClick={() => setCurrent(t.id)}
                >
                  <input
                    type="radio"
                    name="focusTask"
                    checked={current === t.id}
                    onChange={() => setCurrent(t.id)}
                    className="mt-[2px] h-4 w-4"
                    aria-label={`Select ${t.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{t.title}</div>
                      {typeof t.priority === "number" && (
                        <span className={`rounded-md ${tokens.highlight} px-1.5 py-0.5 text-xs`}>
                          P{t.priority}
                        </span>
                      )}
                      {typeof t.estimatedPomodoros === "number" && (
                        <span className={`rounded-md ${tokens.highlight} px-1.5 py-0.5 text-xs`}>
                          {t.estimatedPomodoros} 🍅
                        </span>
                      )}
                      {t.status === "IN_PROGRESS" && (
                        <span className={`rounded-md ${tokens.highlight} px-1.5 py-0.5 text-xs ${tokens.subtleText}`}>
                          In progress
                        </span>
                      )}
                    </div>
                    <div className={`truncate text-sm ${tokens.subtleText}`}>
                      {t.projectName}
                      {t.dueAt ? ` • Due ${formatDue(t.dueAt)}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {onCreateNewTask && (
            <button
              onClick={onCreateNewTask}
              className={`rounded-xl border ${tokens.border} px-3 py-2 ${tokens.hover}`}
            >
              + Create New Task
            </button>
          )}
          <button
            onClick={onClose}
            className={`rounded-xl border ${tokens.border} px-3 py-2 ${tokens.hover}`}
          >
            Cancel
          </button>
          <button
            disabled={!canConfirm}
            onClick={() => {
              if (!selectedTask) return;
              onSelect(selectedTask);
              onClose();
            }}
            className={`rounded-xl px-3 py-2 ${
              canConfirm
                ? `${tokens.primary}`
                : `cursor-not-allowed ${tokens.highlight} ${tokens.subtleText}`
            }`}
          >
            Select & Focus
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeFocusTaskModal;

