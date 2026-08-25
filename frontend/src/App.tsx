import { useEffect, useMemo, useRef, useState } from "react";
import ChangeFocusTaskModal, { type TaskStatus, type TaskSummary } from "./ChangeFocusTaskModal";
import PomodoroTimer, { type PomodoroTimerHandle } from "./PomodoroTimer";

/** =========================================
 *  Session configuration
 *  ========================================= */
export type SessionType = "Work" | "Short Break" | "Long Break";

const SESSION_CONFIG: Record<SessionType, { seconds: number; label: string }> = {
  "Work":        { seconds: 1500, label: "25 min" },
  "Short Break": { seconds: 300,  label: "5 min" },
  "Long Break":  { seconds: 900,  label: "15 min" },
};

/** =========================================
 *  Paletas con variantes Light/Dark
 *  (utility-classes a lo Tailwind; si no usás Tailwind,
 *  mantené los nombres y mapéalos a tu CSS)
 *  ========================================= */
const palettes = {
  default: {
    name: "Default",
    light: {
      text: "text-neutral-900",
      subtleText: "text-neutral-500",
      background: "bg-neutral-50",
      surface: "bg-white",
      border: "border-neutral-300",
      hover: "hover:bg-neutral-100",
      highlight: "bg-neutral-200",
      primary: "bg-neutral-900 text-white hover:bg-neutral-800",
      ringTrack: "#E5E7EB",
      ringProgress: "#171717",
    },
    dark: {
      text: "text-neutral-100",
      subtleText: "text-neutral-300",
      background: "bg-neutral-900",
      surface: "bg-neutral-800",
      border: "border-neutral-700",
      hover: "hover:bg-neutral-700",
      highlight: "bg-neutral-700",
      primary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
      ringTrack: "#404040",
      ringProgress: "#E5E5E5",
    },
  },
  blue: {
    name: "Blue",
    light: {
      text: "text-blue-950",
      subtleText: "text-blue-700",
      background: "bg-blue-100",
      surface: "bg-blue-50",
      border: "border-blue-300",
      hover: "hover:bg-blue-200",
      highlight: "bg-blue-200",
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      ringTrack: "#BFDBFE",
      ringProgress: "#2563EB",
    },
    dark: {
      text: "text-blue-50",
      subtleText: "text-blue-200",
      background: "bg-blue-950",
      surface: "bg-blue-900",
      border: "border-blue-800",
      hover: "hover:bg-blue-800",
      highlight: "bg-blue-800",
      primary: "bg-blue-400 text-blue-950 hover:bg-blue-300",
      ringTrack: "#1E3A5F",
      ringProgress: "#60A5FA",
    },
  },
  green: {
    name: "Green",
    light: {
      text: "text-emerald-950",
      subtleText: "text-emerald-700",
      background: "bg-emerald-100",
      surface: "bg-emerald-50",
      border: "border-emerald-300",
      hover: "hover:bg-emerald-200",
      highlight: "bg-emerald-200",
      primary: "bg-emerald-500 text-white hover:bg-emerald-600",
      ringTrack: "#A7F3D0",
      ringProgress: "#10B981",
    },
    dark: {
      text: "text-emerald-50",
      subtleText: "text-emerald-200",
      background: "bg-emerald-950",
      surface: "bg-emerald-900",
      border: "border-emerald-800",
      hover: "hover:bg-emerald-800",
      highlight: "bg-emerald-800",
      primary: "bg-emerald-400 text-emerald-950 hover:bg-emerald-300",
      ringTrack: "#064E3B",
      ringProgress: "#34D399",
    },
  },
  red: {
    name: "Red",
    light: {
      text: "text-red-950",
      subtleText: "text-red-700",
      background: "bg-red-100",
      surface: "bg-red-50",
      border: "border-red-300",
      hover: "hover:bg-red-200",
      highlight: "bg-red-200",
      primary: "bg-red-600 text-white hover:bg-red-700",
      ringTrack: "#FECACA",
      ringProgress: "#DC2626",
    },
    dark: {
      text: "text-red-50",
      subtleText: "text-red-200",
      background: "bg-red-950",
      surface: "bg-red-900",
      border: "border-red-800",
      hover: "hover:bg-red-800",
      highlight: "bg-red-800",
      primary: "bg-red-400 text-red-950 hover:bg-red-300",
      ringTrack: "#7F1D1D",
      ringProgress: "#F87171",
    },
  },
  amber: {
    name: "Amber",
    light: {
      text: "text-amber-950",
      subtleText: "text-amber-700",
      background: "bg-amber-100",
      surface: "bg-amber-50",
      border: "border-amber-300",
      hover: "hover:bg-amber-200",
      highlight: "bg-amber-200",
      primary: "bg-amber-500 text-white hover:bg-amber-600",
      ringTrack: "#FDE68A",
      ringProgress: "#D97706",
    },
    dark: {
      text: "text-amber-50",
      subtleText: "text-amber-200",
      background: "bg-amber-950",
      surface: "bg-amber-900",
      border: "border-amber-800",
      hover: "hover:bg-amber-800",
      highlight: "bg-amber-800",
      primary: "bg-amber-400 text-amber-950 hover:bg-amber-300",
      ringTrack: "#78350F",
      ringProgress: "#FBBF24",
    },
  },
};

