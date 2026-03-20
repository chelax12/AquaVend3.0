import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Zap, Mail, KeyRound, Loader2, ShieldCheck, Phone } from 'lucide-react';

interface SignUpProps {
  onShowLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onShowLogin }) => {
  const [signUpMethod, setSignUpMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Check if activation code is valid and not used
      const cleanActivationCode = activationCode.trim();
      const { data: codeData, error: codeError } = await supabase
        .from('activation_codes')
        .select('unit_id, code') // Also select the code to get the correct casing
        .ilike('code', cleanActivationCode) // Case-insensitive search
        .eq('is_used', false)
        .maybeSingle();

      if (codeError) throw codeError;
      if (!codeData) {
        throw new Error('Invalid or already used activation code.');
      }

      // 2. Sign up the user
      const signUpData = signUpMethod === 'email' ? { email: email, password: password } : { phone: phone, password: password };
      const { data: { user }, error: signUpError } = await supabase.auth.signUp(signUpData);

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Sign up failed. Please try again.');

      // 3. Link device to user and mark code as used
      const { error: deviceError } = await supabase
        .from('devices')
        .insert({ 
          unit_id: codeData.unit_id, 
          owner_id: user.id, 
          activation_code_used: codeData.code 
        });

      if (deviceError) throw deviceError;

      const { error: updateCodeError } = await supabase
        .from('activation_codes')
        .update({ is_used: true })
        .eq('code', codeData.code);

      if (updateCodeError) throw updateCodeError;

      alert('Sign up successful! Please check your email to verify your account.');
      onShowLogin();

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-10 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Create Owner Account</h1>
        <p className="text-sm text-slate-500 mt-1">Register your hardware to begin</p>
      </div>

      <div className="flex justify-center bg-slate-100 p-1.5 rounded-full mb-8">
        <button onClick={() => setSignUpMethod('email')} className={`flex-1 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${signUpMethod === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Email</button>
        <button onClick={() => setSignUpMethod('phone')} className={`flex-1 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${signUpMethod === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Phone</button>
      </div>

      <form onSubmit={handleSignUp} className="space-y-5">
        <div className="relative">
          <ShieldCheck className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value)}
            className="w-full p-4 pl-14 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
            placeholder="Hardware Activation Code"
          />
        </div>
        {signUpMethod === 'email' ? (
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
            placeholder="Create Password"
          />
        </div>
        <div className="relative">
          <KeyRound className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-4 pl-14 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700"
            placeholder="Confirm Password"
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-3 p-4 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-colors disabled:bg-blue-300 shadow-lg shadow-blue-600/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Register & Create Account'}
        </button>
      </form>

      {error && <p className="mt-6 text-center text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have a fleet account?{' '}
        <button onClick={onShowLogin} className="font-bold text-blue-600 hover:underline">Login</button>
      </p>
    </div>
  );
};