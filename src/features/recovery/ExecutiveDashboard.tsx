import React from 'react';
import { IndianRupee, TrendingUp, ShieldAlert, Zap } from 'lucide-react';
import type { RecoveryCase, LeakVector } from './types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../../shared/ThemeContext';
import { AnimatedCounter } from '../../shared/AnimatedCounter';

interface ExecutiveDashboardProps {
  cases: RecoveryCase[];
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ cases }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
    { name: 'Pending Diagnosis', value: cases.filter(c => c.status === 'DETECTED' || c.status === 'DIAGNOSED').length, color: '#6B7280' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Top Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Money Recovered */}
        <div className={`rounded-xl border p-4 transition-all ${
          isDark 
            ? 'bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#2E2E2E]' 
            : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-[#A1A1A1]' : 'text-neutral-500'}`}>
              Money Recovered
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <AnimatedCounter value={totalMoneyRecovered} prefix="₹" />
            </span>
          </div>
          <div className={`mt-1 flex items-center gap-1.5 text-[11px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            <span className="text-emerald-500 font-medium">
              <AnimatedCounter value={totalRecoveredCount} /> settled
            </span>
            <span>·</span>
            <span>
              <AnimatedCounter value={recoveryRate} decimals={1} suffix="%" /> recovery rate
            </span>
          </div>
        </div>

        {/* Card 2: Total Exposure */}
        <div className={`rounded-xl border p-4 transition-all ${
          isDark 
            ? 'bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#2E2E2E]' 
            : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-[#A1A1A1]' : 'text-neutral-500'}`}>
              Total Revenue At Risk
            </span>
            <div className="w-7 h-7 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5 text-red-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <AnimatedCounter value={totalRevenueAtRisk} prefix="₹" />
            </span>
          </div>
          <div className={`mt-1 flex items-center gap-1.5 text-[11px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            <span>Across <AnimatedCounter value={cases.length} /> failure incidents</span>
          </div>
        </div>

        {/* Card 3: Active Interventions */}
        <div className={`rounded-xl border p-4 transition-all ${
          isDark 
            ? 'bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#2E2E2E]' 
            : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-[#A1A1A1]' : 'text-neutral-500'}`}>
              Active Recovery
            </span>
            <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <AnimatedCounter value={activeInterventions} />
            </span>
          </div>
          <div className={`mt-1 flex items-center gap-1.5 text-[11px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            <span>In flight via Voice / WhatsApp / B2B</span>
          </div>
        </div>

        {/* Card 4: Compliant Stops */}
        <div className={`rounded-xl border p-4 transition-all ${
          isDark 
            ? 'bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#2E2E2E]' 
            : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-[#A1A1A1]' : 'text-neutral-500'}`}>
              Compliant Stops
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <AnimatedCounter value={stoppedCompliant} />
            </span>
          </div>
          <div className={`mt-1 flex items-center gap-1.5 text-[11px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
            <span>RBI DND & Touchpoint caps respected</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Bar Chart */}
        <div className={`lg:col-span-2 rounded-xl border p-5 transition-colors ${
          isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-xs font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Revenue Risk vs Recovered by Vector
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                Breakdown of payment failures across sub models
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-sm ${isDark ? 'bg-neutral-600' : 'bg-neutral-400'}`} />
                <span className={isDark ? 'text-[#A1A1A1]' : 'text-neutral-600'}>Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                <span className={isDark ? 'text-[#A1A1A1]' : 'text-neutral-600'}>Recovered</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke={isDark ? "#52525B" : "#9CA3AF"} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: isDark ? '#1F1F1F' : '#E5E7EB' }} 
                />
                <YAxis 
                  stroke={isDark ? "#52525B" : "#9CA3AF"} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `₹${v / 1000}k`} 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF',
                    borderColor: isDark ? '#1F1F1F' : '#E5E7EB',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: isDark ? '#EDEDED' : '#111827',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Bar dataKey="RevenueAtRisk" fill={isDark ? "#27272A" : "#D1D5DB"} radius={[4, 4, 0, 0]} />
                <Bar dataKey="MoneyRecovered" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lifecycle Pie Chart */}
        <div className={`rounded-xl border p-5 transition-colors ${
          isDark ? 'bg-[#0A0A0A] border-[#1F1F1F]' : 'bg-white border-neutral-200 shadow-sm'
        }`}>
          <div className="mb-3">
            <h3 className={`text-xs font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Case Lifecycle Status
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>
              Distribution across recovery workflow
            </p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? "#0A0A0A" : "#FFFFFF"} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF',
                    borderColor: isDark ? '#1F1F1F' : '#E5E7EB',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: isDark ? '#EDEDED' : '#111827'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}`}>{cases.length}</span>
              <span className={`text-[9px] font-mono uppercase ${isDark ? 'text-[#71717A]' : 'text-neutral-500'}`}>Total Cases</span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className={isDark ? 'text-[#A1A1A1]' : 'text-neutral-600'}>{d.name}</span>
                </div>
                <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
