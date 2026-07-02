'use client';
import React, { useState } from 'react';
import { ArrowRight, Wrench, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error(authError);
      setError(authError.message || 'Credenciais inválidas.');
      setLoading(false);
      return;
    }

    let role = data.user?.user_metadata?.role;
    
    if (!role && data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (profile) {
        role = profile.role;
      }
    }
    
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/user');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-6 sm:p-8 font-sans selection:bg-blue-500/30">
      
      {/* Top spacing for F-pattern reading and visual balance */}
      <div className="w-full flex-1 flex flex-col justify-center max-w-md mx-auto pt-12 pb-8">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-12 opacity-0 animate-fade-in-up">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20">
            <Wrench className="w-8 h-8 text-blue-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-white mb-2">
            Sistema-OS
          </h1>
          <p className="text-sm text-slate-400 text-center max-w-[260px]">
            Acesse seu painel de gerenciamento de ordens de serviço.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-5 opacity-0 animate-fade-in-up delay-150">
          
          <div className="space-y-4">
            {/* Input: Login */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" strokeWidth={1.5} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all shadow-inner"
              />
            </div>

            {/* Input: Senha */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" strokeWidth={1.5} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-base text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all shadow-inner"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button type="button" className="text-sm text-blue-500 font-medium hover:text-blue-400 transition-colors px-2 py-1">
              Esqueci a senha
            </button>
          </div>
          
          {/* Thumb Zone / Actions */}
          <div className="w-full pt-6">
            <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-4 text-base font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)]">
              {loading ? 'Entrando...' : 'Entrar'}
              <ArrowRight className="w-5 h-5 opacity-80" strokeWidth={2} />
            </button>
          </div>
        </form>

      </div>

      {/* Footer / Version */}
      <div className="w-full max-w-md mx-auto pb-6 opacity-0 animate-fade-in-up delay-300">
        <div className="text-center">
          <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">
            Versão 1.0
          </p>
        </div>
      </div>

    </main>
  );
}
