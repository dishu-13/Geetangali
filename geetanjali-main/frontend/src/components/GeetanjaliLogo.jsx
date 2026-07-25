import React from "react";
import { motion } from "framer-motion";

export default function GeetanjaliLogo({ size = "md", collapsed = false }) {
  const isSmall = size === "sm";

  return (
    <div className={`flex items-center gap-2.5 select-none min-w-0 ${collapsed ? "justify-center" : ""}`}>
      {/* Ultra-Luxury Gold Monogram Emblem Badge */}
      <motion.div
        whileHover={{ scale: 1.06, rotate: 2 }}
        whileTap={{ scale: 0.98 }}
        className={`relative shrink-0 flex items-center justify-center rounded-2xl bg-slate-950 shadow-md shadow-amber-500/20 border border-amber-400/60 cursor-pointer overflow-hidden group p-1 ${
          isSmall || collapsed ? "w-9 h-9" : "w-10 h-10"
        }`}
      >
        {/* Shimmer Light Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        {/* Extracted Shield Emblem Image */}
        <img
          src="/geetanjali-emblem-badge.png"
          alt="Geetanjali Salon Shield Emblem"
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </motion.div>

      {/* Typography Suite */}
      {!collapsed && (
        <motion.div 
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          className="flex flex-col justify-center min-w-0 overflow-hidden"
        >
          <div className="font-serif-lux font-extrabold tracking-[0.08em] text-slate-950 uppercase leading-tight text-base truncate">
            GEETANJALI
          </div>
          <div className="text-[9px] font-extrabold tracking-[0.08em] uppercase text-amber-900 mt-0.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">SALON & LUXURY SUITE</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
