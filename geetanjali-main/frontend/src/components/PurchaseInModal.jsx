import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, ShieldCheck, CheckCircle2, Truck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import api, { errMsg } from "../lib/api";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function PurchaseInModal({ onClose, onSuccess }) {
  const [method, setMethod] = useState("direct"); // "po" or "direct"
  const [vendorName, setVendorName] = useState("L'Oreal Professional");
  const [poNumber, setPoNumber] = useState("PO-2026-0042");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");
  const [availableSkus, setAvailableSkus] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState([
    { sku_id: "", quantity: 10, purchase_price: 450, mrp: 750, gst_pct: 18, batch_number: "B2026-01", expiry_date: "2027-12-31" },
  ]);

  useEffect(() => {
    fetchSkus();
  }, []);

  const fetchSkus = async () => {
    try {
      const res = await api.get("/inventory/master");
      setAvailableSkus(res.data);
      if (res.data.length > 0) {
        setItems([
          { sku_id: res.data[0].id, quantity: 10, purchase_price: res.data[0].unit_cost || 300, mrp: res.data[0].mrp || 600, gst_pct: 18, batch_number: "BATCH-01", expiry_date: "2027-12-31" },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSkus(false);
    }
  };

  const addItemRow = () => {
    const defaultId = availableSkus[0]?.id || "";
    setItems([
      ...items,
      { sku_id: defaultId, quantity: 5, purchase_price: 300, mrp: 600, gst_pct: 18, batch_number: `BATCH-0${items.length + 1}`, expiry_date: "2027-12-31" },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index, field, value) => {
    const next = [...items];
    next[index][field] = value;
    if (field === "sku_id") {
      const selected = availableSkus.find((s) => s.id === value);
      if (selected) {
        next[index].purchase_price = selected.unit_cost || 0;
        next[index].mrp = selected.mrp || 0;
      }
    }
    setItems(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceNumber) {
      toast.error("Please enter an Invoice Number");
      return;
    }
    if (items.some((i) => !i.sku_id || i.quantity <= 0)) {
      toast.error("Please select products and valid quantities for all items");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/inventory/purchase-in", {
        method,
        vendor_name: vendorName,
        po_number: method === "po" ? poNumber : null,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        items,
        remarks,
      });

      toast.success(`Successfully processed Purchase In invoice '${res.data.invoice_number}'!`);
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
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-5xl min-h-[700px] w-full max-h-[90vh] flex flex-col text-slate-950 overflow-visible"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 text-white flex items-center justify-between border-b border-amber-500/30 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span className="lss-overline text-amber-300">Goods Receiving Protocol</span>
            </div>
            <h3 className="font-serif-lux text-2xl font-bold tracking-tight text-white mt-1">
              Purchase In Entry & Goods Inward
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Method Selection Tabs (Option A vs Option B) */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex gap-2">
            <button
              type="button"
              onClick={() => setMethod("po")}
              className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                method === "po" ? "bg-slate-950 text-amber-300 shadow-md" : "text-slate-700 hover:text-slate-950"
              }`}
            >
              Option A — Purchase Order (PO-Linked)
            </button>
            <button
              type="button"
              onClick={() => setMethod("direct")}
              className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                method === "direct" ? "bg-slate-950 text-amber-300 shadow-md" : "text-slate-700 hover:text-slate-950"
              }`}
            >
              Option B — Direct Purchase
            </button>
          </div>

          {/* Invoice & Vendor Meta Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Vendor Name</label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="lss-input w-full text-xs font-semibold"
              />
            </div>
            {method === "po" && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">PO Number</label>
                <input
                  type="text"
                  required
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="lss-input w-full text-xs font-semibold font-mono"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Invoice Number</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="lss-input w-full text-xs font-semibold font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Invoice Date</label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="lss-input w-full text-xs font-semibold"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Received Line Items ({items.length})</span>
              <button
                type="button"
                onClick={addItemRow}
                className="lss-btn-outline px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="lss-table text-xs">
                <thead>
                  <tr>
                    <th className="min-w-[180px]">Product</th>
                    <th className="w-24">Qty</th>
                    <th className="w-28">Cost (₹)</th>
                    <th className="w-28">MRP (₹)</th>
                    <th className="w-28">Batch #</th>
                    <th className="w-32">Expiry</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr key={idx}>
                      <td className="min-w-[240px]">
                        <SearchableSelect
                          options={availableSkus}
                          value={row.sku_id}
                          onChange={(val) => updateItemRow(idx, "sku_id", val)}
                          placeholder="Search product name..."
                          getOptionLabel={(s) => `${s.name} (${s.category})`}
                          getOptionValue={(s) => s.id}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateItemRow(idx, "quantity", e.target.value)}
                          className="lss-input w-full text-xs font-bold tabular"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="any"
                          value={row.purchase_price}
                          onChange={(e) => updateItemRow(idx, "purchase_price", e.target.value)}
                          className="lss-input w-full text-xs font-bold tabular"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="any"
                          value={row.mrp}
                          onChange={(e) => updateItemRow(idx, "mrp", e.target.value)}
                          className="lss-input w-full text-xs font-bold tabular"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.batch_number}
                          onChange={(e) => updateItemRow(idx, "batch_number", e.target.value)}
                          className="lss-input w-full text-xs font-mono"
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={row.expiry_date}
                          onChange={(e) => updateItemRow(idx, "expiry_date", e.target.value)}
                          className="lss-input w-full text-xs"
                        />
                      </td>
                      <td className="text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Remarks / Inward Notes</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Received in good condition via courier, verified against PO line items..."
              className="lss-input w-full text-xs font-semibold h-16"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 font-semibold">
            Auto creates <strong className="text-slate-950">Stock Ledger</strong> & batch records.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="lss-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="lss-btn-gold px-6 py-2 text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50"
            >
              {submitting ? "Processing Inward..." : "Save & Verify Inward"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
