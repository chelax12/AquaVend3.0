import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Menu, 
  X, 
  LogOut, 
  Droplets, 
  ShieldCheck,
  Download,
  RefreshCw,
  AlertCircle,
  Activity,
  BarChart2,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Zap,
  ChevronRight,
  Database,
  ArrowRight,
  TrendingUp,
  Plus,
  Monitor,
  Calendar
} from 'lucide-react';
import { Section, VendoState, HistoryEntry, SystemAlert } from './types';
import { NAV_ITEMS } from './constants';
import { Dashboard } from './components/Dashboard';
import { SalesReport } from './components/SalesReport';

import { supabase } from './lib/supabase';
import { enableWebPush } from './src/utils/push';
import { Auth } from './src/components/auth/Auth';



const INITIAL_STATE: VendoState = {
  insertedCoins: { p1: 0, p5: 0, p10: 0 },
  changeBank: { p1: 0, p5: 0 },
  waterLevel: 0,
  systemAlerts: 'Operational',
  lastUpdated: 'Initializing...',
  lastSeen: null,
  history: [],
  alerts: [],
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>(Section.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [state, setState] = useState<VendoState>(INITIAL_STATE);
  const [dbStatus, setDbStatus] = useState<'connected' | 'reconnecting' | 'error'>('connected');
  const [isResetting, setIsResetting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [ignoreRealtimeUntil, setIgnoreRealtimeUntil] = useState<number>(0);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleEnableNotifications = async () => {
    if (!session?.user?.id) {
      alert("Please log in to enable notifications.");
      return;
    }
    
    setIsSubscribing(true);
    try {
      await enableWebPush(supabase, session.user.id, activeUnitId);
      alert("Notifications enabled successfully!");
    } catch (error: any) {
      console.error("Error enabling notifications:", error);
      alert(`Failed to enable notifications: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const transformDataToNewState = (data: any): VendoState => {
  if (!data) return INITIAL_STATE;

  return {
    insertedCoins: {
      p1: data.p1_count ?? 0,
      p5: data.p5_count ?? 0,
      p10: data.p10_count ?? 0,
    },
    changeBank: {
      p1: data.change_p1_count ?? 0,
      p5: data.change_p5_count ?? 0,
    },
    waterLevel: data.water_level ?? 0,
    systemAlerts: data.system_status ?? 'Offline',
    lastUpdated: data.updated_at ? new Date(data.updated_at).toLocaleTimeString() : 'N/A',
    lastSeen: data.last_seen_at ? new Date(data.last_seen_at).toLocaleString() : null,
    // history will be loaded from collection_history
    history: [],
    alerts: [],
  };
};
  // Multi-machine management
  const [activeUnitId, setActiveUnitId] = useState<string>(() => {
    return localStorage.getItem('active_unit_id') || 'AQUA-VND-001';
  });
  const [unitList, setUnitList] = useState<string[]>([]);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnitInput, setNewUnitInput] = useState('');

  const fetchUnits = useCallback(async () => {
    if (!session?.user) return;

    try {
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('unit_id')
        .eq('owner_id', session.user.id);

      if (deviceError) throw deviceError;

      if (deviceData && deviceData.length > 0) {
        const ids = deviceData.map(d => d.unit_id);
        setUnitList(ids);
        
        if (!ids.includes(activeUnitId) || !activeUnitId) {
          const newActiveId = ids[0];
          setActiveUnitId(newActiveId);
          localStorage.setItem('active_unit_id', newActiveId);
        }
      } else {
        setUnitList([]);
        setActiveUnitId('');
        localStorage.removeItem('active_unit_id');
      }
    } catch (err) {
      console.error('Fetch units error:', err);
    }
  }, [session, activeUnitId]);




 

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session retrieval error:', error);
          if (error.message.includes('Refresh Token Not Found')) {
            await supabase.auth.signOut();
            setSession(null);
          }
        } else {
          setSession(session);
        }
      } catch (err) {
        console.error('Auth init failed:', err);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_OUT') {
        setSession(null);
        localStorage.removeItem('supabase.auth.token'); // Force clear if needed
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(session);
      } else {
        setSession(session);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      fetchUnits();
    }
  }, [session, fetchUnits]);

// -------------------- Supabase fetch (replaces Socket.IO) --------------------

const fetchMachineState = useCallback(async () => {
  if (!session?.user || !activeUnitId) return;

  try {
    setDbStatus(prev => (prev === 'error' ? 'reconnecting' : prev));

    const { data, error } = await supabase
      .from('machine_state')
      .select('*')
      .eq('unit_id', activeUnitId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      setState(prev => ({
        ...prev,
        ...transformDataToNewState(data),
        // keep any history already loaded
        history: prev.history,
      }));
    }

    setDbStatus('connected');
  } catch (err) {
    console.error('fetchMachineState error:', err);
    setDbStatus('error');
  }
}, [session, activeUnitId]);

const fetchHistory = useCallback(async () => {
  if (!session?.user || !activeUnitId) return;

  try {
    const { data, error } = await supabase
      .from('collection_history')
      .select('id, unit_id, p1_collected, p5_collected, p10_collected, total_amount, collected_at')
      .eq('unit_id', activeUnitId)
      .order('collected_at', { ascending: false });

    if (error) throw error;

    const history = (data ?? []).map((row: any) => ({
      id: row.id,
      date: new Date(row.collected_at).toLocaleString(),
      p1: row.p1_collected ?? 0,
      p5: row.p5_collected ?? 0,
      p10: row.p10_collected ?? 0,
      total: Number(row.total_amount ?? 0),
    }));

    setState(prev => ({ ...prev, history }));
  } catch (err) {
    console.error('fetchHistory error:', err);
  }
}, [session, activeUnitId]);

const fetchAlerts = useCallback(async () => {
  if (!session?.user || !activeUnitId) return;

  try {
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('unit_id', activeUnitId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    setAlerts(data || []);
  } catch (err) {
    console.error('fetchAlerts error:', err);
  }
}, [session, activeUnitId]);



useEffect(() => {
  if (!session?.user || !activeUnitId) return;

  // initial load
  fetchMachineState();
  fetchHistory();
  fetchAlerts();

  // Real-time subscription for machine_state
  const subscription = supabase
    .channel(`machine_state:${activeUnitId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'machine_state', filter: `unit_id=eq.${activeUnitId}` },
      (payload) => {
        if (payload.new) {
          setState(prev => ({
            ...prev,
            ...transformDataToNewState(payload.new),
            history: prev.history,
          }));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}, [session, activeUnitId, fetchMachineState, fetchHistory, fetchAlerts]);



  const fetchAllData = useCallback(async () => {
    await fetchMachineState();
    await fetchHistory();
    await fetchAlerts();
  }, [fetchMachineState, fetchHistory, fetchAlerts]);

  // Real-time subscription for new alerts
  useEffect(() => {
    if (!session?.user || !activeUnitId) return;

    const subscription = supabase
      .channel(`system_alerts:${activeUnitId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'system_alerts', filter: `unit_id=eq.${activeUnitId}` },
        (payload) => {
          setAlerts(currentAlerts => [payload.new as SystemAlert, ...currentAlerts]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session, activeUnitId]);

  useEffect(() => {
  if (activeUnitId) localStorage.setItem('active_unit_id', activeUnitId);
}, [activeUnitId]);

  const handleDeleteUnit = async (unitIdToDelete: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete machine ${unitIdToDelete}?\n\nThis action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      // 1. Delete associated history records first
      await supabase.from('collection_history').delete().eq('unit_id', unitIdToDelete);
      
      // 2. Delete associated system alerts
      await supabase.from('system_alerts').delete().eq('unit_id', unitIdToDelete);

      // 3. Delete from devices table to remove ownership
      const { error: deviceError } = await supabase.from('devices').delete().eq('unit_id', unitIdToDelete);
      if (deviceError) throw deviceError;

      // 4. Finally delete the state data
      const { error: stateError } = await supabase.from('machine_state').delete().eq('unit_id', unitIdToDelete);
      if (stateError) throw stateError;

      const newUnitList = unitList.filter(id => id !== unitIdToDelete);
      setUnitList(newUnitList);

      if (activeUnitId === unitIdToDelete) {
        setActiveUnitId(newUnitList.length > 0 ? newUnitList[0] : 'AQUA-VND-001');
      }

      alert(`Machine ${unitIdToDelete} has been successfully deleted.`);
    } catch (err: any) {
      console.error('Delete unit error:', err);
      alert(`Failed to delete machine: ${err.message}`);
    }
  };

  const handleAddUnit = async () => {
    const enteredCode = newUnitInput.trim().toUpperCase();
    if (!enteredCode) return;

    setIsResetting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to register a device.");
      }

      const { error } = await supabase.rpc("claim_device", { p_code: enteredCode });

      if (error) {
        throw error;
      }

      alert(`Node ${enteredCode} successfully registered and active.`);
      fetchUnits();
      setNewUnitInput('');
      setShowAddUnit(false);

    } catch (err: any) {
      console.error('Register Node error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const normalizeId = (s: string) =>
    (s ?? "")
      .replace(/\u00A0/g, " ")   // NBSP -> normal space
      .replace(/\s+/g, " ")      // collapse multiple spaces
      .trim()
      .toUpperCase();

  const handleResetCounter = async () => {
    const rawId = activeUnitId ?? "";
    const targetNorm = normalizeId(rawId);

    if (!targetNorm) {
      alert("Error: No active unit selected.");
      return;
    }

    const { p1, p5, p10 } = state.insertedCoins || { p1: 0, p5: 0, p10: 0 };
    const totalVal = p1 * 1 + p5 * 5 + p10 * 10;

    const confirmReset = window.confirm(
      `CONFIRM COLLECTION for ${rawId}\n\nVault Total: ₱${totalVal.toLocaleString()}\n\nThis will zero the machine coin counters and archive this transaction.`
    );
    if (!confirmReset) return;

    setIsResetting(true);

    try {
      // 1) Get ALL unit_ids from DB and find the exact match robustly
      const { data: rows, error: listErr } = await supabase
        .from("machine_state")
        .select("unit_id");

      if (listErr) throw listErr;

      const exactDbId =
        rows?.map(r => r.unit_id).find(id => normalizeId(id) === targetNorm);

      console.log("RESET raw:", JSON.stringify(rawId));
      console.log("RESET targetNorm:", JSON.stringify(targetNorm));
      console.log("RESET exactDbId:", JSON.stringify(exactDbId));

      if (!exactDbId) {
        throw new Error(
          `No matching unit_id found in DB for "${rawId}". Check your DB unit_id values for spaces/casing.`
        );
      }

      // 2) Update using EXACT DB value (guaranteed to match)
      const { data: updated, error: updateError } = await supabase
        .from("machine_state")
        .update({
          p1_count: 0,
          p5_count: 0,
          p10_count: 0,
          last_reset_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("unit_id", exactDbId)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;
      if (!updated) throw new Error("Update returned no row (unexpected).");

      // 3) Immediately re-check DB value (to detect overwriting)
      const { data: verify, error: verifyErr } = await supabase
        .from("machine_state")
        .select("unit_id, p1_count, p5_count, p10_count, updated_at")
        .eq("unit_id", exactDbId)
        .maybeSingle();

      if (verifyErr) throw verifyErr;

      console.log("RESET verify:", verify);

      // If it’s not 0 here, something is rewriting it (trigger/device)
      if (verify && (verify.p1_count !== 0 || verify.p5_count !== 0 || verify.p10_count !== 0)) {
        throw new Error(
          "Reset was overwritten immediately. Something (device/script/trigger) is writing the old counts back."
        );
      }

      // 4) Log to history
      await supabase.from('collection_history').insert([{
          unit_id: exactDbId,
          p1_collected: p1,
          p5_collected: p5,
          p10_collected: p10,
          total_amount: totalVal,
          collected_at: new Date().toISOString()
      }]);



      // Set ignore window for realtime updates (5 seconds)
      setIgnoreRealtimeUntil(Date.now() + 5000);

      // 5) Log the reset event as a system alert
      await supabase.from('system_alerts').insert([{
        unit_id: exactDbId,
        type: 'Counter Reset',
        message: `Coin counters were reset. Collected a total of ₱${totalVal.toLocaleString()}.`,
        severity: 'low'
      }]);

      alert(`Success: Counters for ${exactDbId} reset to ₱0.`);
    } catch (err: any) {
      console.error("RESET FAILED:", err);
      alert(`RESET FAILED: ${err?.message ?? String(err)}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetChangeBank = async () => {
    if (!session?.user || !activeUnitId) return;

    const confirmReset = window.confirm(
      `CONFIRM CHANGE BANK RESET for ${activeUnitId}\n\nThis will zero out both P1 and P5 change hoppers. Are you sure?`
    );
    if (!confirmReset) return;

    setIsResetting(true);

    try {
      const { error } = await supabase
        .from("machine_state")
        .update({
          change_p1_count: 0,
          change_p5_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("unit_id", activeUnitId);

      if (error) throw error;

      // Log the reset event
      await supabase.from('system_alerts').insert([{
        unit_id: activeUnitId,
        type: 'Change Bank Reset',
        message: `Change bank hoppers were reset to zero.`,
        severity: 'medium'
      }]);

      alert(`Success: Change bank for ${activeUnitId} reset to 0 PCS.`);
    } catch (err: any) {
      console.error("CHANGE BANK RESET FAILED:", err);
      alert(`RESET FAILED: ${err?.message ?? String(err)}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!session?.user || !activeUnitId) return;

    const confirmClear = window.confirm(
      `Are you sure you want to permanently clear all settlement history for machine ${activeUnitId}?\n\nThis action cannot be undone.`
    );
    if (!confirmClear) return;

    try {
      const { error } = await supabase
        .from('collection_history')
        .delete()
        .eq('unit_id', activeUnitId);

      if (error) throw error;

      // Update local state
      setState(prev => ({ ...prev, history: [] }));
      alert('Settlement history cleared successfully.');
    } catch (err: any) {
      console.error('Clear history error:', err);
      alert(`Failed to clear history: ${err.message}`);
    }
  };

  const handleClearAlerts = async () => {
    if (!session?.user || !activeUnitId) return;

    const confirmClear = window.confirm(
      `Are you sure you want to permanently clear all system alerts for machine ${activeUnitId}?\n\nThis action cannot be undone.`
    );
    if (!confirmClear) return;

    try {
      const { error } = await supabase
        .from('system_alerts')
        .delete()
        .eq('unit_id', activeUnitId);

      if (error) throw error;

      // Update local state
      setAlerts([]);
      alert('System alerts cleared successfully.');
    } catch (err: any) {
      console.error('Clear alerts error:', err);
      alert(`Failed to clear alerts: ${err.message}`);
    }
  };

  const handleExport = useCallback(() => {
    if (state.history.length === 0) {
      alert('No history to export.');
      return;
    }

    const headers = ['Date', 'P1 Collected', 'P5 Collected', 'P10 Collected', 'Total Amount'];
    const rows = state.history.map(h => [
      h.date,
      h.p1,
      h.p5,
      h.p10,
      h.total
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${activeUnitId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state.history, activeUnitId]);

  const renderSection = () => {
    switch (activeSection) {
      case Section.DASHBOARD:
        return <Dashboard state={state} alerts={alerts} activeUnitId={activeUnitId} onReset={fetchAllData} onResetCounter={handleResetCounter} onResetChangeBank={handleResetChangeBank} onClearAlerts={handleClearAlerts} onExport={handleExport} isResetting={isResetting} />;
      case Section.WATER:
        return (
          <div className="space-y-6 sm:space-y-8 animate-in max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Water Status</h1>
            <div className="bg-white p-6 sm:p-12 rounded-[32px] sm:rounded-[48px] border border-slate-100 shadow-2xl flex flex-col items-center">
              <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Monitoring</span>
                  <span className="text-lg sm:text-xl font-bold text-[#0f172a]">Water Level</span>
                </div>
                <div className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${state.waterLevel < 20 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                  {state.waterLevel < 20 ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  {state.waterLevel}% CAPACITY
                </div>
              </div>
              <div className="relative w-48 h-64 sm:w-64 sm:h-80 mb-8 sm:mb-12 group">
                <div className="absolute inset-0 bg-slate-100 rounded-[40px] sm:rounded-[60px] border-[8px] sm:border-[12px] border-white shadow-2xl overflow-hidden flex items-end">
                   <div 
                    className="w-full transition-all duration-[1500ms] ease-in-out relative bg-gradient-to-t from-blue-600 via-blue-400 to-cyan-300"
                    style={{ height: `${state.waterLevel}%` }}
                  >
                    <div className="absolute top-0 left-0 w-full h-8 -mt-4 bg-white/20 blur-md animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                      <span className="block text-4xl sm:text-6xl font-black text-slate-800 drop-shadow-md">{state.waterLevel}%</span>
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-400 mt-2 block">Level Sensor Active</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-lg">
                  <div className="p-6 sm:p-10 bg-slate-50 rounded-[28px] sm:rounded-[40px] border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Supply Level Alert</p>
                        <p className={`text-2xl sm:text-4xl font-black ${state.waterLevel <= 0 ? 'text-red-600' : state.waterLevel < 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {state.waterLevel <= 0 ? 'EMPTY' : state.waterLevel < 20 ? 'LOW LEVEL' : 'OPTIMAL'}
                        </p>
                      </div>
                      <div className={`p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] ${state.waterLevel < 20 ? 'bg-red-100 text-red-600 animate-bounce' : 'bg-emerald-100 text-emerald-600'}`}>
                        {state.waterLevel < 20 ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
                      </div>
                  </div>
              </div>
            </div>
          </div>
        );
      case Section.SALES:
        return <SalesReport state={state} activeUnitId={activeUnitId} onResetCounter={handleResetCounter} isResetting={isResetting} />;
      case Section.HISTORY:
        return (
          <div className="space-y-6 animate-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Settlement History</h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Archive of all collections for {activeUnitId}</p>
              </div>
              <button 
                onClick={handleClearHistory}
                disabled={state.history.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-red-50 disabled:hover:text-red-600"
              >
                <Trash2 size={14} />
                Clear History
              </button>
            </div>

            {/* Mobile View: Cards */}
            <div className="block lg:hidden space-y-4">
              {state.history.length === 0 ? (
                <div className="bg-white rounded-[32px] p-12 text-center text-slate-300 italic font-medium border border-slate-100">
                  No archived collections found.
                </div>
              ) : state.history.map((h) => (
                <div key={h.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Activity size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{h.date.split(',')[0]}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{h.date.split(',')[1]}</span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-emerald-600">₱{h.total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-blue-600">₱1: {h.p1}</span>
                    <span className="text-[10px] font-black text-emerald-600">₱5: {h.p5}</span>
                    <span className="text-[10px] font-black text-violet-600">₱10: {h.p10}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Collection Event</th>
                            <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Coin Breakdown</th>
                            <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Amount Settled</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {state.history.length === 0 ? (
                           <tr><td colSpan={3} className="px-10 py-24 text-center text-slate-300 italic font-medium">No archived collections found for this machine.</td></tr>
                        ) : state.history.map((h) => (
                            <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-10 py-8">
                                  <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-[20px] bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                      <ShieldCheck size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-slate-700">{h.date.split(',')[0]}</span>
                                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{h.date.split(',')[1]}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-10 py-8 text-center">
                                  <div className="inline-flex items-center gap-4 bg-slate-50 px-6 py-2.5 rounded-full border border-slate-100">
                                    <span className="text-xs font-black text-blue-600">₱1:{h.p1}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-xs font-black text-emerald-600">₱5:{h.p5}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-xs font-black text-violet-600">₱10:{h.p10}</span>
                                  </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                  <span className="text-xl font-black text-emerald-600 tracking-tight">₱{h.total.toLocaleString()}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case Section.SETTINGS:
        return (
          <div className="space-y-6 animate-in">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">System Configuration</h1>
            <div className="bg-white p-6 sm:p-12 rounded-[24px] sm:rounded-[48px] border border-slate-100 shadow-xl space-y-6 sm:space-y-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 p-6 sm:p-8 bg-blue-50/50 rounded-[20px] sm:rounded-[36px] border border-blue-100">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl sm:rounded-[24px] flex items-center justify-center text-white shadow-2xl">
                    <Monitor className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">Machine Fleet Management</h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium italic opacity-70">Managing {unitList.length} total vending nodes.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 sm:px-4">Active Fleet List</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {unitList.map(unit => (
                        <div key={unit} className={`p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] border flex items-center justify-between transition-all ${activeUnitId === unit ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white border-slate-100 text-slate-600'}`}>
                           <span className="font-black text-xs sm:text-sm tracking-tight">{unit}</span>
                           <div className="flex items-center gap-2">
                              {activeUnitId !== unit && <button onClick={() => handleDeleteUnit(unit)} className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 text-red-500">Delete</button>}
                              {activeUnitId === unit ? <CheckCircle2 size={18} /> : (
                                <button onClick={() => setActiveUnitId(unit)} className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 underline decoration-2">Select</button>
                              )}
                            </div>
                        </div>
                      ))}
                      <button onClick={() => setShowAddUnit(true)} className="p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] border-2 border-dashed border-slate-200 flex items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest">
                        <Plus size={18} /> Add Machine
                      </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 p-6 sm:p-8 bg-green-50/50 rounded-[20px] sm:rounded-[36px] border border-green-100">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-xl sm:rounded-[24px] flex items-center justify-center text-white shadow-2xl">
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">Real-Time Alerts</h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium italic opacity-70">Enable push notifications to receive alerts on your device.</p>
                    <button 
                      onClick={handleEnableNotifications} 
                      disabled={isSubscribing}
                      className={`mt-4 px-5 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white font-black text-[10px] sm:text-[11px] uppercase tracking-widest rounded-full sm:rounded-[24px] shadow-xl shadow-green-200 flex items-center gap-2 ${isSubscribing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSubscribing ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Enabling...
                        </>
                      ) : (
                        'Enable Notifications'
                      )}
                    </button>
                  </div>
                </div>

            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 selection:bg-blue-100 selection:text-blue-600">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Industrial Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#0f172a] transform transition-transform duration-500 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-12 flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-blue-600/30">
              <Droplets size={32} />
            </div>
            <div>
              <h2 className="font-black text-white text-2xl tracking-tighter">AQUAFLOW</h2>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] leading-none">Management Fleet</p>
            </div>
          </div>
          
          <nav className="flex-1 px-8 space-y-3 mt-12 overflow-y-auto no-scrollbar">
            <div className="px-8 mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Select Machine</p>
            </div>
            {unitList.map((unit) => (
              <button 
                key={unit} 
                onClick={() => { setActiveUnitId(unit); setIsSidebarOpen(false); }} 
                className={`w-full flex items-center gap-5 px-8 py-5 rounded-[28px] transition-all duration-300 ${activeUnitId === unit ? 'bg-blue-600 text-white font-bold shadow-2xl shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span className={activeUnitId === unit ? 'text-white' : 'text-slate-500'}><Monitor size={20} /></span>
                <span className="text-[15px] font-bold tracking-tight">{unit}</span>
                {activeUnitId === unit && <ArrowRight size={14} className="ml-auto opacity-40" />}
              </button>
            ))}
            
            <button 
              onClick={() => { setShowAddUnit(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-5 px-8 py-5 rounded-[28px] border-2 border-dashed border-white/10 text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all duration-300 mt-4"
            >
              <Plus size={20} />
              <span className="text-[15px] font-bold tracking-tight">Add Machine</span>
            </button>
          </nav>

          <div className="p-10 mt-auto">
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                // The onAuthStateChange listener will handle the session update
              }} 
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/10 text-red-500 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
            >
              <LogOut size={16} /> Close Terminal
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 flex flex-col min-h-screen relative pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-3 sm:px-8 lg:px-12 py-3 sm:py-6 lg:py-8 flex items-center justify-between shadow-sm gap-2">
          <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all shrink-0">
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-50 p-1 rounded-full border border-slate-100 overflow-x-auto no-scrollbar shadow-inner min-w-0">
                {unitList.map(unit => (
                   <button 
                    key={unit} 
                    onClick={() => setActiveUnitId(unit)}
                    className={`px-2 sm:px-7 py-1 sm:py-3 rounded-full text-[7px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeUnitId === unit ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                    {unit}
                   </button>
                ))}
                <button 
                  onClick={() => setShowAddUnit(true)} 
                  className="flex-shrink-0 w-6 h-6 sm:w-11 sm:h-11 bg-white text-slate-400 rounded-full flex items-center justify-center hover:text-blue-600 transition-all shadow-sm active:scale-90 border border-slate-100"
                >
                  <Plus size={12} className="sm:hidden" />
                  <Plus size={18} className="hidden sm:block" />
                </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border border-slate-100 shadow-inner shrink-0">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-500 ${dbStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : dbStatus === 'reconnecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
            <span className="text-[7px] sm:text-[9px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">
              {dbStatus === 'connected' ? 'Online' : dbStatus === 'reconnecting' ? 'Syncing' : 'Offline'}
            </span>
          </div>
        </header>

        <div className="p-4 sm:p-8 lg:p-16 flex-1 w-full max-w-[1600px] mx-auto">
          {renderSection()}
        </div>

        {/* Bottom Navigation for Mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {NAV_ITEMS.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveSection(item.id as Section)} 
              className={`flex flex-col items-center gap-1 transition-all ${activeSection === item.id ? 'text-blue-600 scale-110' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-xl ${activeSection === item.id ? 'bg-blue-50' : ''}`}>
                {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20 })}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>

        {/* Modal for Adding Unit */}
        {showAddUnit && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[48px] p-12 shadow-2xl w-full max-w-md border border-slate-100">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Add Monitoring Node</h3>
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 block">Vending Machine ID</label>
                    <input 
                      type="text" 
                      value={newUnitInput}
                      onChange={(e) => setNewUnitInput(e.target.value.toUpperCase())}
                      placeholder="e.g. AQUA-VND-002"
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[28px] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setShowAddUnit(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest rounded-[24px]">Cancel</button>
                    <button onClick={handleAddUnit} className="flex-1 py-5 bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest rounded-[24px] shadow-xl shadow-blue-200">Register Node</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        <footer className="px-16 py-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          <p>© 2025 Aquavend Fleet Services</p>
          <div className="flex gap-8 mt-4 sm:mt-0">
             <span>Protocol v5.2.0</span>
             <span className={dbStatus === 'connected' ? 'text-emerald-500' : 'text-red-500'}>{activeUnitId}: {dbStatus.toUpperCase()}</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;