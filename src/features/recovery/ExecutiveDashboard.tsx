import React from 'react';
import { IndianRupee, TrendingUp, ShieldAlert, Zap } from 'lucide-react';
import type { RecoveryCase, LeakVector } from './types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

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
    CHECKOUT_ABANDON: { name: 'Cart Drop-offs', risk: 0, recovered: 0, count: 0 },
    B2B_INVOICE: { name: 'B2B Invoices', risk: 0, recovered: 0, count: 0 },
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
    { name: 'Active / P2P', value: activeInterventions, color: '#3B82F6' },
    { name: 'Stopped (Compliant)', value: stoppedCompliant, color: '#F59E0B' },
    { name: 'Unrecoverable', value: cases.filter(c => c.status === 'FAILED_UNRECOVERABLE').length, color: '#EF4444' },
    { name: 'Pending Diagnosis', value: cases.filter(c => c.status === 'DETECTED' || c.status === 'DIAGNOSED').length, color: '#52525B' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Top Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Money Recovered */}
        <div className="rounded-xl bg-[#0A0A0A] border border-[#1F1F1F] p-4 transition-all hover:border-[#2E2E2E]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1A1]">
              Money Recovered
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold text-white tracking-tight">
              ₹{totalMoneyRecovered.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#71717A]">
            <span className="text-emerald-400 font-medium">{totalRecoveredCount} settled</span>
            <span>·</span>
            <span>Razorpay Gateway</span>
          </div>
        </div>

        {/* Card 2: Revenue at Risk */}
        <div className="rounded-xl bg-[#0A0A0A] border border-[#1F1F1F] p-4 transition-all hover:border-[#2E2E2E]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1A1]">
              Revenue At Risk
            </span>
            <div className="w-7 h-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5 text-[#A1A1A1]" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold text-white tracking-tight">
              ₹{totalRevenueAtRisk.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#71717A]">
            <span>Across {cases.length} total failure cases</span>
          </div>
        </div>

        {/* Card 3: Recovery Rate */}
        <div className="rounded-xl bg-[#0A0A0A] border border-[#1F1F1F] p-4 transition-all hover:border-[#2E2E2E]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1A1]">
              Net Recovery Rate
            </span>
            <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold text-white tracking-tight">
              {recoveryRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#71717A]">
            <span className="text-blue-400 font-medium">Measured Batch ROI</span>
          </div>
        </div>

        {/* Card 4: Compliance & Stopping Guards */}
        <div className="rounded-xl bg-[#0A0A0A] border border-[#1F1F1F] p-4 transition-all hover:border-[#2E2E2E]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1A1]">
              Compliance & Active
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="text-2xl font-semibold text-amber-300">{stoppedCompliant}</span>
              <span className="text-[10px] text-[#71717A] block">Stopped Safe</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-semibold text-blue-400">{activeInterventions}</span>
              <span className="text-[10px] text-[#71717A] block">Active / P2P</span>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-[#71717A]">
            <span>DND & Max Touchpoint Guard</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Recovery by Vector Bar Chart */}
        <div className="lg:col-span-2 rounded-xl bg-[#0A0A0A] border border-[#1F1F1F] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-[#EDEDED]">Recovery by Leak Vector</h3>
              <p className="text-[11px] text-[#71717A]">Revenue at Risk vs. Successfully Recovered (₹)</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#27272A]" />
                <span className="text-[#A1A1A1]">At Risk</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[#A1A1A1]">Recovered</span>
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#52525B" fontSize={11} tickLine={false} axisLine={{ stroke: '#27272A' }} />
                <YAxis stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121212', borderColor: '#27272A', borderRadius: '8px', fontSize: '11px', color: '#EDEDED' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Bar dataKey="RevenueAtRisk" name="Revenue at Risk" fill="#27272A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MoneyRecovered" name="Money Recovered" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Resolution Distribution Donut */}
        <div className="rounded-xl bg-[#0A0A0A] border border-[#1F1F1F] p-4 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#EDEDED]">Case Resolution Status</h3>
            <p className="text-[11px] text-[#71717A]">Distribution across lifecycle stages</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0A0A0A" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#121212', borderColor: '#27272A', borderRadius: '8px', fontSize: '11px', color: '#EDEDED' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-white">{cases.length}</span>
              <span className="text-[10px] text-[#71717A] uppercase tracking-wider">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1 border-t border-[#1F1F1F]">
            {pieData.slice(0, 4).map((p) => (
              <div key={p.name} className="flex items-center space-x-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-[#A1A1A1] truncate">{p.name}: <strong className="text-white">{p.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
