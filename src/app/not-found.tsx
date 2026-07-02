"use client";

import React from 'react';
import { Wrench } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans text-slate-100 text-center">
      <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20">
        <Wrench className="w-12 h-12 text-blue-500 animate-spin" strokeWidth={1.5} />
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">404</h1>
      <h2 className="text-2xl font-medium text-slate-200 mb-4">Página não encontrada</h2>
      <p className="text-slate-400 max-w-md mb-8">
        Desculpe, não conseguimos encontrar a página que você está procurando. A chave de fenda giratória está tentando consertar o link, mas acho que ele não existe mais.
      </p>
      
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-medium transition-all active:scale-95 shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)]"
      >
        Voltar para o Início
      </Link>
    </main>
  );
}
