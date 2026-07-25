import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { money, errMsg } from "../lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Upload, Boxes, Coins, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

export default function ManagerDashboard() {
  const [dates, setDates] = useState([]);
  const [day, setDay] = useState(null);
  const [rows, setRows] = useState([]);
  const [poDrafts, setPoDrafts] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/pos/dates").then((r) => {
        setDates(r.data);
        if (r.data[0]) setDay(r.data[0]);
      }),
      api.get("/inventory/purchase-orders").then((r) => setPoDrafts(r.data))
    ]).finally(() => setPageLoading(false));
  }, []);

  useEffect(() => {
    if (!day) return;
    api
      .get(`/incentives/daily?day=${day}`)
      .then((r) => setRows(r.data.rows))
      .catch((e) => toast.error(errMsg(e)));
  }, [day]);

  const poNeeds = poDrafts.filter((p) => p.needs_reorder);

  if (pageLoading) return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-40 bg-slate-200 rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
      </div>
      <div className="h-96 bg-slate-200 rounded-xl w-full"></div>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-6 py-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-800" />
            <span className="text-slate-600 font-extrabold text-xs uppercase tracking-widest">
              SALON OPERATIONS DESK
            </span>
          </div>
          <h1 className="font-serif-lux text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            Today at the Salon
          </h1>
          <p className="text-slate-600 font-medium text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
            Daily operational controls, incentive calculations, and stock reorders.
          </p>
        </div>

        {/* Framed Aesthetic Salon Image Card */}
        <div className="hidden lg:block relative neu-card p-2 h-40 w-72 shrink-0 overflow-hidden">
          <img src="/assets/salon_plants.png" alt="Salon Aesthetic" className="w-full h-full object-cover rounded-2xl" />
        </div>
      </motion.div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -3 }}>
          <Link
            to="/pos"
            data-testid="qa-pos-upload"
            className="lss-card p-6 flex items-start gap-4 hover:border-amber-400 border-t-4 border-amber-500 group transition-all"
          >
            <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-xl shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-950 text-base">Import POS CSV</div>
              <div className="text-xs text-slate-600 font-semibold mt-1">Daily reconciliation & revenue sync</div>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1.5 transition-all" />
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -3 }}>
          <Link
            to="/inventory"
            data-testid="qa-checkout-stock"
            className="lss-card p-6 flex items-start gap-4 hover:border-amber-400 border-t-4 border-slate-900 group transition-all"
          >
            <div className="p-3 bg-slate-100 text-slate-900 border border-slate-200 rounded-xl shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-950 text-base">Checkout Stock (Store → Floor)</div>
              <div className="text-xs text-slate-600 font-semibold mt-1">Log usage as it happens</div>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1.5 transition-all" />
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -3 }}>
          <Link
            to="/incentives"
            data-testid="qa-incentives"
            className="lss-card p-6 flex items-start gap-4 hover:border-amber-400 border-t-4 border-amber-500 group transition-all"
          >
            <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-xl shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-950 text-base">Track Incentives</div>
              <div className="text-xs text-slate-600 font-semibold mt-1">Live staff tier & bonus progress</div>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1.5 transition-all" />
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lss-card p-6 lg:col-span-2 border-t-4 border-slate-950" data-testid="tracker-widget">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="lss-overline">Live Incentive Tracker</div>
              <div className="font-serif-lux text-2xl font-bold text-slate-950 mt-1">Staff earnings today</div>
            </div>
            <DatePicker
              testId="day-picker"
              value={day || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="lss-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th className="text-right">Service ₹</th>
                  <th className="text-right">Retail ₹</th>
                  <th className="text-right">Bonus</th>
                  <th className="text-right">Commission</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.staff_id} data-testid={`incentive-row-${r.staff_id}`}>
                    <td className="text-slate-950 font-extrabold">{r.staff_name}</td>
                    <td className="text-right tabular font-semibold text-slate-700">{money(r.service_revenue)}</td>
                    <td className="text-right tabular font-semibold text-slate-700">{money(r.retail_revenue)}</td>
                    <td className="text-right tabular font-extrabold text-amber-800">
                      {money(r.daily_bonus)}
                    </td>
                    <td className="text-right tabular font-semibold text-emerald-800">{money(r.retail_commission)}</td>
                    <td className="text-right tabular font-extrabold text-slate-950 bg-slate-50/50">
                      {money(r.total_earned)}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 font-medium py-8">
                      No transactions recorded for {day || "selected day"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lss-card p-6 border-t-4 border-amber-500" data-testid="reorder-widget">
          <div className="flex items-center justify-between">
            <div className="lss-overline text-amber-800">Reorder Alerts</div>
            {poNeeds.length > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </div>

          <div className="font-serif-lux text-2xl font-bold text-slate-950 mt-1 mb-4">
            {poNeeds.length} SKUs need action
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {poNeeds.slice(0, 8).map((p) => (
              <motion.div
                key={p.sku_id}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                className="border-l-4 border-amber-500 bg-amber-50/40 p-3.5 rounded-r-xl shadow-xs border border-amber-200/60"
              >
                <div className="text-sm font-extrabold text-slate-950 truncate flex items-center justify-between">
                  <span>{p.sku_name}</span>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                </div>
                <div className="text-xs text-slate-700 font-semibold mt-1">
                  On hand: <span className="font-extrabold text-slate-950">{p.on_hand}</span> · Suggested PO: <span className="font-extrabold text-amber-900">{p.suggested_order_qty} units</span>
                </div>
              </motion.div>
            ))}
            {poNeeds.length === 0 && (
              <div className="text-sm text-slate-500 font-medium py-4">All stock levels are healthy.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
