// src/components/ai/AiTypingIndicator.jsx
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function AiTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3 max-w-3xl mx-auto w-full"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center text-white shrink-0">
        <Sparkles size={14} />
      </div>
      <div className="flex items-center gap-1 pt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-ink-dim animate-typing-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
