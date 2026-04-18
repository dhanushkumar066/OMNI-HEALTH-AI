import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  LayoutDashboard,
  Activity,
  FileImage,
  FileText,
  Settings,
  ChevronRight,
  Stethoscope,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/symptoms", icon: Activity, label: "Symptom Checker" },
  { to: "/imaging", icon: FileImage, label: "Imaging AI" },
  { to: "/report", icon: FileText, label: "Reports" },
  { to: "/admin", icon: Settings, label: "Admin" },
];

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside
        className="w-60 shrink-0 flex flex-col py-6 px-3 gap-1
                        glass border-r border-white/5 fixed h-full z-40"
      >
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 px-3 py-2 mb-6 group"
        >
          <div
            className="w-9 h-9 rounded-xl bg-aether-500/20 border border-aether-500/30
                          flex items-center justify-center glow-indigo shrink-0"
          >
            <Brain size={17} className="text-aether-400" />
          </div>
          <div className="text-left">
            <div className="font-display text-[13px] font-semibold text-white leading-tight">
              OmniHealth
            </div>
            <div className="text-[9px] text-white/30 font-mono uppercase tracking-[0.15em]">
              Aether AI
            </div>
          </div>
        </button>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.15 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                              text-sm font-medium transition-all duration-150 cursor-pointer
                              ${
                                isActive
                                  ? "bg-aether-500/18 border border-aether-500/30 text-aether-300"
                                  : "text-white/45 hover:text-white/80 hover:bg-white/5 border border-transparent"
                              }`}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <ChevronRight size={13} className="text-aether-400/60" />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Disclaimer card */}
        <div className="glass rounded-xl p-3 mx-1">
          <div className="flex items-start gap-2">
            <Stethoscope
              size={12}
              className="text-yellow-400/60 mt-0.5 shrink-0"
            />
            <p className="text-[10px] text-white/25 leading-relaxed">
              For informational purposes only. Not a substitute for professional
              medical advice.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 ml-60 min-h-screen">
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 glass border-b border-white/5
                        flex items-center justify-between px-8 py-4"
        >
          <div className="text-xs text-white/20 font-mono uppercase tracking-widest">
            Aether Health System
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-bio-mint animate-pulse" />
            <span className="text-[10px] text-bio-mint/70 font-mono">
              System Online
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
