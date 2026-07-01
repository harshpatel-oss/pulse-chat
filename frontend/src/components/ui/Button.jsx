// src/components/ui/Button.jsx
import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/misc";

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-dim shadow-lg shadow-accent/20 disabled:opacity-50",
  secondary: "bg-elevated text-ink hover:bg-elevated/70",
  ghost: "bg-transparent text-ink hover:bg-elevated/60",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
  outline: "bg-transparent border border-border text-ink hover:bg-elevated/40",
};

const sizes = {
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-xl",
  lg: "text-base px-5 py-3 rounded-xl",
  icon: "p-2.5 rounded-full",
};

const Button = forwardRef(
  (
    { variant = "primary", size = "md", className, children, isLoading, disabled, ...props },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 select-none disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
