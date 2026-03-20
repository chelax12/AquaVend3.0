import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Zap, Mail, KeyRound, Loader2, Phone } from 'lucide-react';

interface LoginProps {
  onShowSignUp: () => void;
}

export const Login: React.FC<LoginProps> = ({ onShowSignUp }) => {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Clear any stale session before attempting login
      await supabase.auth.signOut();
      
      if (loginMethod === 'email') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          phone: phone,
          password: password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-white p-8 sm:p-12 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in w-full max-w-md">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30 mb-4">
          <Zap size={32} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">AQUAVEND</h1>
        <h2 className="text-xl font-bold text-slate-600 tracking-tight">Owner Login</h2>
        <p className="text-sm text-slate-500 mt-1">Access your fleet dashboard</p>
      </div>

      <div className="flex justify-center bg-slate-100 p-1.5 rounded-full mb-8">
        <button onClick={() => setLoginMethod('email')} className={`flex-1 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${loginMethod === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Email</button>
        <button onClick={() => setLoginMethod('phone')} className={`flex-1 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${loginMethod === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Phone</button>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {loginMethod === 'email' ? (
          <div className="relative">
            <Mail className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 pl-14 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
              placeholder="you@example.com"
            />
          </div>
        ) : (
          <div className="relative">
            <Phone className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-4 pl-14 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
              placeholder="+63 912 345 6789"
            />
          </div>
        )}
        <div className="relative">
          <KeyRound className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 pl-14 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
            placeholder="••••••••"
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-3 p-4 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-colors disabled:bg-blue-300 shadow-lg shadow-blue-600/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Secure Login'}
        </button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-grow h-px bg-slate-200"></div>
        <span className="mx-4 text-xs font-bold text-slate-400">OR</span>
        <div className="flex-grow h-px bg-slate-200"></div>
      </div>

      <button 
        onClick={handleGoogleLogin}
        className="w-full p-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-3"
      >
        <img src="/google.svg" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>

      {error && <p className="mt-6 text-center text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

      <p className="mt-8 text-center text-sm text-slate-500">
        Need a fleet account?{' '}
        <button onClick={onShowSignUp} className="font-bold text-blue-600 hover:underline">Register Hardware</button>
      </p>
    </div>
  );
};