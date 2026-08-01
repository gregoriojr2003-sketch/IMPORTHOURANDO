import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, Sparkles, CheckCircle2, Crown, KeyRound, AlertCircle, X } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { Subscriber } from '../types';
import { signInWithGoogle } from '../lib/supabase';

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
          <div className="space-y-4 relative z-10">
            {/* Supabase Google Login Button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (e) {
                  setError('Erro ao iniciar login com Google via Supabase Auth.');
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white text-slate-800 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Entrar com Google (Supabase Auth)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Ou acesse com e-mail e senha
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-4">
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
          </div>

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