/** =========================================
 *  Modal accesible para crear Task
 *  Campos basados en tu modelo JPA:
 *  - title (required)
 *  - description
 *  - priority (1..5)
 *  - estimatedPomodoros (int >= 0)
 *  - dueAt (datetime-local)
 *  - project (select)
 *  - status = TODO (fijo inicialmente)
 *  ========================================= */
function NewTaskModal({
  open,
  onClose,
  onCreate,
  tokens,
  projects,
  defaultProjectId,
}) {
  const titleRef = useRef(null);
  const modalRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: 3,
    estimatedPomodoros: 0,
    dueAt: "",
    projectId: defaultProjectId || (projects[0] && projects[0].id) || "",
    status: "TODO",
  });

  useEffect(() => {
    if (open) {
      // reset + focus
      setForm((f) => ({
        ...f,
        title: "",
        description: "",
        priority: 3,
        estimatedPomodoros: 0,
        dueAt: "",
        projectId: defaultProjectId || (projects[0] && projects[0].id) || "",
        status: "TODO",
      }));
      setTimeout(() => titleRef.current?.focus(), 0);
    }
  }, [open, defaultProjectId, projects]);

  // escape + simple focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      titleRef.current?.focus();
      return;
    }
    // Devuelve un objeto simple de Task
    onCreate({
      id: crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description.trim(),
      priority: Number(form.priority),
      estimatedPomodoros: Math.max(0, Number(form.estimatedPomodoros || 0)),
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      projectId: form.projectId || null,
      status: form.status, // "TODO"
      archived: false,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="newtask-title"
      className="fixed inset-0 z-50 grid place-items-center"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className={`relative w-full max-w-lg rounded-2xl border ${tokens.border} ${tokens.surface} p-4 md:p-6 shadow-xl`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="newtask-title" className="text-lg font-semibold">
              New Task
            </h2>
            <p className={`text-sm ${tokens.subtleText}`}>
              Quickly add a task without leaving the page
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

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              ref={titleRef}
              className={`mt-1 w-full rounded-xl border ${tokens.border} px-3 py-2 outline-none ${tokens.surface}`}
              placeholder="e.g., Implement repositories"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className={`mt-1 w-full rounded-xl border ${tokens.border} px-3 py-2 outline-none ${tokens.surface}`}
              rows={3}
              placeholder="Optional details…"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Priority (1–5)</label>
              <select
                className={`mt-1 w-full rounded-xl border ${tokens.border} px-3 py-2 outline-none ${tokens.surface}`}
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value }))
                }
              >
                {[1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p}>
                    P{p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Est. Pomodoros</label>
              <input
                type="number"
                min={0}
                className={`mt-1 w-full rounded-xl border ${tokens.border} px-3 py-2 outline-none ${tokens.surface}`}
                value={form.estimatedPomodoros}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    estimatedPomodoros: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Due date</label>
              <input
                type="datetime-local"
                className={`mt-1 w-full rounded-xl border ${tokens.border} px-3 py-2 outline-none ${tokens.surface}`}
                value={form.dueAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueAt: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Project</label>
              <select
                className={`mt-1 w-full rounded-xl border ${tokens.border} px-3 py-2 outline-none ${tokens.surface}`}
                value={form.projectId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, projectId: e.target.value }))
                }
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* status oculto por ahora; queda en TODO */}
          <input type="hidden" value={form.status} readOnly />

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl border ${tokens.border} px-3 py-2 ${tokens.hover}`}
            >
              Cancel
            </button>
            <button type="submit" className={`rounded-xl px-3 py-2 ${tokens.primary}`}>
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** =========================================
 *  App principal
 *  ========================================= */
export default function App() {
  // Estado UI y tema
  const [activeTab, setActiveTab] = useState("focus");
  const [running, setRunning] = useState(false);
  const [paletteKey, setPaletteKey] = useState("default");
  const [mode, setMode] = useState("light"); // "light" | "dark"
  const tokens = palettes[paletteKey][mode];
  const [sessionType, setSessionType] = useState<SessionType>("Work");

  // Timer ref for imperative control
  const timerRef = useRef<PomodoroTimerHandle>(null);

  // Confirmation modal for mode switch while running
  const [confirmModal, setConfirmModal] = useState<{ newMode: SessionType } | null>(null);

  // Pomodoro cycle tracking
  // Transition notification modal
  const [transitionModal, setTransitionModal] = useState<{
    from: SessionType;
    to: SessionType;
  } | null>(null);

  // Persistencia (localStorage)
  useEffect(() => {
    const savedPalette = localStorage.getItem("pomodoro_palette_key");
    const savedMode = localStorage.getItem("pomodoro_theme_mode");
    if (savedPalette && palettes[savedPalette]) setPaletteKey(savedPalette);
    if (savedMode === "light" || savedMode === "dark") setMode(savedMode);
  }, []);
  useEffect(() => {
    localStorage.setItem("pomodoro_palette_key", paletteKey);
  }, [paletteKey]);
  useEffect(() => {
    localStorage.setItem("pomodoro_theme_mode", mode);
  }, [mode]);

  // Datos mock
  const [projects] = useState([
    { id: "p1", name: "Personal", count: 8 },
    { id: "p2", name: "Work – Backend", count: 14 },
    { id: "p3", name: "UI Polish", count: 5 },
    { id: "p4", name: "Errands", count: 3 },
  ]);
  const [tasks, setTasks] = useState<TaskSummary[]>([
    {
      id: "t1",
      title: "Wire main view layout",
      description: "Create the initial React component structure for the main dashboard view, including header, sidebar, and content areas.",
      projectId: "p3",
      projectName: "UI Polish",
      status: "TODO" as TaskStatus,
      priority: 1,
      estimatedPomodoros: 3,
      completedPomodoros: 1,
      dueAt: "2026-08-25T17:00:00Z",
    },
    {
      id: "t2",
      title: "Implement backend API",
      description: "Build the REST API endpoints for task CRUD operations, project management, and pomodoro session tracking.",
      projectId: "p2",
      projectName: "Work – Backend",
      status: "IN_PROGRESS" as TaskStatus,
      priority: 2,
      estimatedPomodoros: 8,
      completedPomodoros: 3,
      dueAt: "2026-08-30T17:00:00Z",
    },
    {
      id: "t3",
      title: "Design mobile nav",
      description: "Design and implement a bottom navigation bar for mobile devices with tabs for Focus, Tasks, and Projects.",
      projectId: "p3",
      projectName: "UI Polish",
      status: "TODO" as TaskStatus,
      priority: 3,
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      dueAt: null,
    },
  ]);

  // Modal
  const [isModalOpen, setModalOpen] = useState(false);
  const defaultProjectId = useMemo(() => projects[1]?.id ?? projects[0]?.id ?? "", [projects]);

  //ChangeFocusTaskModal
  const [isChangeFocusTaskModalOpen, setChangeFocusTaskModalOpen] = useState(false);
  const [focusedTask, setFocusedTask] = useState<TaskSummary | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  };

  const handleCreateTask = (task) => {
    setTasks((prev) => [{ ...task }, ...prev]);
    setFocusedTask(task);
    showToast("Task created successfully");
  };

  const applyMode = (newMode: SessionType) => {
    setSessionType(newMode);
    timerRef.current?.reset(SESSION_CONFIG[newMode].seconds);
  };

  const handleSwitchMode = (newMode: SessionType) => {
    if (newMode === sessionType) return;
    if (running) {
      setConfirmModal({ newMode });
      return;
    }
    applyMode(newMode);
  };

  // Track completed work sessions for auto-transition logic
  const completedWorkRef = useRef(0);

  const determineNextState = (current: SessionType): SessionType => {
    if (current === "Work") {
      completedWorkRef.current += 1;
      return completedWorkRef.current >= 4 ? "Long Break" : "Short Break";
    }
    if (current === "Long Break") {
      completedWorkRef.current = 0;
    }
    return "Work";
  };

  const handleTimerComplete = () => {
    // Increment completedPomodoros if a Work session finished with a focused task
    if (sessionType === "Work" && focusedTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === focusedTask.id
            ? { ...t, completedPomodoros: (t.completedPomodoros ?? 0) + 1 }
            : t
        )
      );
      setFocusedTask((prev) =>
        prev ? { ...prev, completedPomodoros: (prev.completedPomodoros ?? 0) + 1 } : prev
      );
    }

    const next = determineNextState(sessionType);
    setTransitionModal({ from: sessionType, to: next });
  };

  const confirmTransition = () => {
    if (!transitionModal) return;
    applyMode(transitionModal.to);
    setTransitionModal(null);
    // Auto-start the next session after reset settles
    requestAnimationFrame(() => {
      timerRef.current?.start();
    });
  };

  return (
    <div className={`min-h-screen ${tokens.background} ${tokens.text}`}>
      {/* Top App Bar */}
      <header
        className={`sticky top-0 z-30 flex items-center justify-between border-b ${tokens.border} ${tokens.surface} px-4 py-3 backdrop-blur md:px-6`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-8 rounded-xl grid place-items-center font-bold text-white ${
              palettes[paletteKey].light.primary.split(" ")[0]
            }`}
          >
            P
          </div>
          <div className="font-semibold">Pomodoro</div>
          <span className={`hidden md:inline ${tokens.subtleText}`}>/ Projects & Tasks</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Palette dropdown (mobile) */}
          <select
            value={paletteKey}
            onChange={(e) => setPaletteKey(e.target.value)}
            className={`md:hidden rounded-xl border ${tokens.border} ${tokens.surface} px-2 py-1.5 text-xs ${tokens.hover} outline-none`}
            aria-label="Color palette"
          >
            {Object.keys(palettes).map((key) => (
              <option key={key} value={key}>
                {palettes[key].name}
              </option>
            ))}
          </select>
          {/* Palette buttons (desktop) */}
          <div className="hidden md:flex gap-1">
            {Object.keys(palettes).map((key) => (
              <button
                key={key}
                onClick={() => setPaletteKey(key)}
                className={`rounded-xl border px-2 py-1 text-xs ${
                  paletteKey === key ? palettes[key][mode].primary : `${tokens.surface} ${tokens.hover} border ${tokens.border}`
                }`}
              >
                {palettes[key].name}
              </button>
            ))}
          </div>
          {/* Mode toggle */}
          <button
            onClick={() => setMode(mode === "light" ? "dark" : "light")}
            className={`rounded-xl px-3 py-2 border ${tokens.border} ${tokens.hover}`}
            title="Toggle Light/Dark"
          >
            {mode === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
          {/* NEW TASK */}
          <button
            onClick={() => setModalOpen(true)}
            className={`rounded-xl px-3 py-2 ${tokens.primary} active:scale-[0.98]`}
          >
            + New Task
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-4 p-4 md:grid-cols-[300px_1fr] md:gap-6 md:p-6">
        {/* Sidebar */}
        <aside className={`hidden md:block rounded-2xl border ${tokens.border} ${tokens.surface} p-3`}>
          <div className="flex items-center justify-between px-2 py-1">
            <h2 className={`text-sm font-semibold tracking-wide ${tokens.subtleText}`}>PROJECTS</h2>
            <button className={`rounded-lg px-2 py-1 text-sm ${tokens.subtleText} ${tokens.hover}`}>+ Add</button>
          </div>
          <nav className="mt-2 space-y-1">
            {projects.map((p) => (
              <a key={p.id} className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer ${tokens.hover}`}>
                <span className="truncate">{p.name}</span>
                <span className={`text-xs ${tokens.subtleText}`}>{p.count}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="space-y-4 md:space-y-6">
          {/* Focus & Timer */}
          <section className={`rounded-2xl border ${tokens.border} ${tokens.surface} p-4 md:p-6`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-semibold">Focus Session</h1>
                <p className={`text-sm ${tokens.subtleText}`}>{sessionType} mode • {SESSION_CONFIG[sessionType].label}</p>
              </div>
              <div className="flex gap-2">
                {(["Work", "Short Break", "Long Break"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSwitchMode(t)}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      sessionType === t
                        ? `${tokens.primary} border-transparent`
                        : `${tokens.border} ${tokens.hover}`
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_360px]">
              <div className="space-y-3">
                <label className={`text-sm font-medium ${tokens.subtleText}`}>Now focusing</label>
                <div className={`rounded-2xl border ${tokens.border} p-4`}>
                  {focusedTask ? (
                    <div className="space-y-3">
                      {/* Header: icon + title + change button */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className={`size-10 shrink-0 rounded-xl ${tokens.highlight} grid place-items-center text-lg`}>
                            🎯
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-base">{focusedTask.title}</div>
                            <div className={`text-sm ${tokens.subtleText}`}>{focusedTask.projectName}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setChangeFocusTaskModalOpen(true)}
                          className={`shrink-0 rounded-xl border ${tokens.border} px-3 py-2 text-sm ${tokens.hover}`}
                        >Change</button>
                      </div>

                      {/* Description */}
                      {focusedTask.description && (
                        <p className={`text-sm leading-relaxed ${tokens.subtleText} line-clamp-2`}>
                          {focusedTask.description}
                        </p>
                      )}

                      {/* Metadata badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority */}
                        {typeof focusedTask.priority === "number" && (
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${tokens.highlight}`}>
                            P{focusedTask.priority}
                          </span>
                        )}

                        {/* Pomodoro progress */}
                        {typeof focusedTask.estimatedPomodoros === "number" && focusedTask.estimatedPomodoros > 0 && (
                          <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs ${tokens.highlight}`}>
                            <span>🍅</span>
                            <div className="flex items-center gap-1.5">
                              <div className={`h-1.5 w-16 rounded-full ${tokens.border} overflow-hidden`}>
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, ((focusedTask.completedPomodoros ?? 0) / focusedTask.estimatedPomodoros) * 100)}%`
                                  }}
                                />
                              </div>
                              <span className={`${tokens.subtleText}`}>
                                {focusedTask.completedPomodoros ?? 0}/{focusedTask.estimatedPomodoros}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Due date */}
                        {focusedTask.dueAt && (
                          <span className={`rounded-lg px-2.5 py-1 text-xs ${tokens.highlight}`}>
                            📅 {new Date(focusedTask.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Empty state */
                    <div className="flex items-center gap-3 py-2">
                      <div className={`size-10 shrink-0 rounded-xl ${tokens.highlight} grid place-items-center text-lg`}>
                        🧩
                      </div>
                      <div className="min-w-0">
                        <div className={`font-medium ${tokens.subtleText}`}>No task selected</div>
                        <div className={`text-sm ${tokens.subtleText}`}>Click "Change" to pick a task</div>
                      </div>
                      <button
                        onClick={() => setChangeFocusTaskModalOpen(true)}
                        className={`shrink-0 rounded-xl border ${tokens.border} px-3 py-2 text-sm ${tokens.hover}`}
                      >Change</button>
                    </div>
                  )}
                </div>
              </div>

              <ChangeFocusTaskModal
                open={isChangeFocusTaskModalOpen}
                onClose={() => setChangeFocusTaskModalOpen(false)}
                tasks={tasks}
                projects={projects}
                selectedTaskId={focusedTask?.id ?? null}
                defaultProjectId={"p2"}
                onSelect={(t) => setFocusedTask(t)}
                onCreateNewTask={() => setModalOpen(true)}
                tokens={tokens}
                className={isModalOpen ? "z-40" : ""}
              />

              <div className={`rounded-2xl border ${tokens.border} p-4`}>
                <div className="text-center">
                  {/*
                  <div className={`mx-auto mt-2 grid size-48 place-items-center rounded-full border-8 ${tokens.border}`}>
                    <div className="text-5xl font-bold tabular-nums">{running ? "18:42" : "25:00"}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setRunning((v) => !v)}
                      className={`rounded-xl px-4 py-2 ${running ? palettes.red[mode].primary : tokens.primary}`}
                    >
                      {running ? "Pause" : "Start"}
                    </button>
                    <button className={`rounded-xl border ${tokens.border} px-3 py-2 ${tokens.hover}`}>Reset</button>
                  </div>
                  */}

                  <PomodoroTimer
                    ref={timerRef}
                    totalSeconds={SESSION_CONFIG[sessionType].seconds}
                    showControls={true}
                    tokens={tokens}
                    onRunningChange={setRunning}
                    onComplete={handleTimerComplete}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Tasks */}
          <section className={`rounded-2xl border ${tokens.border} ${tokens.surface} p-4 md:p-6`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold">My Tasks</h2>
              <div className="flex flex-wrap gap-2">
                {["All", "Today", "Upcoming", "Priority", "Done"].map((f, i) => (
                  <button key={f} className={`rounded-xl border ${tokens.border} px-3 py-1.5 text-sm ${i === 0 ? tokens.primary : tokens.hover}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 divide-y">
              {tasks.length === 0 ? (
                <div className={`py-12 text-center ${tokens.subtleText}`}>
                  <div className="text-4xl mb-3">📝</div>
                  <p className="font-medium">No tasks yet</p>
                  <p className="text-sm mt-1">Create your first task to get started</p>
                </div>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-3">
                    <input type="checkbox" className={`size-5 rounded-md border ${tokens.border}`} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.title}</div>
                      <div className={`truncate text-sm ${tokens.subtleText}`}>Priority P{t.priority}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg ${tokens.highlight} px-2 py-1 text-xs`}>P{t.priority}</span>
                      <button className={`rounded-lg px-2 py-1 text-sm ${tokens.subtleText} ${tokens.hover}`}>⋯</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={`mt-3 flex items-center gap-2 rounded-xl border ${tokens.border} p-2`}>
              <input className={`w-full rounded-lg px-3 py-2 outline-none ${tokens.surface}`} placeholder="Quick add a task…" />
              <button className={`rounded-xl px-3 py-2 ${tokens.primary}`}>Add</button>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className={`fixed inset-x-0 bottom-0 z-40 border-t ${tokens.border} ${tokens.surface} p-2 md:hidden`}>
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {[{ key: "focus", label: "Focus" }, { key: "tasks", label: "Tasks" }, { key: "projects", label: "Projects" }].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-xl px-3 py-2 text-sm ${
                activeTab === t.key ? tokens.primary : `${tokens.surface} ${tokens.border} border ${tokens.hover}`
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Modal */}
      <NewTaskModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateTask}
        tokens={tokens}
        projects={projects}
        defaultProjectId={defaultProjectId}
      />

      {/* Confirm mode switch */}
      {confirmModal && (
        <div
          aria-modal="true"
          role="dialog"
          aria-labelledby="confirm-switch-title"
          className="fixed inset-0 z-50 grid place-items-center"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmModal(null)}
            aria-hidden="true"
          />
          <div className={`relative w-full max-w-sm rounded-2xl border ${tokens.border} ${tokens.surface} p-6 shadow-xl`}>
            <h2 id="confirm-switch-title" className="text-lg font-semibold">Switch session mode?</h2>
            <p className={`mt-2 text-sm ${tokens.subtleText}`}>
              Timer is running. Switching to <strong>{confirmModal.newMode}</strong> will reset the current session.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className={`rounded-xl border ${tokens.border} px-3 py-2 text-sm ${tokens.hover}`}
              >
                Keep Working
              </button>
              <button
                onClick={() => {
                  applyMode(confirmModal.newMode);
                  setConfirmModal(null);
                }}
                className={`rounded-xl px-3 py-2 text-sm ${tokens.primary}`}
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition notification */}
      {transitionModal && (
        <div
          aria-modal="true"
          role="dialog"
          aria-labelledby="transition-title"
          className="fixed inset-0 z-50 grid place-items-center"
        >
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
          />
          <div className={`relative w-full max-w-sm rounded-2xl border ${tokens.border} ${tokens.surface} p-6 shadow-xl text-center`}>
            <div className="text-4xl mb-3">
              {transitionModal.to === "Work" ? "🎯" : transitionModal.to === "Short Break" ? "☕" : "🌴"}
            </div>
            <h2 id="transition-title" className="text-lg font-semibold">
              {transitionModal.from} complete!
            </h2>
            <p className={`mt-2 text-sm ${tokens.subtleText}`}>
              Next up: <strong>{transitionModal.to}</strong> ({SESSION_CONFIG[transitionModal.to].label})
            </p>
            <p className={`mt-1 text-xs ${tokens.subtleText} opacity-70`}>
              Timer will start automatically
            </p>
            <button
              onClick={confirmTransition}
              className={`mt-5 rounded-xl px-5 py-2.5 text-sm font-medium ${tokens.primary}`}
            >
              Start {transitionModal.to}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 right-4 z-50 md:bottom-6 animate-slide-up">
          <div className="rounded-xl bg-emerald-600 text-white px-4 py-3 shadow-lg flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
