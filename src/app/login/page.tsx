'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Zap, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [mode, setMode]         = useState<'password' | 'magic'>('password');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMessage(error.message);
        else window.location.href = '/dashboard';
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) setMessage(error.message);
        else setMessage('Link enviado! Verifique seu e-mail.');
      }
    } catch {
      setMessage('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message.includes('enviado');

  return (
    <>
      <style>{`
        .login-input {
          width: 100%;
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(0, 255, 87, 0.12);
          background: rgba(255, 255, 255, 0.035);
          color: #ffffff;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          padding-left: 36px;
          padding-right: 12px;
        }
        .login-input.has-right-icon { padding-right: 38px; }
        .login-input::placeholder { color: rgba(255, 255, 255, 0.22); }
        .login-input:focus {
          border-color: rgba(0, 255, 87, 0.38);
          background: rgba(0, 255, 87, 0.025);
          box-shadow: 0 0 0 3px rgba(0, 255, 87, 0.07);
        }
        .login-btn {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          border: none;
          background: #00FF57;
          color: #070c07;
          font-size: 13.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
          box-shadow: 0 3px 16px rgba(0, 255, 87, 0.22);
        }
        .login-btn:hover:not(:disabled) {
          background: #00D44A;
          box-shadow: 0 4px 22px rgba(0, 255, 87, 0.3);
        }
        .login-btn:active:not(:disabled) { transform: scale(0.99); }
        .login-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 8px;
          padding: 7px 0;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.18s;
          border: 1px solid transparent;
        }
        .tab-btn.active {
          background: #121c12;
          color: #ffffff;
          border-color: rgba(0, 255, 87, 0.18);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }
        .tab-btn.inactive {
          background: transparent;
          color: rgba(255, 255, 255, 0.38);
        }
        .tab-btn.inactive:hover { color: rgba(255, 255, 255, 0.6); }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--bg-app)' }}
      >
        {/* Atmospheric glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 50% 38%, rgba(0,255,87,0.05) 0%, transparent 70%)',
          }}
        />

        <div className="w-full max-w-[380px] px-5 relative animate-fade-in">

          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="flex items-center justify-center rounded-2xl mb-4"
              style={{
                width: 60,
                height: 60,
                background: 'rgba(0,255,87,0.06)',
                border: '1px solid rgba(0,255,87,0.18)',
                boxShadow: '0 0 28px rgba(0,255,87,0.1), inset 0 1px 0 rgba(0,255,87,0.08)',
              }}
            >
              <Image
                src="/logo.png"
                alt="VAMOOS"
                width={32}
                height={32}
                className="object-contain"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,87,0.55))' }}
              />
            </div>
            <h1 className="text-[24px] font-bold tracking-[-0.03em] gradient-text-brand">
              VAMOOS
            </h1>
            <p className="text-[12.5px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Plataforma de Performance Comercial
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(0,255,87,0.14)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
            }}
          >
            {/* Mode toggle */}
            <div className="px-3 pt-3 pb-0">
              <div
                className="flex rounded-xl p-1"
                style={{ background: 'rgba(0,0,0,0.28)' }}
              >
                <button
                  type="button"
                  onClick={() => { setMode('password'); setMessage(''); }}
                  className={`tab-btn ${mode === 'password' ? 'active' : 'inactive'}`}
                >
                  <Lock style={{ width: 13, height: 13 }} />
                  Senha
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('magic'); setMessage(''); }}
                  className={`tab-btn ${mode === 'magic' ? 'active' : 'inactive'}`}
                >
                  <Zap style={{ width: 13, height: 13 }} />
                  Magic Link
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin} className="px-4 pt-4 pb-5 flex flex-col gap-3">

              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-[12px] font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  E-mail
                </label>
                <div className="relative flex items-center">
                  <Mail
                    style={{
                      position: 'absolute',
                      left: 11,
                      width: 14,
                      height: 14,
                      color: 'rgba(255,255,255,0.22)',
                      pointerEvents: 'none',
                      flexShrink: 0,
                    }}
                  />
                  <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="login-input"
                  />
                </div>
              </div>

              {/* Password field */}
              {mode === 'password' && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-[12px] font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Senha
                  </label>
                  <div className="relative flex items-center">
                    <Lock
                      style={{
                        position: 'absolute',
                        left: 11,
                        width: 14,
                        height: 14,
                        color: 'rgba(255,255,255,0.22)',
                        pointerEvents: 'none',
                        flexShrink: 0,
                      }}
                    />
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="login-input has-right-icon"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.22)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPass
                        ? <EyeOff style={{ width: 14, height: 14 }} />
                        : <Eye    style={{ width: 14, height: 14 }} />
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* Magic Link hint */}
              {mode === 'magic' && (
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Insira seu e-mail e enviaremos um link para acesso imediato — sem senha.
                </p>
              )}

              {/* Feedback */}
              {message && (
                <div
                  className="text-[12.5px] rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
                  style={
                    isSuccess
                      ? { background: 'rgba(0,255,87,0.07)',  color: '#4ade80', border: '1px solid rgba(0,255,87,0.16)' }
                      : { background: 'rgba(239,68,68,0.07)', color: '#f87171', border: '1px solid rgba(239,68,68,0.16)' }
                  }
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isSuccess ? '#4ade80' : '#f87171',
                    }}
                  />
                  {message}
                </div>
              )}

              <button type="submit" disabled={loading} className="login-btn mt-0.5">
                {loading ? (
                  <>
                    <span
                      className="animate-spin"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2px solid rgba(7,12,7,0.2)',
                        borderTopColor: '#070c07',
                        display: 'inline-block',
                      }}
                    />
                    {mode === 'password' ? 'Entrando...' : 'Enviando...'}
                  </>
                ) : (
                  <>
                    {mode === 'password' ? 'Entrar' : 'Enviar link'}
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] mt-5" style={{ color: 'var(--text-faint)' }}>
            © 2025 VAMOOS · Todos os direitos reservados
          </p>
        </div>
      </div>
    </>
  );
}
