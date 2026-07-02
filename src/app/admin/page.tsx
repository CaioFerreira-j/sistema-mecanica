"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Search, Clock, LogOut, Wrench, Users, MessageCircle, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface MechanicProfile {
  id: string;
  nome: string;
  email: string;
  role: string;
  carsInRepair?: number;
  carsFinalized?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [mechanics, setMechanics] = useState<MechanicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [totalCarsInRepair, setTotalCarsInRepair] = useState(0);
  const [totalCarsFinalized, setTotalCarsFinalized] = useState(0);


  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'user'),
        supabase.from('service_orders').select('usuario_id, status')
      ]);
      
      let globalInRepair = 0;
      let globalFinalized = 0;

      if (profilesRes.data) {
        const mechanicsWithStats = profilesRes.data.map((profile: any) => {
          const userOrders = ordersRes.data?.filter(o => o.usuario_id === profile.id) || [];
          const inRepair = userOrders.filter(o => o.status !== 'Finalizado').length;
          const finalized = userOrders.filter(o => o.status === 'Finalizado').length;
          
          globalInRepair += inRepair;
          globalFinalized += finalized;

          return { ...profile, carsInRepair: inRepair, carsFinalized: finalized };
        });
        setMechanics(mechanicsWithStats);
      }
      
      setTotalCarsInRepair(globalInRepair);
      setTotalCarsFinalized(globalFinalized);
      setIsLoading(false);
    }
    fetchData();
  }, [supabase]);

  const activeMechanicsCount = mechanics.length;

  const filteredMechanics = mechanics.filter(m => 
    m.nome?.toLowerCase().includes(search.toLowerCase()) || 
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleWhatsApp = (phone: string, owner: string) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone) return;
    
    const text = `Olá ${owner}, tudo bem? Aqui é do suporte do Sistema OS.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleLogout = async () => {
    if (!isConfirmingLogout) {
      setIsConfirmingLogout(true);
      return;
    }
    await supabase.auth.signOut();
    router.push('/');
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 relative">
      
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 active:scale-95 transition-transform"
          >
            <Settings size={20} className="text-white" />
          </button>
          <span className="text-xl font-medium tracking-tight">Painel Master</span>
        </div>

        {/* Dropdown de Configurações */}
        {isSettingsMenuOpen && (
          <div className="absolute top-20 left-6 w-64 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-40 p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Administrador</p>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-sm font-medium text-slate-200">Admin</span>
              </div>
            </div>

            <div className="h-px bg-slate-800 w-full"></div>

            <div className="flex items-center justify-center gap-1.5 opacity-50">
              <Activity size={12} className="text-slate-500" />
              <span className="text-[10px] font-mono text-slate-500">Versão 1.0.0</span>
            </div>
          </div>
        )}

        {isSettingsMenuOpen && (
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setIsSettingsMenuOpen(false)}></div>
        )}
        
        {isConfirmingLogout ? (
          <div className="flex gap-2 animate-in fade-in zoom-in-95">
            <button onClick={() => setIsConfirmingLogout(false)} className="px-3 h-10 bg-slate-900 text-slate-300 text-sm rounded-xl hover:bg-slate-800 border border-slate-800">
              Cancelar
            </button>
            <button onClick={handleLogout} className="px-3 h-10 bg-rose-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-rose-600/20">
              Sair
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsConfirmingLogout(true)}
            className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors active:scale-95"
          >
            <LogOut size={20} />
          </button>
        )}
      </header>

      {/* Dashboards Indicators */}
      <section className="px-6 mb-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Mecânicas Ativas */}
        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Activity size={24} className="text-indigo-400" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-bold text-white block">{activeMechanicsCount}</span>
            <p className="text-indigo-400 text-sm font-medium mt-1">Mecânicas Ativas</p>
          </div>
        </div>

        {/* Carros em Conserto */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/20 blur-2xl rounded-full"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Wrench size={24} className="text-amber-400" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-bold text-white block">{totalCarsInRepair}</span>
            <p className="text-amber-400 text-sm font-medium mt-1">Carros em Conserto</p>
          </div>
        </div>

        {/* Carros Finalizados */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-bold text-white block">{totalCarsFinalized}</span>
            <p className="text-emerald-400 text-sm font-medium mt-1">Carros Finalizados</p>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="px-6 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
          />
        </div>
      </section>

      {/* Users/Mechanics List */}
      <section className="px-6">
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Users size={20} className="text-slate-400" />
          Mecânicos Cadastrados
          <span className="ml-auto text-sm font-normal text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {filteredMechanics.length}
          </span>
        </h2>
        
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center py-12 px-6">
              <p className="text-slate-400">Carregando usuários...</p>
            </div>
          ) : (
            filteredMechanics.map((mechanic) => (
              <div 
                key={mechanic.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-3xl shadow-[0_0_12px_rgba(0,0,0,0.8)] bg-indigo-500 shadow-indigo-500/80`}></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {mechanic.nome || 'Usuário sem nome'}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{mechanic.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                      <Wrench size={14} className="text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">{mechanic.carsInRepair} ativos</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">{mechanic.carsFinalized} finaliz.</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-indigo-500 animate-pulse`}></div>
                    <span className="text-sm font-medium text-slate-300">Ativo na Plataforma</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {!isLoading && filteredMechanics.length === 0 && (
            <div className="text-center py-12 px-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl border-dashed">
              <AlertCircle size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-400">Nenhum mecânico cadastrado encontrado na base.</p>
            </div>
          )}
        </div>
      </section>


    </div>
  );
}
