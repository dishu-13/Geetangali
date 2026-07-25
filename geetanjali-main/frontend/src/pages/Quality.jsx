import { useEffect, useState } from "react";
import api, { money } from "../lib/api";
import { ShieldAlert } from "lucide-react";

export default function Quality() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/pos/quality-failures")
       .then((r) => setRows(r.data))
       .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="lss-overline">Quality Control</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">Critical Quality Failures</h1>
        <p className="text-slate-600 font-medium text-sm sm:text-base mt-2 max-w-2xl">
          Services provided at a 100% discount are automatically flagged as service recovery incidents and escalated for management audit.
        </p>
      </div>

      <div className="lss-card overflow-x-auto border border-slate-200 rounded-lg">
        <table className="lss-table" data-testid="quality-table">
          <thead>
            <tr>
              <th></th>
              <th>Date</th>
              <th>Invoice</th>
              <th>Client</th>
              <th>Service</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Discount</th>
              <th>Staff</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-4">
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4">
                        <div className="h-10 bg-slate-200 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="bg-rose-50 border-l-4 border-rose-500" data-testid={`qf-${r.id}`}>
                <td className="w-8">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                </td>
                <td className="font-bold text-slate-900">{r.date}</td>
                <td className="text-slate-700 font-medium">{r.invoice_number}</td>
                <td className="font-bold text-slate-900">{r.client}</td>
                <td className="max-w-[280px] truncate font-semibold text-slate-900">{r.item_name}</td>
                <td className="text-right tabular font-medium text-slate-700">{money(r.rate)}</td>
                <td className="text-right tabular text-rose-700 font-bold">{money(r.total_discount)}</td>
                <td className="text-xs text-slate-700 font-medium">
                  {r.staff.map((s) => s.name).join(", ")}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-slate-500 font-medium py-12">
                  No quality failures recorded — clean operational log.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
