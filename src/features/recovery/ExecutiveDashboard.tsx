import React from 'react';
import { IndianRupee, TrendingUp, ShieldAlert, Zap } from 'lucide-react';
import type { RecoveryCase, LeakVector } from './types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface ExecutiveDashboardProps {
  cases: RecoveryCase[];
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ cases }) => {
  const totalRevenueAtRisk = cases.reduce((acc, c) => acc + c.amountAtRisk, 0);
  const totalMoneyRecovered = cases.reduce((acc, c) => acc + c.totalAmountRecovered, 0);
  const recoveryRate = totalRevenueAtRisk > 0 ? (totalMoneyRecovered / totalRevenueAtRisk) * 100 : 0;
  
  const activeInterventions = cases.filter(c => c.status === 'INTERVENING' || c.status === 'PROMISED_TO_PAY').length;
  const stoppedCompliant = cases.filter(c => c.status === 'STOPPED_COMPLIANT').length;
  const totalRecoveredCount = cases.filter(c => c.status === 'RECOVERED').length;

  // Leak Vector breakdown
  const vectorMap: Record<LeakVector, { name: string; risk: number; recovered: number; count: number }> = {
    SUBSCRIPTION_FAIL: { name: 'Subscriptions', risk: 0, recovered: 0, count: 0 },
    CHECKOUT_ABANDON: { name: 'Checkout Abandon', risk: 0, recovered: 0, count: 0 },
    B2B_INVOICE: { name: 'B2B Receivables', risk: 0, recovered: 0, count: 0 },
    MANDATE_FAIL: { name: 'UPI Mandates', risk: 0, recovered: 0, count: 0 }
  };

  cases.forEach(c => {
    if (vectorMap[c.leakVector]) {
      vectorMap[c.leakVector].risk += c.amountAtRisk;
      vectorMap[c.leakVector].recovered += c.totalAmountRecovered;
      vectorMap[c.leakVector].count += 1;
    }
  });

  const chartData = Object.values(vectorMap).map(v => ({
    name: v.name,
    RevenueAtRisk: v.risk,
    MoneyRecovered: v.recovered
  }));

  const pieData = [
    { name: 'Recovered', value: totalRecoveredCount, color: '#10B981' },
    { name: 'Active / Promised', value: activeInterventions, color: '#3B82F6' },
    { name: 'Stopped (Compliant)', value: stoppedCompliant, color: '#F59E0B' },
    { name: 'Unrecoverable', value: cases.filter(c => c.status === 'FAILED_UNRECOVERABLE').length, color: '#EF4444' },
    { name: 'Pending Diagnosis', value: cases.filter(c => c.status === 'DETECTED' || c.status === 'DIAGNOSED').length, color: '#6B7280' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Money Recovered */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 shadow-xl shadow-emerald-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Total Money Recovered
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{totalMoneyRecovered.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">{totalRecoveredCount} Cases Resolved</span>
            <span>•</span>
            <span>Razorpay Settled</span>
          </div>
        </div>

        {/* Card 2: Revenue at Risk */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950/80 via-slate-900 to-slate-900 border border-blue-500/30 p-5 shadow-xl shadow-blue-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Total Revenue At Risk
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{totalRevenueAtRisk.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-xs text-slate-400">
            <span>Across {cases.length} Total Cases</span>
          </div>
        </div>

        {/* Card 3: Recovery Rate */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 shadow-xl shadow-indigo-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Net Recovery Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {recoveryRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-xs text-slate-400">
            <span className="text-indigo-300 font-medium">Measured Batch ROI</span>
          </div>
        </div>

        {/* Card 4: Compliance & Stopping Guards */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/30 p-5 shadow-xl shadow-amber-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Compliant Stops & Active
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-amber-300">{stoppedCompliant}</span>
              <span className="text-xs text-slate-400 block">Stopped Compliant</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-400">{activeInterventions}</span>
              <span className="text-xs text-slate-400 block">Active / P2P</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>DND & RBI Policy Protected</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Recovery by Leak Vector */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Revenue Recovery by Leak Vector</h3>
              <p className="text-xs text-slate-400">Comparison of Revenue at Risk vs Money Recovered (₹)</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                />
                <Bar dataKey="RevenueAtRisk" name="Revenue At Risk" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MoneyRecovered" name="Money Recovered" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Case Status Distribution */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Recovery Case Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution across resolution statuses</p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 text-[11px] truncate">{item.name}: <strong className="text-white">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
