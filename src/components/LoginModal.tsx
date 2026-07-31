/*
 * ============================================================================
 * GUIA DE CONFIGURAÇÃO - AUTENTICAÇÃO REAL (FIREBASE AUTH / SUPABASE AUTH)
 * ============================================================================
 * Para conectar a autenticação oficial do seu projeto com Firebase Auth ou Supabase Auth:
 * 
 * 1. FIREBASE AUTHENTICATION (Recomendado):
 *    - Instale no projeto: npm install firebase
 *    - Crie o arquivo 'src/lib/firebase.ts' com suas credenciais do Firebase Console:
 *        import { initializeApp } from 'firebase/app';
 *        import { getAuth } from 'firebase/auth';
 *        const firebaseConfig = {
 *          apiKey: "SUA_FIREBASE_API_KEY",
 *          authDomain: "seu-projeto.firebaseapp.com",
 *          projectId: "seu-projeto-id",
 *          storageBucket: "seu-projeto.appspot.com",
 *          messagingSenderId: "1234567890",
 *          appId: "1:1234567890:web:abcdef"
 *        };
 *        const app = initializeApp(firebaseConfig);
 *        export const auth = getAuth(app);
 * 
 * 2. SUPABASE AUTHENTICATION:
 *    - Instale no projeto: npm install @supabase/supabase-js
 *    - Crie o arquivo 'src/lib/supabase.ts':
 *        import { createClient } from '@supabase/supabase-js';
 *        export const supabase = createClient('https://xyz.supabase.co', 'SUA_SUPABASE_ANON_KEY');
 * ============================================================================
 */

import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, Sparkles, CheckCircle2, Crown, KeyRound, AlertCircle, X } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { Subscriber } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscribers: Subscriber[];
  onLoginSuccess: (user: { name: string; email: string; role: 'ADMIN' | 'SUBSCRIBER'; subscriber?: Subscriber }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  subscribers,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    
    // Check if admin email or general admin credentials
    if (cleanEmail === 'gregoriojr2003@gmail.com' || cleanEmail === 'admin@importhourando.com.br' || cleanEmail === 'admin') {
      const adminSub = subscribers.find(s => s.email.toLowerCase() === 'gregoriojr2003@gmail.com') || subscribers[0];
      onLoginSuccess({
        name: adminSub?.name || 'Administrador (Proprietário)',
        email: cleanEmail,
        role: 'ADMIN',
        subscriber: adminSub
      });
      onClose();
      return;
    }

    // Check existing subscribers list
    const matchedSub = subscribers.find(s => s.email.toLowerCase() === cleanEmail);
    if (matchedSub) {
      const isAdmin = matchedSub.email.toLowerCase() === 'gregoriojr2003@gmail.com';
      onLoginSuccess({
        name: matchedSub.name,
        email: matchedSub.email,
        role: isAdmin ? 'ADMIN' : 'SUBSCRIBER',
        subscriber: matchedSub
      });
      onClose();
      return;
    }

    if (cleanEmail.length > 3) {
      // Auto-create/log in as subscriber
      const guestSub: Subscriber = {
        id: `sub-login-${Date.now()}`,
        name: email.split('@')[0] || 'Novo Assinante',
        email: cleanEmail,
        phone: '+55 11 99999-0000',
        plan: 'MENSAL',
        status: 'PENDENTE',
        startedAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        totalPaid: 29.90,
        discountApplied: 0,
        isLifetimeExemptFromMonitoring: false,
        notes: 'Acesso via formulário de login'
      };
      onLoginSuccess({
        name: guestSub.name,
        email: guestSub.email,
        role: 'SUBSCRIBER',
        subscriber: guestSub
      });
      onClose();
      return;
    }

    setError('Informe um e-mail válido para acessar a plataforma.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Decorative Header */}
        <div className="bg-gradient-to-br from-[#2D3277] to-[#1E2255] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#FFE600]/10 rounded-full blur-2xl"></div>
          
          <AppLogo size={56} className="mx-auto mb-3 drop-shadow-md" />
          <h2 className="text-2xl font-black tracking-wider text-white font-mono">IMPORTHOURANDO</h2>
          <p className="text-xs text-white/80 font-medium mt-1">
            Plataforma de Automação & Disparos no WhatsApp
          </p>

          <div className="inline-flex items-center gap-1.5 bg-[#FFE600] text-[#2D3277] font-black text-[10px] px-3 py-1 rounded-full uppercase mt-3 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Alternar Conta / Sessão</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 relative overflow-hidden bg-white">
          {/* Logo background watermark in modal */}
          <div className="absolute -bottom-10 -right-10 pointer-events-none select-none opacity-[0.06] flex items-center justify-center z-0">
            <AppLogo size={240} className="w-56 h-56 text-slate-900" />
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleCustomLogin} className="space-y-4 relative z-10">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Cadastrado:</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D3277] focus:border-[#2D3277] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senha de Acesso:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D3277] focus:border-[#2D3277] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#2D3277] hover:bg-[#1E2255] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Entrar na Conta</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} IMPORTHOURANDO. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
