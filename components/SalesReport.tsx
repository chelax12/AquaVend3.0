import React, { useMemo } from 'react';
import { VendoState } from '../types';
import { TrendingUp, Calendar, DollarSign, Database, History, Coins, ArrowUpRight, Zap, ShieldAlert } from 'lucide-react';

interface SalesReportProps {
  state: VendoState;
  activeUnitId: string;
  onResetCounter: () => void;
  isResetting: boolean;
}

export const SalesReport: React.FC<SalesReportProps> = ({ state, activeUnitId, onResetCounter, isResetting }) => {
  const { p1, p5, p10 } = state?.insertedCoins || { p1: 0, p5: 0, p10: 0 };
  const currentVaultTotal = (p1 * 1) + (p5 * 5) + (p10 * 10);

  // Aggregation Logic
  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Calculate start of week (last 7 days)
    const startOfWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).getTime();
    
    // Calculate start of month (last 30 days)
    const startOfMonth = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).getTime();

    const aggregate = (sinceTimestamp: number) => {
      return state.history
        .filter(h => new Date(h.date).getTime() >= sinceTimestamp)
        .reduce((sum, h) => sum + h.total, 0);
    };

    // Live stats: include current vault total in the current period
    // We assume current vault coins were inserted today (since the last reset)
    return {
      daily: aggregate(startOfDay) + currentVaultTotal,
      weekly: aggregate(startOfWeek) + currentVaultTotal,
      monthly: aggregate(startOfMonth) + currentVaultTotal,
      allTime: state.history.reduce((sum, h) => sum + h.total, 0) + currentVaultTotal
    };
  }, [state.history, currentVaultTotal]);

  return (
    <div className="space-y-8 sm:space-y-10 animate-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tighter">AQUAVEND Terminal</h1>
          <p className="text-[10px] sm:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1 sm:mt-2 flex items-center gap-2">
            <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
            Node: {activeUnitId}
          </p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
             <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Aggregation Active</span>
          </div>
        </div>
      </header>

      {/* Main Temporal Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
         {[
           { label: 'Daily Revenue', value: stats.daily, icon: <Zap />, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Weekly Performance', value: stats.weekly, icon: <TrendingUp />, color: 'text-violet-600', bg: 'bg-violet-50' },
           { label: 'Monthly Volume', value: stats.monthly, icon: <Calendar />, color: 'text-emerald-600', bg: 'bg-emerald-50' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[44px] border border-slate-100 shadow-xl relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 ${stat.bg} rounded-bl-[40px] sm:rounded-bl-[60px] opacity-40 group-hover:scale-110 transition-transform`} />
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-2 sm:mb-4">{stat.label}</p>
              <h3 className={`text-2xl sm:text-4xl font-black text-slate-900 tracking-tight`}>₱{stat.value.toLocaleString()}</h3>
              <div className="mt-4 sm:mt-6 flex items-center gap-2 text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                 <ArrowUpRight className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${stat.color}`} />
                 Archived From History
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Current Inventory Card */}
        <div className="lg:col-span-3 bg-white rounded-[32px] sm:rounded-[48px] border border-slate-100 p-6 sm:p-12 shadow-xl flex flex-col justify-between">
           <div>
             <div className="flex justify-between items-center mb-6 sm:mb-10">
                <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight flex items-center gap-2 sm:gap-3">
                  <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  Vault Inventory
                </h2>
                <div className="p-3 sm:p-4 bg-slate-50 rounded-[16px] sm:rounded-[20px] text-slate-400">
                  <History className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
             </div>
             
             <div className="space-y-6 sm:space-y-8">
                {[
                  { label: '₱1 Storage', count: p1, val: p1 * 1, color: 'bg-blue-600', pct: (p1 * 1 / (currentVaultTotal || 1)) * 100 },
                  { label: '₱5 Storage', count: p5, val: p5 * 5, color: 'bg-violet-600', pct: (p5 * 5 / (currentVaultTotal || 1)) * 100 },
                  { label: '₱10 Storage', count: p10, val: p10 * 10, color: 'bg-emerald-600', pct: (p10 * 10 / (currentVaultTotal || 1)) * 100 }
                ].map((item, i) => (
                  <div key={i} className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-end">
                       <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label} ({item.count} PCS)</span>
                       <span className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">₱{item.val.toLocaleString()}</span>
                    </div>
                    <div className="h-3 sm:h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                       <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
             </div>
           </div>

           <div className="mt-8 sm:mt-12 pt-6 sm:pt-10 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Lifetime</p>
                <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter">₱{stats.allTime.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Reliability</p>
                <p className="text-lg sm:text-xl font-black text-blue-600">99.8%</p>
              </div>
           </div>
        </div>

        {/* Settlement Panel */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-[32px] sm:rounded-[48px] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-blue-600/10 rounded-full blur-3xl -mr-24 -mt-24 sm:-mr-32 sm:-mt-32" />
            <div className="relative z-10 h-full flex flex-col justify-between gap-8 sm:gap-0">
               <div>
                  <p className="text-[10px] sm:text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 sm:mb-4">Unsettled Cash</p>
                  <h3 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4">₱{currentVaultTotal.toLocaleString()}</h3>
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <ShieldAlert size={12} className="text-amber-500" />
                    Physical Audit Recommended
                  </div>
               </div>

               <div className="space-y-4 sm:space-y-6">
                  <div className="p-6 sm:p-8 bg-white/5 border border-white/10 rounded-[24px] sm:rounded-[32px]">
                    <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed italic">Last settlement: {state.history[0]?.date.split(',')[0] || 'Never'}</p>
                  </div>
                  <button 
                    onClick={onResetCounter}
                    disabled={isResetting || currentVaultTotal === 0}
                    className="w-full py-5 sm:py-7 bg-blue-600 text-white rounded-[20px] sm:rounded-[28px] font-black text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-2xl hover:bg-blue-500 transition-all disabled:opacity-30 active:scale-95 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    {isResetting ? <Loader2 size={18} className="animate-spin" /> : <DollarSign className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
                    {isResetting ? 'Processing...' : 'Settle Balance'}
                  </button>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Helper for Loader
const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
