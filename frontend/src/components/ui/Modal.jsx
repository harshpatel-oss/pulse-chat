// src/components/ui/Modal.jsx
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "../../utils/misc";

export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
  footer,
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);

    // prevent background scroll (IMPORTANT FIX)
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={cn(
              "relative w-full max-w-md max-h-[85vh] flex flex-col my-auto",
              "glass-strong border border-border rounded-2xl shadow-2xl overflow-hidden",
              className,
            )}
          >
            {/* header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <h3 className="font-display font-semibold text-lg">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-elevated/60 text-ink-dim hover:text-ink transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* body (THIS FIXES YOUR ISSUE) */}
            <div className="flex-1 overflow-y-auto p-5 scroll-thin">
              {children}
            </div>

            {/* footer */}
            {footer && (
              <div className="px-5 py-4 border-t border-border shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
