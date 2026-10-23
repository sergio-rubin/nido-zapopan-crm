import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface UiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

export const UiButton = forwardRef<HTMLButtonElement, UiButtonProps>(function UiButton(
  { variant = "primary", loading = false, loadingLabel = "Cargando…", disabled, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn("ui-button", `is-${variant}`, className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      <span className={cn("button-content", loading && "is-hidden")} aria-hidden={loading}>
        {children}
      </span>
      {loading && (
        <span className="button-loading">
          <span className="spinner" aria-hidden="true" />
          {loadingLabel}
        </span>
      )}
    </button>
  );
});
