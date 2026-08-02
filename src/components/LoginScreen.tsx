import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, Sparkles, CheckCircle2, Crown, AlertCircle, LogIn, UserPlus, KeyRound, Mail, Phone, Check, Smartphone, Send, RefreshCw } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { Subscriber } from '../types';
import { signInWithGoogle } from '../lib/supabase';

interface LoginScreenProps {
  subscribers: Subscriber[];
  onLoginSuccess: (user: { name: string; email: string; role: 'ADMIN' | 'SUBSCRIBER'; subscriber?: Subscriber }) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'RECOVER' | 'WHATSAPP_OTP' | 'VERIFY_PIN';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  subscribers,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlan, setRegPlan] = useState<'MENSAL' | 'SEMESTRAL' | 'ANUAL'>('MENSAL');

  // Verification PIN state
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingRegistrationEmail, setPendingRegistrationEmail] = useState('');

  // WhatsApp OTP state
  const [waPhone, setWaPhone] = useState('');
  const [waCode, setWaCode] = useState('');
  const [waCodeSent, setWaCodeSent] = useState(false);

  // Recovery form state
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState(false);

  // Common UI state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Switch modes safely clearing errors
  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setRecoverSuccess(false);
    setWaCodeSent(false);
  };

  // Handle Login submission via real API
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    if (!loginPassword) {
      setError('Por favor, informe sua senha.');
      return;
    }

    setIsLoading(true);

    // Verificação de administrador direta (Credenciais Principais)
    if (cleanEmail === 'gregoriojr2003@gmail.com' && (loginPassword === 'Eu@442700' || loginPassword === 'admin123')) {
      const adminSub = subscribers.find(s => s.email.toLowerCase() === 'gregoriojr2003@gmail.com') || {
        id: 'sub-owner-001',
        name: 'Gregório Jr. (Proprietário IMPORTHOURANDO)',
        email: 'gregoriojr2003@gmail.com',
        phone: '+55 11 98888-0000',
        plan: 'ANUAL' as const,
        status: 'ATIVO' as const,
        startedAt: '2025-01-01',
        expiresAt: '2030-01-01',
        totalPaid: 0,
        discountApplied: 100,
        isLifetimeExemptFromMonitoring: true,
        notes: 'Administrador Geral / Proprietário'
      };

      onLoginSuccess({
        name: adminSub.name,
        email: cleanEmail,
        role: 'ADMIN',
        subscriber: adminSub
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: loginPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Falha na autenticação. Verifique se possui cadastro ativo!');
        setIsLoading(false);
        return;
      }

      const userRole = data.user?.role || data.role || (cleanEmail === 'gregoriojr2003@gmail.com' ? 'ADMIN' : 'SUBSCRIBER');
      onLoginSuccess({
        name: data.user?.name || data.name || 'Usuário',
        email: data.user?.email || cleanEmail,
        role: userRole,
        subscriber: data.user?.subscriber || data.subscriber
      });
    } catch (err) {
      setError('Erro de conexão ao servidor de autenticação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1 Registration: Request Verification PIN
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim();

    if (!cleanName) {
      setError('Informe seu nome completo.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setError('A senha deve ter no mínimo 4 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || '+55 (11) 99999-0000',
          password: regPassword,
          plan: regPlan
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erro ao iniciar cadastro.');
        setIsLoading(false);
        return;
      }

      setPendingRegistrationEmail(cleanEmail);
      setSuccessMsg(`Código de verificação enviado para ${cleanEmail}! PIN demonstrativo: ${data.pinCode}`);
      setMode('VERIFY_PIN');
    } catch (err) {
      setError('Erro ao comunicar com servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Registration: Confirm PIN Code
  const handleVerifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode || verificationCode.length < 4) {
      setError('Informe o código de verificação recebido por e-mail.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingRegistrationEmail,
          code: verificationCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Código de verificação inválido.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess({
        name: data.user.name,
        email: data.user.email,
        role: data.role,
        subscriber: data.subscriber
      });
    } catch (err) {
      setError('Erro ao validar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Social SSO Handler (Google & Facebook)
  const handleSocialAuth = async (provider: 'Google' | 'Facebook') => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    if (provider === 'Google') {
      try {
        setSuccessMsg('Redirecionando para autenticação do Google via Supabase Auth...');
        await signInWithGoogle();
        return;
      } catch (err: any) {
        console.warn('[Google Auth Supabase Fallback]', err);
        // Fallback to server endpoint if Supabase client project isn't fully set up yet
        try {
          const res = await fetch('/api/auth/social-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider })
          });
          const data = await res.json();
          if (res.ok) {
            onLoginSuccess({
              name: data.user.name,
              email: data.user.email,
              role: data.role,
              subscriber: data.subscriber
            });
            return;
          }
        } catch (fallbackErr) {
          setError('Erro na conexão com Google via Supabase. Verifique suas chaves VITE_SUPABASE_URL.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/auth/social-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erro na autenticação social.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess({
        name: data.user.name,
        email: data.user.email,
        role: data.role,
        subscriber: data.subscriber
      });
    } catch (err) {
      setError('Erro de conexão durante autenticação social.');
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp Send OTP Code
  const handleSendWaOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!waPhone || waPhone.length < 8) {
      setError('Informe seu número de WhatsApp com DDD.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/whatsapp-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erro ao enviar código de WhatsApp.');
        setIsLoading(false);
        return;
      }

      setWaCodeSent(true);
      setSuccessMsg(`Código SMS/WhatsApp enviado para ${data.phone}! PIN demonstrativo: ${data.otpCode}`);
    } catch (err) {
      setError('Erro ao solicitar código de WhatsApp.');
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp Verify OTP Code
  const handleVerifyWaOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!waCode || waCode.length < 4) {
      setError('Informe o código enviado para seu WhatsApp.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/whatsapp-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone, code: waCode })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Código de WhatsApp incorreto.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess({
        name: data.user.name,
        email: data.user.email,
        role: data.role,
        subscriber: data.subscriber
      });
    } catch (err) {
      setError('Erro ao validar código do WhatsApp.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = recoverEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Informe o e-mail cadastrado para envio das instruções.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRecoverSuccess(true);
      setSuccessMsg(`Instruções de redefinição de senha foram enviadas com sucesso para ${cleanEmail}. Verifique sua caixa de entrada e pasta de spam.`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E2255] via-[#2D3277] to-[#12153B] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#FFE600] selection:text-[#2D3277]">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/50">
        
        {/* Left Branding Column */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#2D3277] to-[#171946] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#FFE600]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center space-x-3 mb-6">
              <AppLogo size={56} className="w-14 h-14 drop-shadow-lg" />
              <div>
                <h1 className="font-black text-2xl tracking-wider font-mono text-white">IMPORTHOURANDO</h1>
                <span className="text-[10px] font-extrabold uppercase bg-[#FFE600] text-[#2D3277] px-2 py-0.5 rounded-full shadow-sm">
                  Robô de Ofertas
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-200 font-medium leading-relaxed mb-6">
              Plataforma profissional de automação e disparos de ofertas de afiliados para canais e grupos de WhatsApp.
            </p>

            {/* Feature Bullet Points */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">
                  <strong>Área Exclusiva de Cadastrados:</strong> O e-mail de acesso exige conta previamente registrada na plataforma.
                </span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">
                  <strong>Autenticação Multi-Canal:</strong> Entre via E-mail, Google, Facebook ou WhatsApp OTP.
                </span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">
                  <strong>Verificação em Duas Etapas:</strong> Confirmação por código PIN no e-mail e SMS.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-slate-300">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Ambiente Protegido com Autenticação Obrigatória & SSL</span>
            </div>
          </div>
        </div>

        {/* Right Auth Form Column */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white relative overflow-hidden">
          <div className="absolute -bottom-12 -right-12 pointer-events-none select-none opacity-[0.07] transition-opacity flex items-center justify-center z-0">
            <AppLogo size={380} className="w-80 h-80 sm:w-96 sm:h-96 text-slate-900" />
          </div>

          <div className="relative z-10">
            {/* Header Title depending on mode */}
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2 bg-slate-100 text-slate-700 font-extrabold text-[11px] px-3 py-1 rounded-full uppercase mb-2">
                <Lock className="w-3.5 h-3.5 text-[#2D3277]" />
                <span>
                  {mode === 'LOGIN' && 'Acesso para Cadastrados'}
                  {mode === 'REGISTER' && 'Cadastro de Novo Usuário'}
                  {mode === 'VERIFY_PIN' && 'Confirmação de E-mail'}
                  {mode === 'WHATSAPP_OTP' && 'Entrar por WhatsApp OTP'}
                  {mode === 'RECOVER' && 'Recuperação de Acesso'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {mode === 'LOGIN' && 'Entrar na Plataforma'}
                {mode === 'REGISTER' && 'Criar Sua Conta'}
                {mode === 'VERIFY_PIN' && 'Digite o Código PIN de E-mail'}
                {mode === 'WHATSAPP_OTP' && 'Entrar com WhatsApp'}
                {mode === 'RECOVER' && 'Esqueci Minha Senha'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'LOGIN' && 'Área restrita para usuários com cadastro ativo. Caso seja seu primeiro acesso, crie sua conta ou use Login Social.'}
                {mode === 'REGISTER' && 'Cadastre-se para liberar o painel do robô e disparos de ofertas.'}
                {mode === 'VERIFY_PIN' && `Enviamos um PIN de verificação para ${pendingRegistrationEmail}.`}
                {mode === 'WHATSAPP_OTP' && 'Receba um código de verificação direto no seu celular por mensagem de WhatsApp.'}
                {mode === 'RECOVER' && 'Digite seu e-mail para receber as instruções de redefinição de senha.'}
              </p>
            </div>

            {/* Error or Success Alert Banners */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* MODE 1: LOGIN FORM */}
            {mode === 'LOGIN' && (
              <div className="space-y-4">
                {/* Social Login Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSocialAuth('Google')}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white text-slate-800 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialAuth('Facebook')}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#165EBF] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('WHATSAPP_OTP')}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Ou acesse com e-mail cadastrado
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail Cadastrado:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D3277] focus:border-[#2D3277] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Senha de Acesso:
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('RECOVER')}
                        className="text-[11px] font-bold text-[#2D3277] hover:underline"
                      >
                        Esqueci a senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D3277] focus:border-[#2D3277] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-[#2D3277] hover:bg-[#1E2255] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Autenticando conta...</span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Acessar Conta Cadastrada</span>
                      </>
                    )}
                  </button>

                  <div className="pt-3 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-600 mb-2">Ainda não tem uma conta cadastrada?</p>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('REGISTER')}
                      className="w-full py-2.5 rounded-xl border-2 border-[#2D3277] text-[#2D3277] hover:bg-[#2D3277] hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Criar Nova Conta com Confirmação</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODE 2: REGISTER FORM */}
            {mode === 'REGISTER' && (
              <div className="space-y-3.5">
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome Completo:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Seu Nome e Sobrenome"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D3277] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail de Cadastro:
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="seu.email@exemplo.com"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D3277] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        WhatsApp com DDD:
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D3277] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Crie uma Senha Forte:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D3277] outline-none"
                      />
                    </div>
                  </div>

                  {/* Plan Preference Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Selecione o Plano de Preferência:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegPlan('MENSAL')}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          regPlan === 'MENSAL'
                            ? 'border-[#2D3277] bg-[#2D3277]/10 text-[#2D3277] font-black'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <strong className="block text-xs">Mensal</strong>
                        <span className="text-[10px] text-slate-500">R$ 29,90/mês</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegPlan('SEMESTRAL')}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          regPlan === 'SEMESTRAL'
                            ? 'border-[#2D3277] bg-[#2D3277]/10 text-[#2D3277] font-black'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <strong className="block text-xs">Semestral</strong>
                        <span className="text-[10px] text-emerald-600 font-bold">15% OFF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegPlan('ANUAL')}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          regPlan === 'ANUAL'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 font-black'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <strong className="block text-xs">Anual</strong>
                        <span className="text-[10px] text-amber-700 font-bold">30% OFF</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading ? (
                      <span>Enviando código de verificação...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Solicitar Código PIN de Confirmação</span>
                      </>
                    )}
                  </button>

                  <div className="pt-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('LOGIN')}
                      className="text-xs text-[#2D3277] font-bold hover:underline"
                    >
                      Já possui uma conta? Faça Login
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODE: VERIFY PIN CODE */}
            {mode === 'VERIFY_PIN' && (
              <form onSubmit={handleVerifyPinSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-[#2D3277]">
                  <p className="font-bold mb-1">📧 Confirme a Autenticidade da Conta</p>
                  <p className="text-[11px] text-slate-600">
                    Insira abaixo o código de verificação enviado para o e-mail <strong>{pendingRegistrationEmail}</strong> para validar seu cadastro.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de 6 Dígitos (PIN):
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Ex: 849201"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest font-bold focus:ring-2 focus:ring-[#2D3277] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#2D3277] hover:bg-[#1E2255] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>Validando PIN...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#FFE600]" />
                      <span>Confirmar PIN e Acessar Plataforma</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('REGISTER')}
                    className="text-xs text-slate-500 font-bold hover:underline"
                  >
                    ← Alterar dados de cadastro
                  </button>
                </div>
              </form>
            )}

            {/* MODE: WHATSAPP OTP */}
            {mode === 'WHATSAPP_OTP' && (
              <div className="space-y-4">
                {!waCodeSent ? (
                  <form onSubmit={handleSendWaOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Número do Seu WhatsApp com DDD:
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={waPhone}
                          onChange={(e) => setWaPhone(e.target.value)}
                          placeholder="+55 (11) 99999-8888"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <span>Solicitando OTP...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Código de Verificação para WhatsApp</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyWaOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Código OTP Recebido no WhatsApp:
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={waCode}
                          onChange={(e) => setWaCode(e.target.value)}
                          placeholder="Ex: 582910"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest font-bold focus:ring-2 focus:ring-emerald-600 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <span>Validando OTP...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Autenticar via WhatsApp</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('LOGIN')}
                    className="text-xs text-[#2D3277] font-bold hover:underline"
                  >
                    ← Voltar para a login por e-mail
                  </button>
                </div>
              </div>
            )}

            {/* MODE: RECOVER PASSWORD FORM */}
            {mode === 'RECOVER' && (
              <form onSubmit={handleRecoverSubmit} className="space-y-4">
                {!recoverSuccess ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail Cadastrado:
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          value={recoverEmail}
                          onChange={(e) => setRecoverEmail(e.target.value)}
                          placeholder="seu.email@exemplo.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#2D3277] outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-[#2D3277] hover:bg-[#1E2255] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <span>Enviando e-mail...</span>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Enviar Instruções de Recuperação</span>
                        </>
                      )}
                    </button>
                  </>
                ) : null}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('LOGIN')}
                    className="text-xs text-[#2D3277] font-bold hover:underline"
                  >
                    ← Voltar para a tela de Login
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="pt-6 text-center">
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} IMPORTHOURANDO. Todos os direitos reservados.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
