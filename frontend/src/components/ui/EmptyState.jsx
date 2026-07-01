// src/components/ui/EmptyState.jsx
import { motion } from "framer-motion";
import { cn } from "../../utils/misc";

export default function EmptyState({ icon, title, description, action, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center text-center px-8 py-12", className)}
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-elevated flex items-center justify-center mb-4 text-accent">
          {icon}
        </div>
      )}
      <h3 className="font-display font-semibold text-lg mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-ink-dim max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
