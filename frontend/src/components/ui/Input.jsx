// src/components/ui/Input.jsx
import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/misc";

const Input = forwardRef(
  ({ label, error, type = "text", className, containerClassName, icon, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword ? (show ? "text" : "password") : type;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-ink-dim mb-1.5">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={resolvedType}
            className={cn(
              "w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-ink placeholder:text-ink-dim/60 outline-none transition-all duration-150",
              "focus:border-accent focus:ring-2 focus:ring-accent/20",
              icon && "pl-10",
              isPassword && "pr-10",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShow((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
