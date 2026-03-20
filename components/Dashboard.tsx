import React, { useState } from 'react';
import { StatsCard } from './StatsCard';
import { Coins, DollarSign, Droplets, AlertTriangle, Activity, RotateCcw, X, Info, Loader2, Zap, Download, ChevronRight } from 'lucide-react';
import { VendoState, SystemAlert } from '../types';
import { getCoinStatus } from '../src/utils';
import { supabase } from '../lib/supabase';


interface DashboardProps {
  state: VendoState;
  alerts: SystemAlert[];
  activeUnitId: string;
  onReset: () => void;
  onResetCounter: () => void;
  onResetChangeBank: () => void;
  onClearAlerts: () => void;
  onExport: () => void;
  isResetting?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  state, 
  alerts,
  activeUnitId,
  onReset, 
  onResetCounter, 
  onResetChangeBank,
  onClearAlerts,
  onExport,
  isResetting = false
}) => {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [refillDenomination, setRefillDenomination] = useState<'P1' | 'P5' | null>(null);
  const [refillAmount, setRefillAmount] = useState('');
  const { 
    insertedCoins = { p1: 0, p5: 0, p10: 0 }, 
    changeBank = { p1: 0, p5: 0 },
    waterLevel = 0
  } = state || {};

  const { p1, p5, p10 } = insertedCoins;
  const totalEarnings = (p1 * 1) + (p5 * 5) + (p10 * 10);
  const totalCoins = p1 + p5 + p10;
  const p1ChangeStatus = getCoinStatus(changeBank.p1);
  const p5ChangeStatus = getCoinStatus(changeBank.p5);

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'OPTIMAL': return 'bg-emerald-500';
      case 'NOTIFY': return 'bg-blue-500';
      case 'REFILL_NEEDED': return 'bg-amber-500';
      case 'REFILL_IMMEDIATELY': return 'bg-orange-600';
      case 'EMPTY': return 'bg-red-600';
      default: return 'bg-slate-500';
    }
  };

  const openRefillModal = (denomination: 'P1' | 'P5') => {
    setRefillDenomination(denomination);
    setIsRefillModalOpen(true);
    setRefillAmount('');
  };

  const handleConfirmRefill = async () => {
    if (!refillDenomination || !refillAmount) return;
    const amount = parseInt(refillAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      await supabase.rpc('refill_hopper', {
        unit_id_to_update: activeUnitId,
        denomination: refillDenomination,
        refill_type: 'ADD',
        refill_value: amount
      });
      setIsRefillModalOpen(false);
    } else {
      alert('Please enter a valid number of coins.');
    }
  };

  const getWaterStatus = () => {
    const level = waterLevel;
    if (level <= 0) return { label: 'EMPTY', color: 'text-red-600', bg: 'bg-red-50', severity: 'High' };
    if (level < 20) return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-50', severity: 'Medium' };
    if (level < 60) return { label: 'NOMINAL', color: 'text-orange-600', bg: 'bg-orange-50', severity: 'Low' };
    return { label: 'OPTIMAL', color: 'text-emerald-600', bg: 'bg-emerald-50', severity: 'None' };
  };

  const status = getWaterStatus();

  return (
    <div className="space-y-6 sm:space-y-12 animate-in">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-8">
        <div>
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-3">
             <div className="p-2.5 sm:p-4 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-[20px] shadow-sm border border-emerald-100">
               <Zap className="w-5 h-5 sm:w-7 sm:h-7 animate-pulse" />
             </div>
             <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter">System Console</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-[8px] sm:text-[10px] font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-2 sm:px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1">
              <Activity size={10} /> {activeUnitId}
            </span>
            <div className="h-3 sm:h-4 w-[1px] bg-slate-200" />
            <span className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Telemetry: {state.lastUpdated}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 bg-slate-50 px-4 sm:px-8 py-2 sm:py-3 rounded-full border border-slate-100 shadow-inner">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-[9px] sm:text-[11px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">
                System Active
              </span>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-slate-100 shadow-xl flex items-center justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-50 rounded-bl-[80px] sm:rounded-bl-[100px] -mr-8 -mt-8 sm:-mr-10 sm:-mt-10 opacity-40 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-4 sm:gap-8 relative z-10">
               <div className={`p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] ${status.bg} ${status.color} shadow-lg`}>
                  <Droplets className="w-7 h-7 sm:w-9 sm:h-9" />
               </div>
               <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Water Level</p>
                  <h4 className={`text-3xl sm:text-5xl font-black ${status.color}`}>{state.waterLevel}%</h4>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-1 sm:mt-2 uppercase tracking-tighter">Water Status: {status.label}</p>
               </div>
            </div>
            <div className="h-16 w-16 sm:h-20 sm:w-20 relative hidden sm:block">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="40" cy="40" r="34" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                 <circle cx="40" cy="40" r="34" fill="transparent" stroke="currentColor" strokeWidth="10" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * state.waterLevel / 100)} className={`${status.color} transition-all duration-1000`} strokeLinecap="round" />
               </svg>
            </div>
        </div>

        <div 
          onClick={() => setShowAlertModal(true)}
          className="group cursor-pointer bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-slate-100 shadow-xl flex items-center justify-between transition-all hover:scale-[1.02] relative overflow-hidden"
        >
            <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-tl-[80px] sm:rounded-tl-[100px] -mb-8 -mr-8 sm:-mb-10 sm:-mr-10 opacity-40"></div>
            <div className="flex items-center gap-4 sm:gap-8 relative z-10">
               <div className={`p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] ${state.waterLevel < 20 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'} shadow-lg group-hover:bg-blue-600 group-hover:text-white transition-colors`}>
                  <AlertTriangle className="w-7 h-7 sm:w-9 sm:h-9" />
               </div>
               <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Health Diagnostics</p>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900">System Alerts</h4>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-1 sm:mt-2 uppercase tracking-tighter">Tap for audit</p>
               </div>
            </div>
            <div className="p-3 sm:p-4 bg-slate-50 text-slate-300 rounded-[16px] sm:rounded-[20px] group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
        </div>
      </div>

      <div className="mt-8 sm:mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Change Bank Status</h3>
          <button 
              onClick={onResetChangeBank}
              disabled={isResetting}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-lg border-b-4 active:border-b-0 active:translate-y-1 ${isResetting ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'}`}
          >
              {isResetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              {isResetting ? 'Processing...' : 'Reset Change Bank'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div 
            onClick={() => openRefillModal('P1')}
            className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-xl flex justify-between items-center cursor-pointer hover:border-blue-200 transition-all group"
          >
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">P1 Change</p>
              <span className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tighter">
                {changeBank.p1} PCS
              </span>
            </div>
            <div className={`px-4 py-2 rounded-full text-[8px] sm:text-[10px] font-black text-white text-center min-w-[100px] ${getStatusColor(p1ChangeStatus.level)}`}>
              {p1ChangeStatus.text}
            </div>
          </div>
          <div 
            onClick={() => openRefillModal('P5')}
            className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-xl flex justify-between items-center cursor-pointer hover:border-blue-200 transition-all group"
          >
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">P5 Change</p>
              <span className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tighter">
                {changeBank.p5} PCS
              </span>
            </div>
            <div className={`px-4 py-2 rounded-full text-[8px] sm:text-[10px] font-black text-white text-center min-w-[100px] ${getStatusColor(p5ChangeStatus.level)}`}>
              {p5ChangeStatus.text}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inserted Coins</h3>
          <div className="flex items-center gap-3">
            <button 
                onClick={onResetCounter}
                disabled={isResetting}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-[9px] uppercase tracking-widest shadow-lg border-b-4 active:border-b-0 active:translate-y-1 ${isResetting ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'}`}
            >
                {isResetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                {isResetting ? 'Processing...' : 'Reset Counter'}
            </button>
            <button onClick={onExport} className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:text-blue-600 hover:border-blue-100 transition-all shadow-md active:scale-95">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard 
            title="₱1 Inserted" 
            value={p1} 
            subtitle={`₱${(p1 * 1).toLocaleString()}`} 
            icon={<Coins size={28} className="text-blue-600" />} 
            iconBgColor="bg-blue-600" 
            textColor="text-slate-900" 
          />
          <StatsCard 
            title="₱5 Inserted" 
            value={p5} 
            subtitle={`₱${(p5 * 5).toLocaleString()}`} 
            icon={<Coins size={28} className="text-emerald-600" />} 
            iconBgColor="bg-emerald-600" 
            textColor="text-slate-900" 
          />
          <StatsCard 
            title="₱10 Inserted" 
            value={p10} 
            subtitle={`₱${(p10 * 10).toLocaleString()}`} 
            icon={<Coins size={28} className="text-violet-600" />} 
            iconBgColor="bg-violet-600" 
            textColor="text-slate-900" 
          />
          <StatsCard 
            title="Net Earnings" 
            value={`₱${totalEarnings.toLocaleString()}`} 
            subtitle={`${totalCoins} PCS`} 
            icon={<DollarSign size={28} className="text-amber-600" />} 
            iconBgColor="bg-amber-600" 
            textColor="text-amber-600" 
          />
        </div>
      </div>

      {isRefillModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#0f172a]/80 backdrop-blur-md animate-in">
          <div className="bg-white rounded-[32px] sm:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.3)] w-full max-w-md overflow-hidden">
            <div className="p-6 sm:p-10">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter mb-2">Refill {refillDenomination} Hopper</h3>
              <p className="text-sm text-slate-500 mb-6">Enter the number of coins you are adding.</p>
              <input 
                type="number"
                value={refillAmount}
                onChange={(e) => setRefillAmount(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-2xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="e.g. 50"
              />
            </div>
            <div className="p-6 sm:p-10 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
              <button onClick={() => setIsRefillModalOpen(false)} className="w-full py-4 bg-white border border-slate-200 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all">
                Cancel
              </button>
              <button onClick={handleConfirmRefill} className="w-full py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all">
                Confirm Refill
              </button>
            </div>
          </div>
        </div>
      )}

      {showAlertModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#0f172a]/80 backdrop-blur-md animate-in">
          <div className="bg-white rounded-[32px] sm:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden">
            <div className="p-6 sm:p-10 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">System Alerts & Logs</h3>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Audit Loop</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button 
                  onClick={onClearAlerts}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-black text-[8px] sm:text-[9px] uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200"
                >
                  Clear History
                </button>
                <button onClick={() => setShowAlertModal(false)} className="p-2 sm:p-4 hover:bg-slate-100 rounded-[12px] sm:rounded-[20px] transition-all">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 sm:p-10 space-y-4 sm:space-y-5 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border flex gap-4 sm:gap-6 transition-all ${alert.severity === 'high' ? 'bg-red-50 border-red-100 text-red-900' : alert.severity === 'medium' ? 'bg-orange-50 border-orange-100 text-orange-900' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                   <div className={`p-3 sm:p-4 rounded-[16px] sm:rounded-[20px] shrink-0 h-fit ${alert.severity === 'high' ? 'bg-red-200 shadow-inner' : alert.severity === 'medium' ? 'bg-orange-200' : 'bg-blue-200'}`}>
                      <Info className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <span className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest opacity-60">{alert.type}</span>
                        <span className="text-[9px] sm:text-[10px] opacity-40 font-black">{new Date(alert.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold leading-relaxed">{alert.message}</p>
                   </div>
                </div>
              ))}
            </div>
            <div className="p-6 sm:p-10 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowAlertModal(false)} className="w-full py-4 sm:py-6 bg-white border border-slate-200 text-slate-900 font-black text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] rounded-[20px] sm:rounded-[24px] hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-[0.98]">
                Close Diagnostic View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
