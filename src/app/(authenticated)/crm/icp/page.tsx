'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Users, UserCheck, AlertTriangle, ShoppingBag, Plus, Edit2, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Icp, ProdutoTipo } from '@/types/database';
import { useUser } from '@/contexts/user-context';

const SECTIONS = [
  { key: 'setor'           as const, label: 'Setor',          icon: Building2,     color: 'rgba(0,255,87,0.1)',    iconColor: '#00FF57' },
  { key: 'tamanho_empresa' as const, label: 'Tamanho',         icon: Users,         color: 'rgba(0,255,87,0.1)',    iconColor: '#00FF57' },
  { key: 'cargo_decisor'   as const, label: 'Cargo Decisor',   icon: UserCheck,     color: 'rgba(0,255,87,0.1)',    iconColor: '#00FF57' },
  { key: 'dor_principal'   as const, label: 'Dor Principal',   icon: AlertTriangle, color: 'rgba(245,158,11,0.1)', iconColor: '#f59e0b' },
  { key: 'sinal_compra'    as const, label: 'Sinal de Compra', icon: ShoppingBag,   color: 'rgba(0,255,87,0.1)',    iconColor: '#00FF57' },
];

type IcpForm = {
  produto: ProdutoTipo | '';
  setor: string;
  tamanho_empresa: string;
  cargo_decisor: string;
  dor_principal: string;
  sinal_compra: string;
};

const EMPTY_FORM: IcpForm = {
  produto: '', setor: '', tamanho_empresa: '', cargo_decisor: '', dor_principal: '', sinal_compra: '',
};

export default function ICPPage() {
  const [icps, setIcps]             = useState<Icp[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<IcpForm>(EMPTY_FORM);
  const { userId } = useUser();

  useEffect(() => { fetchIcps(); }, []);

  async function fetchIcps() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('icp').select('*').order('created_at');
    if (error) toast.error('Erro ao carregar ICPs');
    else setIcps((data ?? []) as Icp[]);
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  }

  function openEdit(icp: Icp) {
    setEditingId(icp.id);
    setForm({
      produto:         icp.produto,
      setor:           icp.setor           ?? '',
      tamanho_empresa: icp.tamanho_empresa  ?? '',
      cargo_decisor:   icp.cargo_decisor   ?? '',
      dor_principal:   icp.dor_principal   ?? '',
      sinal_compra:    icp.sinal_compra    ?? '',
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.produto) { toast.error('Selecione um produto'); return; }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      produto:         form.produto as ProdutoTipo,
      setor:           form.setor           || null,
      tamanho_empresa: form.tamanho_empresa  || null,
      cargo_decisor:   form.cargo_decisor   || null,
      dor_principal:   form.dor_principal   || null,
      sinal_compra:    form.sinal_compra    || null,
    };

    if (editingId) {
      const { error } = await supabase.from('icp').update(payload).eq('id', editingId);
      setSaving(false);
      if (error) { toast.error('Erro ao atualizar ICP: ' + error.message); return; }
      setIcps(prev => prev.map(i => i.id === editingId ? { ...i, ...payload } : i));
      toast.success('ICP atualizado!');
    } else {
      const { data, error } = await supabase.from('icp')
        .insert({ ...payload, created_by: userId })
        .select().single();
      setSaving(false);
      if (error) { toast.error('Erro ao criar ICP: ' + error.message); return; }
      if (data) setIcps(prev => [...prev, data as Icp]);
      toast.success('ICP criado!');
    }
    setShowDialog(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="ICP" subtitle="Perfil de Cliente Ideal" />

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '20px 24px', display: 'flex', gap: 16 }} className="page-content">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, height: 400, opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))
          ) : icps.length === 0 ? (
            <div style={{ flex: 1, textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)', fontSize: 13 }}>
              Nenhum ICP cadastrado. Clique em &quot;Novo ICP&quot; para começar.
            </div>
          ) : icps.map(icp => {
            const isCore = icp.produto === 'core';
            return (
              <div key={icp.id} style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: isCore ? 'rgba(0,255,87,0.12)' : 'rgba(245,158,11,0.12)',
                      border: `1px solid ${isCore ? 'rgba(0,255,87,0.22)' : 'rgba(245,158,11,0.22)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isCore ? '#00FF57' : '#f59e0b',
                    }}>
                      <Target style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        ICP {isCore ? 'Core' : 'High Ticket'}
                      </h2>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                        Perfil de cliente ideal — {isCore ? 'Core' : 'High Ticket'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge variant={isCore ? 'default' : 'warning'}>{isCore ? 'Core' : 'High Ticket'}</Badge>
                    <button
                      onClick={() => openEdit(icp)}
                      style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.06)'; (e.currentTarget as HTMLElement).style.color = '#00FF57'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                    >
                      <Edit2 style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                </div>

                {/* Sections */}
                <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {SECTIONS.map((s, i) => (
                    <div key={s.key} style={{ padding: '14px 0', borderBottom: i < SECTIONS.length - 1 ? '1px solid var(--border)' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.iconColor }}>
                          <s.icon style={{ width: 12, height: 12 }} />
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, paddingLeft: 32 }}>
                        {icp[s.key] ?? <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>Não preenchido</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Add button */}
      <div style={{ position: 'fixed', bottom: 24, right: 24 }}>
        <Button onClick={openCreate}>
          <Plus style={{ width: 14, height: 14 }} /> Novo ICP
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) setForm(EMPTY_FORM); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar ICP' : 'Novo ICP'}</DialogTitle>
            <DialogDescription>Defina o perfil de cliente ideal.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select value={form.produto} onValueChange={v => setForm(p => ({ ...p, produto: v as ProdutoTipo }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="high_ticket">High Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Input placeholder="Ex: Varejo, Tecnologia" value={form.setor} onChange={e => setForm(p => ({ ...p, setor: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Tamanho da Empresa</Label>
              <Input placeholder="Ex: 10-200 funcionários" value={form.tamanho_empresa} onChange={e => setForm(p => ({ ...p, tamanho_empresa: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cargo Decisor</Label>
              <Input placeholder="Ex: CEO, Diretor Comercial" value={form.cargo_decisor} onChange={e => setForm(p => ({ ...p, cargo_decisor: e.target.value }))} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Dor Principal</Label>
              <Textarea placeholder="Qual a dor principal deste ICP?" value={form.dor_principal} onChange={e => setForm(p => ({ ...p, dor_principal: e.target.value }))} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Sinal de Compra</Label>
              <Textarea placeholder="Quais sinais indicam propensão a comprar?" value={form.sinal_compra} onChange={e => setForm(p => ({ ...p, sinal_compra: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : (editingId ? 'Salvar Alterações' : 'Criar ICP')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
