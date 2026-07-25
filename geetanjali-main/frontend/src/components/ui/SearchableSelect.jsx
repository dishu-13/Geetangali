import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, X, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Search product name...",
  className = "",
  disabled = false,
  getOptionLabel = (opt) => opt?.name || opt?.label || opt,
  getOptionValue = (opt) => opt?.id || opt?.value || opt,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(
    (opt) => String(getOptionValue(opt)) === String(value)
  );

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 380),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScroll = (e) => {
        // If scroll originates from inside the searchable select portal list, isolate it
        if (e.target && e.target.closest && e.target.closest(".searchable-select-portal")) {
          return;
        }
        updateCoords();
      };

      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", updateCoords);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", updateCoords);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !e.target.closest(".searchable-select-portal")
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    const label = getOptionLabel(opt).toLowerCase();
    const query = search.toLowerCase();
    return label.includes(query);
  });

  const handleSelect = (opt) => {
    const val = getOptionValue(opt);
    onChange?.(val, opt);
    setIsOpen(false);
    setSearch("");
  };

  const handleOpen = () => {
    if (disabled) return;
    updateCoords();
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const displayLabel = selectedOption
    ? getOptionLabel(selectedOption)
    : placeholder;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer bg-white text-left ${
          isOpen
            ? "border-amber-400 shadow-md ring-2 ring-amber-400/20"
            : "border-slate-300 hover:border-slate-400 shadow-xs"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`truncate flex-1 ${
            selectedOption
              ? "text-slate-900 font-extrabold"
              : "text-slate-400 font-medium"
          }`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-amber-600" : ""
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                zIndex: 99999,
              }}
              onWheel={(e) => e.stopPropagation()}
              className="searchable-select-portal bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-950/10"
            >
              <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-600 shrink-0 ml-1" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type product name to filter..."
                  className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none placeholder:text-slate-400 placeholder:font-normal py-1"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div
                onWheel={(e) => e.stopPropagation()}
                className="max-h-72 overflow-y-auto overscroll-contain p-1.5 space-y-0.5"
              >
                {filteredOptions.slice(0, 100).map((opt) => {
                  const optVal = getOptionValue(opt);
                  const optLabel = getOptionLabel(opt);
                  const isSelected = String(optVal) === String(value);

                  return (
                    <button
                      key={String(optVal)}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-amber-100/90 text-amber-950 font-extrabold"
                          : "text-slate-800 hover:bg-slate-100/80 hover:text-slate-950"
                      }`}
                    >
                      <span className="truncate flex-1">{optLabel}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-700 shrink-0" />
                      )}
                    </button>
                  );
                })}

                {filteredOptions.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500 font-medium">
                    No matching products found for "{search}"
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
