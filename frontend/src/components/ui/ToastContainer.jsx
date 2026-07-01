// src/components/ui/ToastContainer.jsx
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useUi } from "../../context/UiContext";
import { cn } from "../../utils/misc";

const icons = {
  success: <CheckCircle2 size={18} className="text-success" />,
  error: <XCircle size={18} className="text-danger" />,
  info: <Info size={18} className="text-accent" />,
};

// NOTE: auto-dismiss is handled inside UiContext.pushToast (a single
// setTimeout scheduled when the toast is created). This component only
// renders and offers a manual early-dismiss button — it no longer runs a
// second, redundant dismiss timer.
function ToastItem({ toast, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0.25 }}
      className={cn(
        "glass-strong border border-border rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 min-w-[260px] max-w-sm"
      )}
    >
      {icons[toast.type]}
      <p className="text-sm flex-1">{toast.message}</p>
      <button onClick={onDismiss} className="text-ink-dim hover:text-ink transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useUi();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
