import React, { useState } from 'react';
import { Login } from './Login';
import { SignUp } from './SignUp';
import { Droplets } from 'lucide-react';

export const Auth: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 selection:bg-blue-100 selection:text-blue-600">


      <div className="w-full max-w-sm">
        {showLogin ? (
          <Login onShowSignUp={() => setShowLogin(false)} />
        ) : (
          <SignUp onShowLogin={() => setShowLogin(true)} />
        )}
      </div>

      <footer className="absolute bottom-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
        © 2025 Aquaflow Fleet Services
      </footer>
    </div>
  );
};