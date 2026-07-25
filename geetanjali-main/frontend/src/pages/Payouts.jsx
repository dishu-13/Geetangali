import { useEffect, useState } from "react";
import api, { money, errMsg } from "../lib/api";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DatePicker from "@/components/ui/DatePicker";

export default function Payouts() {
  const { user } = useAuth();
  const [month, setMonth] = useState("2026-07");
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const load = () => {
    if (!month) return;
    setPageLoading(true);
    api
      .get(`/payouts/monthly?month=${month}`)
      .then((r) => setData(r.data))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [month]);

  const confirm = async (row) => {
    setBusyId(row.staff_id);
    try {
      await api.post("/payouts/confirm", {
        staff_id: row.staff_id,
        payout_date: month,
        amount: row.total_earned,
        breakdown: {
          base_salary: row.base_salary,
          service_revenue: row.service_revenue,
          retail_revenue: row.retail_revenue,
          monthly_bonus: row.monthly_bonus,
          daily_bonus_sum: row.daily_bonus_sum,
          product_incentive: row.product_incentive,
          retail_commission: row.retail_commission,
          prepaid_card_bonus: row.prepaid_card_bonus,
        },
      });
      toast.success(`Released ${money(row.total_earned)} monthly payout to ${row.staff_name}`);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  const canConfirm = user?.role === "owner" || user?.role === "admin";
  const rows = data?.rows || [];
  const total = rows.reduce((s, r) => s + r.total_earned, 0);
  const pending = rows.filter((r) => !r.confirmed && r.total_earned > 0);

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="lss-overline">Monthly Payout Release</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">Monthly Staff Payroll & Incentives</h1>
          <p className="text-slate-600 font-medium text-sm mt-1 max-w-xl">
            Automated calculations incorporating base salary, service multipliers, daily tier bonuses, and retail commissions.
          </p>
        </div>
        <DatePicker
          type="month"
          testId="payout-month-picker"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {pageLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>)}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="lss-card p-6">
              <div className="lss-overline">Total Monthly Payout</div>
              <div className="text-3xl sm:text-4xl font-extrabold mt-2 text-slate-900 tabular" data-testid="total-payout">
                {money(total)}
              </div>
            </div>
            <div className="lss-card p-6">
              <div className="lss-overline">Staff Count</div>
              <div className="text-3xl sm:text-4xl font-extrabold mt-2 text-slate-900">
                {rows.filter((r) => r.total_earned > 0).length}
              </div>
            </div>
            <div className="lss-card p-6">
              <div className="lss-overline">Pending Confirmations</div>
              <div className="text-3xl sm:text-4xl font-extrabold mt-2 text-rose-700">{pending.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows
              .filter((r) => r.total_earned > 0)
              .map((r) => (
                <div
                  key={r.staff_id}
                  className="lss-card p-6 flex flex-col justify-between"
                  data-testid={`payout-card-${r.staff_id}`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="lss-overline">Staff Member</div>
                        <div className="text-xl font-extrabold text-slate-900 mt-0.5">{r.staff_name}</div>
                      </div>
                      {r.confirmed ? (
                        <span className="lss-badge bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">Released</span>
                      ) : (
                        <span className="lss-badge bg-rose-100 text-rose-900 border border-rose-300 font-bold">Pending</span>
                      )}
                    </div>

                    <div className="mt-5 space-y-2 text-xs">
                      <Row label="Base Salary" value={money(r.base_salary)} />
                      <Row label="Service Revenue" value={money(r.service_revenue)} />
                      <Row label="Monthly Efficiency Bonus" value={money(r.monthly_bonus)} accent />
                      <Row label="Daily Tier Bonus Sum" value={money(r.daily_bonus_sum)} accent />
                      <Row label="Product Incentives" value={money(r.product_incentive)} accent />
                      {r.retail_commission > 0 && <Row label="Retail Commission" value={money(r.retail_commission)} />}
                      {r.prepaid_card_bonus > 0 && <Row label="Prepaid Card Bonus" value={money(r.prepaid_card_bonus)} accent />}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-end justify-between">
                    <div>
                      <div className="lss-overline">Monthly Net Payable</div>
                      <div className="text-2xl font-extrabold text-slate-900 tabular">
                        {money(r.total_earned)}
                      </div>
                    </div>
                    {r.confirmed ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Released
                      </div>
                    ) : (
                      <button
                        data-testid={`confirm-${r.staff_id}`}
                        disabled={!canConfirm || busyId === r.staff_id}
                        onClick={() => confirm(r)}
                        className="lss-btn-gold px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-md disabled:opacity-50"
                      >
                        {busyId === r.staff_id ? "Processing…" : "Release Payout"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {rows.filter((r) => r.total_earned > 0).length === 0 && (
              <div className="text-slate-500 font-medium py-8 text-center col-span-full">No payroll calculations available for {month}.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const Row = ({ label, value, accent }) => (
  <div className="flex justify-between items-center">
    <div className="text-slate-600 font-medium">{label}</div>
    <div className={`tabular font-semibold ${accent ? "text-amber-800 font-bold" : "text-slate-900"}`}>{value}</div>
  </div>
);
