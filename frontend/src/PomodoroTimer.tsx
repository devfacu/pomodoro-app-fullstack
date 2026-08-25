import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type PomodoroTimerHandle = {
  start: () => void;
  pause: () => void;
  reset: (toSeconds?: number) => void;
};

export type PomodoroTimerProps = {
  totalSeconds?: number;
  autoStart?: boolean;
  running?: boolean;
  onTick?: (remainingSec: number) => void;
  onComplete?: () => void;
  onRunningChange?: (running: boolean) => void;
  size?: number;
  ringThickness?: number;
  trackColor?: string;
  progressColor?: string;
  textClassName?: string;
  className?: string;
  showControls?: boolean;
  tokens?: {
    primary: string;
    surface: string;
    border: string;
    hover: string;
    ringTrack: string;
    ringProgress: string;
  };
};

const PomodoroTimer = forwardRef<PomodoroTimerHandle, PomodoroTimerProps>(
  (
    {
      totalSeconds = 1500,
      autoStart = false,
      running: controlledRunning,
      onTick,
      onComplete,
      onRunningChange,
      size = 192,
      ringThickness = 12,
      trackColor = "#E5E7EB",
      progressColor = "#2563EB",
      textClassName = "text-5xl font-bold tabular-nums",
      className = "",
      showControls = false,
      tokens,
    },
    ref
  ) => {
    const isControlled = typeof controlledRunning === "boolean";
    const [internalRunning, setInternalRunning] = useState<boolean>(!!autoStart);
    const running = isControlled ? (controlledRunning as boolean) : internalRunning;

    const [displaySec, setDisplaySec] = useState<number>(totalSeconds);

    // DOM refs for direct manipulation (no React re-render)
    const circleRef = useRef<SVGCircleElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    // Internal state via refs (no re-renders)
    const targetEndMsRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const remainingSecRef = useRef<number>(totalSeconds);
    const lastTickEmittedSecRef = useRef<number>(Math.floor(totalSeconds));
    const circumferenceRef = useRef<number>(0);

    // Geometry
    const radius = (size - ringThickness) / 2;
    const circumference = 2 * Math.PI * radius;
    circumferenceRef.current = circumference;

    // Format time
    const format = (s: number) => {
      const m = Math.floor(s / 60);
      const r = Math.max(0, Math.floor(s % 60));
      return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    };

    // Direct DOM update — no React render
    const updateDOM = (remaining: number) => {
      const circle = circleRef.current;
      const text = textRef.current;
      if (circle) {
        const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
        circle.style.strokeDashoffset = String(circumference * (1 - progress));
      }
      if (text) {
        text.textContent = format(remaining);
      }
    };

    const step = (now: number) => {
      if (targetEndMsRef.current == null) {
        targetEndMsRef.current = now + remainingSecRef.current * 1000;
      }
      const remainingMs = Math.max(0, targetEndMsRef.current - now);
      const remaining = remainingMs / 1000;

      remainingSecRef.current = remaining;

      // Direct DOM update — 60fps, zero React renders
      updateDOM(remaining);

      // Sync React state once per second for accessibility / onTick
      const whole = Math.floor(remaining);
      if (whole !== lastTickEmittedSecRef.current) {
        lastTickEmittedSecRef.current = whole;
        setDisplaySec(whole);
        onTick?.(whole);
      }

      if (remaining <= 0.0001) {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        targetEndMsRef.current = null;
        remainingSecRef.current = 0;
        updateDOM(0);
        setDisplaySec(0);
        if (!isControlled) setInternalRunning(false);
        onRunningChange?.(false);
        onComplete?.();
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    // Start / pause
    useEffect(() => {
      if (running) {
        targetEndMsRef.current = performance.now() + remainingSecRef.current * 1000;
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(step);
        }
      } else {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        targetEndMsRef.current = null;
      }

      return () => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running]);

    // Reset when totalSeconds changes and not running
    useEffect(() => {
      if (!running) {
        remainingSecRef.current = totalSeconds;
        lastTickEmittedSecRef.current = Math.floor(totalSeconds);
        setDisplaySec(totalSeconds);
        targetEndMsRef.current = null;
        updateDOM(totalSeconds);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalSeconds]);

    useImperativeHandle(ref, () => ({
      start() {
        if (!isControlled) setInternalRunning(true);
      },
      pause() {
        if (!isControlled) setInternalRunning(false);
      },
      reset(toSeconds?: number) {
        const target = typeof toSeconds === "number" ? toSeconds : totalSeconds;
        if (!isControlled) setInternalRunning(false);
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        targetEndMsRef.current = null;
        remainingSecRef.current = target;
        lastTickEmittedSecRef.current = Math.floor(target);
        setDisplaySec(target);
        updateDOM(target);
        onRunningChange?.(false);
      },
    }));

    // Initial DOM sync
    useEffect(() => {
      updateDOM(totalSeconds);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div
          className="relative grid place-items-center"
          style={{ width: size, height: size }}
          aria-label="Pomodoro timer"
        >
          <svg width={size} height={size} className="-rotate-90" role="img" aria-hidden="true">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={tokens?.ringTrack ?? trackColor}
              strokeWidth={ringThickness}
              strokeLinecap="round"
            />
            <circle
              ref={circleRef}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={tokens?.ringProgress ?? progressColor}
              strokeWidth={ringThickness}
              strokeLinecap="round"
              style={{
                strokeDasharray: `${circumference} ${circumference}`,
                strokeDashoffset: 0,
              }}
            />
          </svg>
          <div ref={textRef} className={`absolute ${textClassName}`}>{format(displaySec)}</div>
        </div>

        {showControls && !isControlled && (
          <div className="mt-4 flex items-center gap-3">
            <button
              className={`rounded-xl px-4 py-2 ${
                tokens
                  ? running
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : tokens.primary
                  : running
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
              onClick={() => {
                const next = !running;
                setInternalRunning(next);
                onRunningChange?.(next);
              }}
            >
              {running ? "Pause" : "Start"}
            </button>
            <button
              className={`rounded-xl px-4 py-2 border ${
                tokens
                  ? `${tokens.border} ${tokens.hover}`
                  : "border-neutral-300 hover:bg-neutral-100"
              }`}
              onClick={() => {
                if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
                targetEndMsRef.current = null;
                remainingSecRef.current = totalSeconds;
                lastTickEmittedSecRef.current = Math.floor(totalSeconds);
                setInternalRunning(false);
                setDisplaySec(totalSeconds);
                updateDOM(totalSeconds);
                onRunningChange?.(false);
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>
    );
  }
);

PomodoroTimer.displayName = "PomodoroTimer";
export default PomodoroTimer;
