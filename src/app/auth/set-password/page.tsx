'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState('');
  const [done, setDone]           = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setDone(true);
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
    }
  }

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
              width: 44, height: 44,
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
          <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            VAMOOS
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Crie sua senha de acesso
          </p>
        </div>

        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {done ? (
            <div className="p-6 flex flex-col items-center gap-3">
              <CheckCircle style={{ width: 32, height: 32, color: '#00FF57' }} />
              <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                Senha definida com sucesso!
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Redirecionando para o dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 13, height: 13, color: 'var(--text-faint)' }} />
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 13, height: 13, color: 'var(--text-faint)' }} />
                  <Input
                    type="password"
                    placeholder="Repita a senha"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              {message && (
                <div
                  className="text-[12px] rounded-md px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.16)' }}
                >
                  {message}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full mt-1" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: 'rgba(10,10,10,0.8)' }} />
                    Salvando…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Definir senha <ArrowRight style={{ width: 14, height: 14 }} />
                  </span>
                )}
              </Button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
