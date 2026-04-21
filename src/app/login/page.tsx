'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [mode, setMode]         = useState<'password' | 'magic'>('password');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-app)' }}
    >
      <div className="w-full max-w-[340px] px-4 animate-fade-in">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center rounded-xl mb-4"
            style={{
              width: 44,
              height: 44,
              background: 'rgba(0,255,87,0.07)',
              border: '1px solid rgba(0,255,87,0.14)',
            }}
          >
            <Image
              src="/logo.png"
              alt="VAMOOS"
              width={24}
              height={24}
              className="object-contain"
              style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,87,0.45))' }}
            />
          </div>
          <h1
            className="text-[18px] font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            VAMOOS
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Plataforma de Performance Comercial
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Mode toggle */}
          <div
            className="flex p-1 m-4 mb-0 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
          >
            {(['password', 'magic'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium transition-all cursor-pointer"
                style={
                  mode === m
                    ? { background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                    : { color: 'var(--text-muted)', border: '1px solid transparent' }
                }
              >
                {m === 'password'
                  ? <><Lock style={{ width: 12, height: 12 }} /> Senha</>
                  : <><Sparkles style={{ width: 12, height: 12 }} /> Magic Link</>
                }
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="p-4 pt-4 space-y-3">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[11.5px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ width: 13, height: 13, color: 'var(--text-faint)' }}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>

            {/* Password */}
            {mode === 'password' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-[11.5px] font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ width: 13, height: 13, color: 'var(--text-faint)' }}
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-8"
                    required
                  />
                </div>
              </div>
            )}

            {/* Feedback */}
            {message && (
              <div
                className="text-[12px] rounded-md px-3 py-2"
                style={
                  message.includes('enviado')
                    ? { background: 'rgba(34,197,94,0.08)',  color: '#4ade80', border: '1px solid rgba(34,197,94,0.16)' }
                    : { background: 'rgba(239,68,68,0.08)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.16)' }
                }
              >
                {message}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full mt-1"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: 'rgba(10,10,10,0.8)' }}
                  />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'password' ? 'Entrar' : 'Enviar link'}
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </span>
              )}
            </Button>
          </form>
        </div>

        <p
          className="text-center text-[11px] mt-5"
          style={{ color: 'var(--text-faint)' }}
        >
          © 2025 VAMOOS · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
