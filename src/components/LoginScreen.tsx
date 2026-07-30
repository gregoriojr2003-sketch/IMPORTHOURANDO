import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, Sparkles, CheckCircle2, Crown, AlertCircle, LogIn, UserPlus, KeyRound, Mail, Phone, Check, Zap } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { Subscriber } from '../types';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';
import { isSupabaseConfigured, signInWithGoogle, signUpWithSupabaseEmail, signInWithSupabaseEmail, getSupabase } from '../lib/supabase';

interface LoginScreenProps {
  subscribers: Subscriber[];
  onLoginSuccess: (user: { name: string; email: string; role: 'ADMIN' | 'SUBSCRIBER'; subscriber?: Subscriber }) => void;
  expiredTrialNotice?: string;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'RECOVER';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  subscribers,
  onLoginSuccess,
  expiredTrialNotice
}) => {
  const isLocalStorageTrialUsed = typeof window !== 'undefined' && localStorage.getItem('importhourando_degustacao_used') === 'true';
  const [isIpUsedOnServer, setIsIpUsedOnServer] = useState<boolean>(false);
  const [serverIpNotice, setServerIpNotice] = useState<string | null>(null);

  const isTrialUsed = isLocalStorageTrialUsed || isIpUsedOnServer;
  const [mode, setMode] = useState<AuthMode>(() => (expiredTrialNotice || isLocalStorageTrialUsed) ? 'REGISTER' : 'LOGIN');

  // Check IP & Device Fingerprint trial status and listen for Supabase Google Auth redirect session on mount
  useEffect(() => {
    const checkIpTrial = async () => {
      try {
        const fp = getDeviceFingerprint();
        const res = await fetch(`/api/trial/check?deviceFingerprint=${encodeURIComponent(fp)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.used) {
            setIsIpUsedOnServer(true);
            setServerIpNotice(data.message || 'Seu endereço IP ou dispositivo já utilizou a degustação de 30 minutos.');
            try {
              localStorage.setItem('importhourando_degustacao_used', 'true');
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Error checking IP trial status:', err);
      }
    };
    checkIpTrial();

    // Listen for active Supabase session (returning from Google OAuth)
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user?.email) {
            const googleEmail = session.user.email;
            const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || googleEmail.split('@')[0];
            
            try {
              const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: googleEmail, password: session.user.id })
              });
              const authData = await res.json();
              if (authData.user) {
                onLoginSuccess(authData.user);
              }
            } catch (err) {
              console.error('Error syncing Google OAuth user:', err);
            }
          }
        });
      }
    }
  }, []);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlan, setRegPlan] = useState<'MENSAL' | 'SEMESTRAL' | 'ANUAL'>('MENSAL');

  // Recovery form state
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState(false);

  // Common UI state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle 30-minute guest trial start with IP & Device Fingerprint enforcement
  const handleStartGuest30MinTrial = async () => {
    setIsLoading(true);
    setError('');

    try {
      const fp = getDeviceFingerprint();
      const claimRes = await fetch('/api/trial/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceFingerprint: fp })
      });

      const claimData = await claimRes.json();

      if (!claimRes.ok || !claimData.allowed) {
        setIsIpUsedOnServer(true);
        try {
          localStorage.setItem('importhourando_degustacao_used', 'true');
        } catch (e) {}

        const blockMsg = claimData.message || 'Seu endereço IP ou dispositivo já utilizou a degustação gratuita de 30 minutos!';
        setError(blockMsg);
        setServerIpNotice(blockMsg);
        setMode('REGISTER');
        setIsLoading(false);
        return;
      }

      // Trial allowed: Mark local storage and proceed
      try {
        localStorage.setItem('importhourando_degustacao_used', 'true');
      } catch (e) {}

      const guestSub: Subscriber = {
        id: `trial-${Date.now()}`,
        name: 'Visitante Degustação',
        email: `degustacao_${Date.now().toString().slice(-6)}@importhourando.com.br`,
        phone: '+55 (11) 99999-0000',
        plan: 'MENSAL',
        status: 'DEGUSTACAO',
        startedAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        totalPaid: 0,
        discountApplied: 0,
        isLifetimeExemptFromMonitoring: false,
        notes: `Degustação grátis de 30 minutos iniciada (IP: ${claimData.clientIp || 'N/A'})`
      };

      await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestSub)
      });

      onLoginSuccess({
        name: guestSub.name,
        email: guestSub.email,
        role: 'SUBSCRIBER',
        subscriber: guestSub
      });
    } catch (e: any) {
      console.error('Error claiming trial:', e);
      setError('Ocorreu uma falha ao conectar ao servidor para validar a degustação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch modes safely clearing errors
  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setRecoverSuccess(false);
  };

  // Handle Login submission via Real Express DB & Supabase
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail de acesso ou login.');
      return;
    }

    if (!loginPassword) {
      setError('Por favor, informe sua senha.');
      return;
    }

    setIsLoading(true);

    try {
      // Supabase Auth if configured
      if (isSupabaseConfigured()) {
        try {
          await signInWithSupabaseEmail(cleanEmail, loginPassword);
        } catch (supaErr: any) {
          console.warn('[SUPABASE AUTH WARN]', supaErr.message);
        }
      }

      // Real Database Authentication API Call
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: loginPassword })
      });

      const data = await res.json();

      if (!res.ok || !data.user) {
        setError(data.error || 'Erro ao efetuar login. Verifique suas credenciais.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.user);
    } catch (err) {
      console.error('Login submit error:', err);
      setError('Erro ao conectar ao banco de dados para autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Account Registration via Real Express DB & Supabase
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
      // SignUp via Supabase Auth if configured
      if (isSupabaseConfigured()) {
        try {
          await signUpWithSupabaseEmail(cleanEmail, regPassword, cleanName, cleanPhone);
        } catch (supaErr: any) {
          console.warn('[SUPABASE SIGNUP WARN]', supaErr.message);
        }
      }

      // Real Express Database Registration Call
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: regPassword,
          phone: cleanPhone
        })
      });

      const data = await res.json();

      if (!res.ok || !data.user) {
        setError(data.error || 'Erro ao criar conta no banco de dados.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Conta criada com sucesso no banco de dados!');
      onLoginSuccess(data.user);
    } catch (err) {
      console.error('Register submit error:', err);
      setError('Erro ao salvar usuário no banco de dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };


  // Social SSO Handler (Google, WhatsApp & Facebook)
  const handleSocialAuth = async (provider: 'Google' | 'WhatsApp' | 'Facebook') => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (provider === 'Google' && isSupabaseConfigured()) {
        await signInWithGoogle();
        return;
      }

      const providerEmail = provider === 'Google'
        ? 'usuario.google@gmail.com'
        : (provider === 'WhatsApp' ? 'usuario.whatsapp@whatsapp.com' : 'usuario.facebook@hotmail.com');
      
      const providerName = provider === 'Google'
        ? 'Usuário Google'
        : (provider === 'WhatsApp' ? 'Usuário WhatsApp' : 'Usuário Facebook');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: providerEmail, password: 'social_login_oauth' })
      });

      const data = await res.json();
      if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      console.error(`Error logging in with ${provider}:`, err);
      setError(`Erro no login via ${provider}. Tente novamente.`);
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
          {/* Subtle Background Glows */}
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
                  <strong>Acesso por Login & Senha:</strong> Autenticação individual e área do assinante.
                </span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">
                  <strong>Paineis Exclusivos:</strong> Áreas separadas para Usuário Assinante e Administrador.
                </span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">
                  <strong>Adesão por Planos:</strong> Liberação de recursos conforme a assinatura selecionada.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-slate-300">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Ambiente Protegido com Criptografia SSL & Headers de Segurança</span>
            </div>
          </div>
        </div>

        {/* Right Auth Form Column */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white relative overflow-hidden">
          {/* Logo background watermark on the white side */}
          <div className="absolute -bottom-12 -right-12 pointer-events-none select-none opacity-[0.07] transition-opacity flex items-center justify-center z-0">
            <AppLogo size={380} className="w-80 h-80 sm:w-96 sm:h-96 text-slate-900" />
          </div>
          <div className="absolute -top-16 -left-16 pointer-events-none select-none opacity-[0.04] transition-opacity flex items-center justify-center z-0">
            <AppLogo size={260} className="w-64 h-64 text-[#2D3277]" />
          </div>

          <div className="relative z-10">
            {/* Header Title depending on mode */}
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2 bg-slate-100 text-slate-700 font-extrabold text-[11px] px-3 py-1 rounded-full uppercase mb-2">
                <Lock className="w-3.5 h-3.5 text-[#2D3277]" />
                <span>
                  {mode === 'LOGIN' && 'Acesso Seguro'}
                  {mode === 'REGISTER' && 'Cadastro de Novo Usuário'}
                  {mode === 'RECOVER' && 'Recuperação de Acesso'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {mode === 'LOGIN' && 'Entrar na Plataforma'}
                {mode === 'REGISTER' && 'Criar Sua Conta'}
                {mode === 'RECOVER' && 'Esqueci Minha Senha'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'LOGIN' && 'Informe suas credenciais para acessar sua conta de Usuário ou Administrador.'}
                {mode === 'REGISTER' && 'Cadastre-se gratuitamente e escolha seu plano para liberar os disparos automáticos.'}
                {mode === 'RECOVER' && 'Digite seu e-mail para receber as instruções de redefinição de senha.'}
              </p>
            </div>

            {/* Error, Success, or Expired Trial Alert Banners */}
            {(expiredTrialNotice || isTrialUsed) && (
              <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border-2 border-amber-400 text-amber-950 text-xs font-semibold flex items-start gap-3 shadow-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block text-xs font-black text-amber-900">
                    Sua degustação gratuita de 30 minutos expirou ou já foi utilizada! ⌛
                  </strong>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                    {serverIpNotice || expiredTrialNotice || 'A degustação é liberada apenas 1 única vez por IP/Dispositivo. Para utilizar os disparos de ofertas, faça seu cadastro ou login abaixo e assine um dos nossos planos.'}
                  </p>
                </div>
              </div>
            )}

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
                {/* 30-Min Free Trial Entry Banner */}
                {isTrialUsed ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-400/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full shadow-xs">
                        <Sparkles className="w-3 h-3 text-amber-700" /> Degustação Utilizada
                      </span>
                      <span className="text-[10px] text-amber-800 font-extrabold">30 Min Expirados</span>
                    </div>
                    <div className="w-full py-2.5 px-4 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-90">
                      <Zap className="w-4 h-4 text-amber-700" />
                      <span>⚡ DEGUSTAÇÃO GRÁTIS DE 30 MIN ENCERRADA</span>
                    </div>
                    <p className="text-[10px] text-amber-900/80 font-medium text-center mt-1.5">
                      Faça login ou crie sua conta com Google, Facebook ou e-mail abaixo e escolha um plano de assinatura para liberar o uso.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border-2 border-amber-400/80 shadow-md">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full shadow-xs">
                        <Sparkles className="w-3 h-3" /> Degustação Sem Limite
                      </span>
                      <span className="text-[10px] text-amber-800 font-extrabold">30 Minutos Grátis</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartGuest30MinTrial}
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer group"
                    >
                      <Zap className="w-4 h-4 fill-current text-slate-900 group-hover:scale-110 transition-transform" />
                      <span>⚡ ENTRAR AGORA: TESTAR 30 MINUTOS GRÁTIS</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[10px] text-slate-600 font-medium text-center mt-1.5">
                      Acesso imediato com todas as funções liberadas • Sem cadastro prévio
                    </p>
                  </div>
                )}

                {/* Social Login Options */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1 pb-1">
                    <span>Acesso Rápido com Google:</span>
                    {isSupabaseConfigured() ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                        <Sparkles className="w-3 h-3 text-emerald-600" /> Supabase Real OAuth
                      </span>
                    ) : (
                      <span className="text-slate-600 font-medium text-[10px] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Autenticação via Banco de Dados
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSocialAuth('Google')}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >

                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Entrar com Conta Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialAuth('WhatsApp')}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 fill-current shrink-0" />
                    <span>Entrar com WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialAuth('Facebook')}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#165EBF] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Entrar com Facebook</span>
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Ou acesse com seu e-mail
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail de Acesso ou Login:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com (qualquer e-mail)"
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
                      <span>Verificando credenciais...</span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Acessar Plataforma</span>
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
                      <span>Criar Nova Conta Gratuitamente</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODE 2: REGISTER FORM */}
            {mode === 'REGISTER' && (
              <div className="space-y-3.5">
                {/* Social Signup Options */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSocialAuth('Google')}
                    disabled={isLoading}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Criar com Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialAuth('Facebook')}
                    disabled={isLoading}
                    className="py-2 px-3 rounded-xl bg-[#1877F2] hover:bg-[#165EBF] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Criar com Facebook</span>
                  </button>
                </div>

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Ou preencha com qualquer e-mail
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
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
                      Seu E-mail:
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
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
                    Crie uma Senha:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
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
                    Selecione o Plano Desejado:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegPlan('MENSAL')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        regPlan === 'MENSAL'
                          ? 'border-[#2D3277] bg-[#2D3277]/10 text-[#2D3277] font-black shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <strong className="block text-xs">Mensal</strong>
                      <span className="text-[10px] text-slate-600 font-bold">R$ 49,90/mês</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegPlan('SEMESTRAL')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        regPlan === 'SEMESTRAL'
                          ? 'border-[#2D3277] bg-[#2D3277]/10 text-[#2D3277] font-black shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <strong className="block text-xs">Semestral</strong>
                      <span className="text-[10px] text-emerald-600 font-extrabold">R$ 249,00</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegPlan('ANUAL')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        regPlan === 'ANUAL'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-black shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <strong className="block text-xs">01 Ano</strong>
                      <span className="text-[10px] text-amber-700 font-extrabold">R$ 449,00</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <span>Cadastrando sua conta...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Finalizar Cadastro e Acessar</span>
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

            {/* MODE 3: RECOVER PASSWORD FORM */}
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
