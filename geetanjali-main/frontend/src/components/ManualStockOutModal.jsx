import React, { useState } from "react";
import { X, AlertCircle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import api, { errMsg } from "../lib/api";

export default function ManualStockOutModal({ product, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [issuedTo, setIssuedTo] = useState("Service Floor Stylists");
  const [reason, setReason] = useState("Floor Transfer");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const currentStock = product.current_stock || 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid stock out quantity");
      return;
    }
    if (qty > currentStock) {
      toast.error(`Insufficient stock! Available: ${currentStock} ${product.unit}, requested: ${qty}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/inventory/stock-out/manual", {
        sku_id: product.id,
        quantity: qty,
        issued_to: issuedTo,
        reason,
        remarks,
      });

      toast.success(`Successfully checked out ${qty} ${product.unit} of ${product.name}!`);
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-lg w-full text-slate-950 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 text-white flex items-center justify-between border-b border-amber-500/30">
          <div>
            <div className="lss-overline text-amber-300">Stock Out Protocol</div>
            <h3 className="font-serif-lux text-2xl font-bold tracking-tight text-white mt-1">
              Manual Stock Out Confirmation
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Read-Only Product Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-950 text-base">{product.name}</h4>
              </div>
              <span className="lss-badge bg-amber-100 text-amber-950 border border-amber-300 font-extrabold">
                {product.category}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-600 font-semibold block">Brand</span>
                <span className="text-slate-950 font-bold block mt-0.5">{product.brand || "Generic"}</span>
              </div>
              <div>
                <span className="text-slate-600 font-semibold block">Current Stock</span>
                <span className="text-slate-950 font-extrabold text-sm block mt-0.5 tabular">{currentStock} {product.unit}</span>
              </div>
              <div>
                <span className="text-slate-600 font-semibold block">Unit Price</span>
                <span className="text-slate-950 font-bold block mt-0.5 tabular">₹{product.unit_cost}</span>
              </div>
            </div>
          </div>

          {/* Stock Out Details Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Stock Out Quantity ({product.unit})
              </label>
              <input
                type="number"
                min="0.1"
                max={currentStock}
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="lss-input w-full font-bold text-base tabular"
              />
              {parseFloat(quantity) > currentStock && (
                <div className="text-xs font-bold text-rose-700 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Exceeds available stock limit ({currentStock} {product.unit})
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Issued To (Recipient)
                </label>
                <input
                  type="text"
                  required
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  placeholder="e.g. Floor Stylists"
                  className="lss-input w-full text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Reason for Stock Out
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="lss-input w-full text-xs font-semibold"
                >
                  <option value="Floor Transfer">Floor Transfer (Store → Floor)</option>
                  <option value="Damaged/Expired">Damaged / Expired Product</option>
                  <option value="Salon Internal Use">Salon Internal Use</option>
                  <option value="Sample / Demo">Sample / Demo</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Remarks / Notes
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes for stock movement audit log..."
                className="lss-input w-full text-xs font-semibold h-16"
              />
            </div>

            {/* Auto System Timestamp Fields */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between text-slate-600 font-semibold">
              <span>Auto Timestamp: <strong className="text-slate-950">{todayStr} at {timeStr}</strong></span>
              <span>Ledger: <strong className="text-amber-800 font-bold uppercase">Stock Out</strong></span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="lss-btn-outline px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || parseFloat(quantity) > currentStock}
              className="lss-btn-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Confirm Stock Out"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
