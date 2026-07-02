"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Search, Plus, Car, Clock, X, CheckCircle2, Edit2, LogOut, Check, Info, Trash2, MessageCircle, DollarSign, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Tipo de Serviço
interface ServiceItem {
  name: string;
  price: number;
}

export default function UserPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Settings / Header State
  const [workshopName, setWorkshopName] = useState("Carregando...");
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(workshopName);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    owner: '',
    phone: '',
    model: '',
    plate: '',
    color: '',
    km: '',
    problem: '',
    status: 'Aguardando análise',
    services: [] as ServiceItem[]
  });

  // Novos Serviços Local State (inputs)
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  // 1. CARREGAR DADOS INICIAIS (Real Supabase Data)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      
      // Buscar perfil para o Header
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setUserProfile(profile);
        setWorkshopName(profile.nome || 'Oficina Mecânica');
      }

      // Buscar Ordens de Serviço (RLS garante que só vem as deste usuário)
      const { data: osData } = await supabase.from('service_orders').select('*').order('created_at', { ascending: false });
      if (osData) {
        setVehicles(osData);
      }
      setIsLoading(false);
      setIsAuthChecking(false);
    }
    loadData();
  }, [supabase, router]);

  const filteredVehicles = vehicles.filter(v => {
    const matchSearch = v.model.toLowerCase().includes(search.toLowerCase()) || v.plate.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'ativas' ? v.status !== 'Finalizado' : v.status === 'Finalizado';
    return matchSearch && matchTab;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (e.target.name !== 'status') {
      value = value.toUpperCase();
    }
    setFormData({ ...formData, [e.target.name]: value });
    setHasUnsavedChanges(true);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ 
      owner: '', phone: '', model: '', plate: '', color: '', km: '', problem: '', 
      status: 'Aguardando análise', services: [] 
    });
    setNewServiceName('');
    setNewServicePrice('');
    setIsConfirmingSave(false);
    setIsConfirmingDelete(false);
    setIsConfirmingClose(false);
    setHasUnsavedChanges(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: any) => {
    setEditingId(vehicle.id);
    setFormData({
      owner: (vehicle.owner || '').toUpperCase(),
      phone: vehicle.phone || '',
      model: (vehicle.model || '').toUpperCase(),
      plate: (vehicle.plate || '').toUpperCase(),
      color: (vehicle.color || '').toUpperCase(),
      km: vehicle.km || '',
      problem: (vehicle.problem || '').toUpperCase(),
      status: vehicle.status || 'Aguardando análise',
      services: vehicle.services ? vehicle.services.map((s: any) => ({ ...s, name: s.name.toUpperCase() })) : []
    });
    setNewServiceName('');
    setNewServicePrice('');
    setIsConfirmingSave(false);
    setIsConfirmingDelete(false);
    setIsConfirmingClose(false);
    setHasUnsavedChanges(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (hasUnsavedChanges) {
      setIsConfirmingClose(true);
    } else {
      setIsModalOpen(false);
      setIsConfirmingClose(false);
    }
  };

  const handleAddService = () => {
    if (newServiceName.trim() && newServicePrice.trim()) {
      const priceVal = parseFloat(newServicePrice.replace(',', '.'));
      if (!isNaN(priceVal)) {
        setFormData({
          ...formData,
          services: [...formData.services, { name: newServiceName.trim(), price: priceVal }]
        });
        setNewServiceName('');
        setNewServicePrice('');
        setHasUnsavedChanges(true);
      }
    }
  };

  const handleRemoveService = (index: number) => {
    const updated = [...formData.services];
    updated.splice(index, 1);
    setFormData({ ...formData, services: updated });
    setHasUnsavedChanges(true);
  };

  const totalGasto = formData.services.reduce((acc: number, curr: ServiceItem) => acc + Number(curr.price || 0), 0);

  const handleSave = async () => {
    if (!isConfirmingSave) {
      setIsConfirmingSave(true);
      return;
    }

    if (editingId) {
      // 2. ATUALIZAR (Update Real)
      const { data, error } = await supabase.from('service_orders').update({
        ...formData
      }).eq('id', editingId).select().single();
      
      if (data) {
        setVehicles(vehicles.map(v => v.id === editingId ? data : v));
      }
    } else {
      // 3. INSERIR (Insert Real)
      const newOS = {
        usuario_id: userProfile?.id,
        ...formData
      };
      const { data, error } = await supabase.from('service_orders').insert([newOS]).select().single();
      
      if (data) {
        setVehicles([data, ...vehicles]);
      }
    }

    setIsModalOpen(false);
    setIsConfirmingSave(false);
  };

  const handleDelete = async () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    
    // 4. DELETAR (Delete Real)
    if (editingId) {
      await supabase.from('service_orders').delete().eq('id', editingId);
      setVehicles(vehicles.filter(v => v.id !== editingId));
    }
    
    setIsModalOpen(false);
    setIsConfirmingDelete(false);
  };

  const handleWhatsApp = () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone) return;
    
    let servicesText = formData.services.map(s => `${s.name.toUpperCase()} - R$ ${s.price.toFixed(2)}`).join('\n');
    if (servicesText) {
      servicesText = `\n\nSERVIÇOS / PEÇAS:\n${servicesText}`;
    }

    const text = `OLÁ ${formData.owner.toUpperCase()}, AQUI ESTÃO OS DETALHES DA SUA O.S. PARA O VEÍCULO ${formData.model.toUpperCase()} (PLACA: ${formData.plate.toUpperCase()}).\n\nSTATUS ATUAL: *${formData.status.toUpperCase()}*${servicesText}\n\nVALOR TOTAL: *R$ ${totalGasto.toFixed(2)}*\n\nQUALQUER DÚVIDA ESTAMOS À DISPOSIÇÃO!`;
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

  const saveWorkshopName = async () => {
    if (tempName.trim() !== '') {
      setWorkshopName(tempName);
      if (userProfile) {
        await supabase.from('profiles').update({ nome: tempName }).eq('id', userProfile.id);
      }
    }
    setIsEditingName(false);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Wrench className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 relative">
      
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsSettingsMenuOpen(!isSettingsMenuOpen);
              setIsConfirmingLogout(false);
              setIsEditingName(false);
            }}
            className={`p-2 rounded-full transition-colors active:scale-95 ${isSettingsMenuOpen ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <Settings size={24} />
          </button>
          <span className="text-xl font-medium tracking-tight truncate max-w-[150px] sm:max-w-xs">{workshopName}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20 shrink-0">
          MJ
        </div>

        {/* Dropdown de Configurações */}
        {isSettingsMenuOpen && (
          <div className="absolute top-24 left-6 w-72 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-40 p-5 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Configurações</p>
              {!isEditingName ? (
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-sm font-medium text-slate-200 truncate pr-2">{workshopName}</span>
                  <button onClick={() => { setIsEditingName(true); setTempName(workshopName); }} className="text-blue-400 p-1 hover:bg-slate-800 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    autoFocus
                    className="flex-1 h-10 px-3 bg-slate-950 border border-blue-500/50 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button onClick={saveWorkshopName} className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95">
                    <Check size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="h-px bg-slate-800 w-full"></div>

            <div>
              {!isConfirmingLogout ? (
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-3 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-colors active:scale-95 border border-transparent hover:border-rose-500/20"
                >
                  <span className="font-medium text-sm">Sair do sistema</span>
                  <LogOut size={18} />
                </button>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl flex flex-col gap-3">
                  <p className="text-rose-400 text-xs font-medium text-center">Deseja realmente sair?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setIsConfirmingLogout(false)} className="flex-1 h-8 bg-slate-950 text-slate-300 text-xs rounded-xl hover:bg-slate-800">
                      Cancelar
                    </button>
                    <button onClick={handleLogout} className="flex-1 h-8 bg-rose-600 text-white text-xs font-medium rounded-xl shadow-lg shadow-rose-600/20">
                      Sim, sair
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 opacity-50 mt-1">
              <Info size={12} className="text-slate-500" />
              <span className="text-[10px] font-mono text-slate-500">Versão 1.0</span>
            </div>
          </div>
        )}
      </header>

      {/* Clique fora para fechar o menu */}
      {isSettingsMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setIsSettingsMenuOpen(false)}></div>
      )}

      {/* Indicador Principal */}
      <section className="px-6 mb-8">
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full"></div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Veículos na oficina</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{vehicles.length}</span>
              <span className="text-blue-400 text-sm font-medium">em operação</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
            <Car size={28} className="text-blue-400" />
          </div>
        </div>
      </section>

      {/* Ações: Busca e Adicionar OS */}
      <section className="px-6 mb-8 flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          />
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="h-14 px-5 bg-blue-600 text-white rounded-2xl font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all shrink-0"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Adicionar OS</span>
          <span className="sm:hidden">OS</span>
        </button>
      </section>

      {/* Lista de Veículos */}
      <section className="px-6">
        <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-2">
          <button 
            onClick={() => setActiveTab('ativas')}
            className={`text-lg font-medium transition-colors ${activeTab === 'ativas' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            O.S. Ativas
          </button>
          <button 
            onClick={() => setActiveTab('historico')}
            className={`text-lg font-medium transition-colors ${activeTab === 'historico' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Histórico
          </button>
          <span className="ml-auto text-sm text-slate-500 bg-slate-900 px-3 py-1 rounded-full">
            {filteredVehicles.length} result.
          </span>
        </div>
        
        <div className="flex flex-col gap-4">
          {filteredVehicles.map((vehicle: any) => {
            const vehicleTotal = vehicle.services?.reduce((acc: number, curr: any) => acc + Number(curr.price || 0), 0) || 0;
            return (
              <div 
                key={vehicle.id} 
                onClick={() => handleOpenEditModal(vehicle)}
                role="button"
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden active:bg-slate-800/80 active:scale-[0.98] transition-all cursor-pointer group"
              >
                {vehicle.status === 'Em conserto' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-3xl shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
                )}
                {vehicle.status === 'Finalizado' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-3xl shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      {vehicle.model}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{vehicle.owner}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
                      <span className="font-mono text-sm text-slate-300 tracking-wider">{vehicle.plate}</span>
                    </div>
                    {vehicleTotal > 0 && (
                      <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-1 rounded-md">
                        R$ {vehicleTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full 
                      ${vehicle.status === 'Em conserto' ? 'bg-blue-500 animate-pulse' 
                        : vehicle.status === 'Finalizado' ? 'bg-emerald-500' 
                        : 'bg-amber-500'}`}
                    ></div>
                    <span className="text-sm font-medium text-slate-300">{vehicle.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <Clock size={14} />
                    <span>{vehicle.time}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredVehicles.length === 0 && (
            <div className="text-center py-12 px-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl border-dashed">
              <Car size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-400">Nenhum veículo encontrado.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modal / Bottom Sheet para Editar/Nova OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-6 transition-opacity">
          <div className="w-full max-w-md bg-slate-950 border-t border-slate-800 sm:border sm:rounded-3xl rounded-t-3xl h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300 relative overflow-hidden">
            
            {/* Overlay Confirmar Saída */}
            {isConfirmingClose && (
              <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 text-center max-w-sm w-full shadow-2xl">
                  <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <X size={28} className="text-rose-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Descartar alterações?</h3>
                  <p className="text-sm text-slate-400">
                    Você tem alterações não salvas. Se sair agora, tudo será perdido.
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button 
                      onClick={() => setIsConfirmingClose(false)}
                      className="flex-1 h-12 bg-slate-800 text-white rounded-2xl font-medium active:scale-95 transition-all"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={() => { setIsModalOpen(false); setIsConfirmingClose(false); setHasUnsavedChanges(false); }}
                      className="flex-1 h-12 bg-rose-600 text-white rounded-2xl font-medium shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50 shrink-0">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                {editingId ? 'Editar O.S.' : 'Nova Entrada'}
              </h3>
              <div className="flex items-center gap-2">
                {editingId && formData.phone && (
                  <button 
                    onClick={handleWhatsApp}
                    className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full hover:bg-emerald-500/20 transition-colors active:scale-95"
                  >
                    <MessageCircle size={20} />
                  </button>
                )}
                <button 
                  onClick={handleCloseModal}
                  className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              
              {/* Seletor de Status */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Status do Serviço</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full h-14 px-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                >
                  <option value="Aguardando análise">Aguardando análise</option>
                  <option value="Em conserto">Em conserto</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>

              {/* Dados do Cliente */}
              <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  Dados do Cliente
                </h4>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Proprietário</label>
                  <input 
                    type="text" name="owner" value={formData.owner} onChange={handleInputChange}
                    placeholder="Ex: João da Silva"
                    className="w-full h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Telefone / WhatsApp</label>
                  <input 
                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    className="w-full h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {/* Dados do Veículo */}
              <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-slate-300">Veículo</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Modelo</label>
                    <input 
                      type="text" name="model" value={formData.model} onChange={handleInputChange}
                      placeholder="Ex: Gol G5"
                      className="w-full h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Placa</label>
                    <input 
                      type="text" name="plate" value={formData.plate} onChange={handleInputChange}
                      placeholder="ABC-1234"
                      className="w-full h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cor</label>
                    <input 
                      type="text" name="color" value={formData.color} onChange={handleInputChange}
                      placeholder="Ex: Prata"
                      className="w-full h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">KM Atual</label>
                    <input 
                      type="number" name="km" value={formData.km} onChange={handleInputChange}
                      placeholder="Ex: 85000"
                      className="w-full h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Problema Relatado</label>
                  <textarea 
                    name="problem" value={formData.problem} onChange={handleInputChange}
                    placeholder="Descreva o motivo da visita..."
                    rows={2}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Serviços e Valores */}
              <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-300">Serviços e Valores</h4>
                  <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded-md">
                    Total: R$ {totalGasto.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex flex-col gap-2">
                  {formData.services.map((svc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-200">{svc.name}</span>
                        <span className="text-xs font-mono text-emerald-400">R$ {svc.price.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveService(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.services.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-2">Nenhum serviço lançado.</p>
                  )}
                </div>

                <div className="flex gap-2 items-end pt-2 border-t border-slate-800/50 mt-2">
                  <div className="flex-1">
                    <input 
                      type="text" placeholder="Novo Serviço" 
                      value={newServiceName} onChange={e => setNewServiceName(e.target.value.toUpperCase())}
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="w-24">
                    <input 
                      type="number" placeholder="Valor" 
                      value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <button 
                    onClick={handleAddService}
                    className="h-10 px-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Opção de Excluir Registro (Somente Edição) */}
              {editingId && (
                <div className="mt-2 mb-4">
                  {!isConfirmingDelete ? (
                    <button 
                      onClick={handleDelete}
                      className="w-full flex items-center justify-center gap-2 h-12 text-rose-500 font-medium rounded-2xl hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 active:scale-95"
                    >
                      <Trash2 size={18} />
                      <span className="text-sm">Excluir este Registro</span>
                    </button>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95">
                      <p className="text-rose-400 text-sm font-medium text-center">Apagar permanentemente esta O.S.?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setIsConfirmingDelete(false)} className="flex-1 h-10 bg-slate-950 text-slate-300 text-sm rounded-xl hover:bg-slate-900 border border-slate-800 active:scale-95">
                          Cancelar
                        </button>
                        <button onClick={handleDelete} className="flex-1 h-10 bg-rose-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-rose-600/20 active:scale-95">
                          Sim, Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="p-6 border-t border-slate-800/50 shrink-0 bg-slate-950/80 backdrop-blur-md">
              {!isConfirmingSave ? (
                <button 
                  onClick={handleSave}
                  className="w-full h-14 bg-blue-600 text-white rounded-2xl font-medium shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {editingId ? <Edit2 size={20} /> : <CheckCircle2 size={20} />}
                  {editingId ? 'Atualizar OS' : 'Salvar Entrada'}
                </button>
              ) : (
                <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-center text-sm text-slate-300 font-medium">
                    {editingId ? 'Confirmar a atualização?' : 'Deseja realmente salvar esta entrada?'}
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsConfirmingSave(false)}
                      className="flex-1 h-14 bg-slate-900 border border-slate-800 text-white rounded-2xl font-medium active:scale-95 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSave}
                      className="flex-1 h-14 bg-emerald-600 text-white rounded-2xl font-medium shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={20} />
                      Sim, {editingId ? 'Atualizar' : 'Salvar'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
