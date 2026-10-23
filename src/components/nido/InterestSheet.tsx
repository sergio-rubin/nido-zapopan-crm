import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";
import { InterestForm } from "./InterestForm";
import { UiButton } from "./UiButton";

export function InterestSheet({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const drag = useRef({ startY: 0, lastY: 0, lastTime: 0, velocity: 0, pointerId: -1, offset: 0 });
  const timer = useRef(0);

  const reset = useCallback(() => {
    setOffset(0);
    setDragging(false);
    setSnapping(false);
    drag.current.offset = 0;
  }, []);

  const onMove = useCallback((event: PointerEvent) => {
    const d = drag.current;
    if (event.pointerId !== d.pointerId) return;
    event.preventDefault();
    const now = performance.now();
    d.velocity = (event.clientY - d.lastY) / Math.max(now - d.lastTime, 1);
    d.lastY = event.clientY;
    d.lastTime = now;
    // Clamp at 0: the sheet never travels above its resting point (no bounce).
    d.offset = Math.max(0, event.clientY - d.startY);
    setOffset(d.offset);
  }, []);

  const removeListeners = useRef<() => void>(() => {});

  const onUp = useCallback(
    (event: PointerEvent) => {
      const d = drag.current;
      if (event.pointerId !== d.pointerId) return;
      removeListeners.current();
      if (event.type === "pointercancel") d.velocity = 0;
      setDragging(false);
      setSnapping(true);
      const shouldClose = d.offset > 92 || (d.offset > 32 && d.velocity > 0.55);
      if (shouldClose) {
        setOffset(window.innerHeight);
        timer.current = window.setTimeout(() => {
          setOpen(false);
          timer.current = window.setTimeout(reset, 280);
        }, 210);
        return;
      }
      setOffset(0);
      d.offset = 0;
      timer.current = window.setTimeout(() => setSnapping(false), 260);
    },
    [reset],
  );

  removeListeners.current = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    drag.current.pointerId = -1;
  };

  function startDrag(event: ReactPointerEvent) {
    if (!window.matchMedia("(max-width: 760px)").matches || event.button !== 0) return;
    window.clearTimeout(timer.current);
    Object.assign(drag.current, {
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocity: 0,
      pointerId: event.pointerId,
      offset: 0,
    });
    setDragging(true);
    setSnapping(false);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  useEffect(() => () => {
    removeListeners.current();
    window.clearTimeout(timer.current);
  }, []);

  function onOpenChange(next: boolean) {
    if (next) {
      setFormKey((k) => k + 1);
      reset();
    } else {
      removeListeners.current();
    }
    setOpen(next);
  }

  const style = dragging || snapping ? { transform: `translateY(${offset}px)` } : undefined;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <UiButton className={cn(compact && "is-compact")}>
          Me interesa <span aria-hidden="true">→</span>
        </UiButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className={cn("interest-sheet", dragging && "is-dragging", snapping && "is-snapping")}
          style={style}
        >
          <button type="button" className="sheet-handle" aria-label="Desliza hacia abajo para cerrar" onPointerDown={startDrag}>
            <span aria-hidden="true" />
          </button>
          <Dialog.Close className="sheet-close" aria-label="Cerrar formulario">
            <X size={24} strokeWidth={1.4} aria-hidden="true" />
          </Dialog.Close>
          <div className="sheet-measure" aria-hidden="true">
            <span>3.20 m</span>
          </div>
          <Dialog.Title>Me interesa</Dialog.Title>
          <Dialog.Description>Déjanos tus datos y te contactaremos pronto.</Dialog.Description>
          <InterestForm key={formKey} onClose={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
