import React, { useState, useEffect } from "react";
import { X, Package, ShieldCheck, Clock, FileText, Layers, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import api, { money } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductDetailsModal({ skuId, onClose, onStockIn, onStockOut, onEdit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (!skuId) return;
    fetchDetails();
  }, [skuId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory/product/${skuId}/details`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!skuId) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col text-slate-950 overflow-hidden"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 text-white flex items-center justify-between border-b border-amber-500/30 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="lss-badge bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px]">
                {data?.category || "Product Master"}
              </span>
            </div>
            <h2 className="font-serif-lux text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {loading ? "Loading Product Details..." : data?.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-3 shrink-0 overflow-x-auto">
          {[
            { id: "general", label: "General Info", icon: Package },
            { id: "stock", label: "Stock Info", icon: Layers },
            { id: "timeline", label: "Stock Movement Timeline", icon: Clock },
            { id: "batches", label: "Batch & Expiry", icon: ShieldCheck },
            { id: "purchases", label: "Purchase History", icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-t border-x ${
                  isActive
                    ? "bg-white border-slate-200 text-slate-950 shadow-xs border-b-white -mb-px"
                    : "border-transparent text-slate-600 hover:text-slate-950"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-800" : "text-slate-500"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-500 font-bold">Fetching product intelligence...</div>
          ) : data ? (
            <>
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <span className="lss-overline block">Unit</span>
                      <span className="text-slate-950 font-bold text-base mt-1 block capitalize">{data.unit}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <span className="lss-overline block">Brand</span>
                      <span className="text-slate-950 font-bold text-base mt-1 block">{data.brand || "Generics"}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <span className="lss-overline block">Vendor</span>
                      <span className="text-slate-950 font-bold text-base mt-1 block">{data.vendor_name || "Unassigned"}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <span className="lss-overline block">Category</span>
                      <span className="text-slate-950 font-bold text-base mt-1 block capitalize">{data.category}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 flex flex-wrap gap-6 items-center justify-between">
                    <div>
                      <span className="lss-overline text-amber-900">Cost & Pricing</span>
                      <div className="flex gap-6 mt-2">
                        <div>
                          <span className="text-xs text-slate-600 font-semibold block">Purchase Cost</span>
                          <span className="text-slate-950 font-extrabold text-lg tabular">{money(data.unit_cost)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-600 font-semibold block">MRP</span>
                          <span className="text-slate-950 font-extrabold text-lg tabular">{money(data.mrp)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-600 font-semibold block">Selling Price</span>
                          <span className="text-amber-900 font-extrabold text-lg tabular">{money(data.selling_price)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "stock" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-900 text-white rounded-xl p-4">
                      <span className="text-xs uppercase tracking-wider text-amber-300 font-bold block">Current Stock</span>
                      <span className="text-3xl font-extrabold mt-1 block tabular">{data.current_stock} <span className="text-xs text-slate-300">{data.unit}</span></span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <span className="lss-overline block">Stock Valuation</span>
                      <span className="text-slate-950 font-extrabold text-2xl mt-1 block tabular">{money(data.valuation)}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <span className="lss-overline block">Minimum Stock</span>
                      <span className="text-slate-950 font-extrabold text-2xl mt-1 block tabular">{data.min_stock}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <span className="lss-overline block">Reorder Level</span>
                      <span className="text-amber-900 font-extrabold text-2xl mt-1 block tabular">{data.reorder_level}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide">Stock Location Breakdown</h4>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-semibold block">Store Room</span>
                        <span className="text-slate-950 font-extrabold text-base block mt-0.5 tabular">{data.store_qty} units</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-semibold block">Service Floor</span>
                        <span className="text-slate-950 font-extrabold text-base block mt-0.5 tabular">{data.floor_qty} units</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-semibold block">Retail Display</span>
                        <span className="text-slate-950 font-extrabold text-base block mt-0.5 tabular">{data.retail_qty} units</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Stock Movement Ledger Logs ({data.timeline?.length || 0})</div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="lss-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Transaction Type</th>
                          <th>Location</th>
                          <th className="text-right">Qty</th>
                          <th className="text-right">Before → After</th>
                          <th>Performed By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.timeline?.map((l) => (
                          <tr key={l.id}>
                            <td className="font-semibold text-slate-900">{l.date} <span className="text-xs text-slate-500 font-mono">{l.time}</span></td>
                            <td>
                              <span className={`lss-badge text-[10px] ${l.quantity > 0 ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-amber-100 text-amber-950 border-amber-300"}`}>
                                {l.transaction_type}
                              </span>
                            </td>
                            <td className="text-slate-700 font-medium">{l.store}</td>
                            <td className={`text-right tabular font-extrabold ${l.quantity > 0 ? "text-emerald-800" : "text-rose-800"}`}>
                              {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
                            </td>
                            <td className="text-right tabular font-medium text-slate-700">{l.before_stock} → {l.after_stock}</td>
                            <td className="text-xs font-semibold text-slate-800">{l.performed_by}</td>
                          </tr>
                        ))}
                        {(!data.timeline || data.timeline.length === 0) && (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-slate-500 font-medium">No stock movement entries recorded yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "batches" && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Received Batches ({data.batches?.length || 0})</div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="lss-table">
                      <thead>
                        <tr>
                          <th>Batch Number</th>
                          <th>Location</th>
                          <th>Expiry Date</th>
                          <th className="text-right">Unit Cost</th>
                          <th className="text-right">Batch Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.batches?.map((b) => (
                          <tr key={b.id}>
                            <td className="font-mono font-bold text-slate-950">{b.batch_number || "BATCH-DEFAULT"}</td>
                            <td className="capitalize font-semibold text-slate-800">{b.location}</td>
                            <td className="font-medium text-slate-700">{b.expiry_date || "N/A"}</td>
                            <td className="text-right tabular font-medium text-slate-700">{money(b.unit_cost)}</td>
                            <td className="text-right tabular font-extrabold text-slate-950">{b.qty}</td>
                          </tr>
                        ))}
                        {(!data.batches || data.batches.length === 0) && (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-slate-500 font-medium">No active batches recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "purchases" && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Recent Purchase Invoices</div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="lss-table">
                      <thead>
                        <tr>
                          <th>Invoice SKU Line</th>
                          <th className="text-right">Purchased Qty</th>
                          <th className="text-right">Unit Cost</th>
                          <th className="text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.purchase_history?.map((p, idx) => (
                          <tr key={idx}>
                            <td className="font-extrabold text-slate-950">{p.sku_name}</td>
                            <td className="text-right tabular font-bold text-slate-900">{p.quantity}</td>
                            <td className="text-right tabular font-medium text-slate-700">{money(p.unit_cost)}</td>
                            <td className="text-right tabular font-extrabold text-slate-950">{money(p.line_total)}</td>
                          </tr>
                        ))}
                        {(!data.purchase_history || data.purchase_history.length === 0) && (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-slate-500 font-medium">No purchase invoices associated.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => { onClose(); onStockIn && onStockIn(skuId); }}
              className="lss-btn-gold px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Stock In
            </button>
            <button
              onClick={() => { onClose(); onStockOut && onStockOut(skuId); }}
              className="lss-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Stock Out
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onClose(); onEdit && onEdit(skuId); }}
              className="lss-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Edit Product
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
