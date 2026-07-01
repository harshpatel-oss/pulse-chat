// src/layouts/AuthLayout.jsx
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import ThemeToggle from "../components/common/ThemeToggle";
import ToastContainer from "../components/ui/ToastContainer";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base relative overflow-hidden px-4">
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent/20 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-success/10 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center font-display font-bold text-white text-xl shadow-lg shadow-accent/30">
            P
          </div>
          <span className="font-display font-bold text-2xl">Pulse</span>
        </div>
        <div className="glass-strong border border-border rounded-3xl shadow-2xl p-8">
          <Outlet />
        </div>
      </motion.div>
      <ToastContainer />
    </div>
  );
}
