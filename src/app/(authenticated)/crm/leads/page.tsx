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
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, Filter, Upload, Download, Mail, MessageSquare, Briefcase, MoreHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Lead, EtapaFunil, FonteLead, ProdutoTipo } from '@/types/database';
import { SkeletonCard } from '@/components/shared/skeleton';
import { useUser } from '@/contexts/user-context';

const STAGES: EtapaFunil[] = ['Prospecção', 'Reunião agendada', 'Diagnóstico', 'Proposta enviada', 'Negociação', 'Fechado'];

interface NewLead {
  nome: string;
  empresa: string;
  cargo: string;
  email: string;
  telefone: string;
  produto_interesse: ProdutoTipo | '';
  valor_estimado: string;
  etapa_funil: EtapaFunil;
  proxima_acao: string;
  fonte: FonteLead | '';
}

const EMPTY_LEAD: NewLead = {
  nome: '', empresa: '', cargo: '', email: '', telefone: '',
  produto_interesse: '', valor_estimado: '', etapa_funil: 'Prospecção',
  proxima_acao: '', fonte: '',
};

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewLead>(EMPTY_LEAD);
  const { userId } = useUser();

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar leads');
    else setLeads(data ?? []);
    setLoading(false);
  }

  const filtered = leads.filter(l =>
    l.nome.toLowerCase().includes(search.toLowerCase()) ||
    (l.empresa ?? '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('leads')
      .insert({
        nome: form.nome,
        empresa: form.empresa || null,
        cargo: form.cargo || null,
        email: form.email || null,
        telefone: form.telefone || null,
        produto_interesse: (form.produto_interesse as ProdutoTipo) || null,
        valor_estimado: parseFloat(form.valor_estimado) || 0,
        etapa_funil: form.etapa_funil,
        proxima_acao: form.proxima_acao || null,
        fonte: (form.fonte as FonteLead) || null,
        created_by: userId,
      })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error('Erro ao criar lead: ' + error.message); return; }
    if (data) setLeads(prev => [data, ...prev]);
    toast.success('Lead criado!');
    setShowCreate(false);
    setForm(EMPTY_LEAD);
  }

  async function moveStage(lead: Lead, etapa: EtapaFunil) {
    const supabase = createClient();
    const { error } = await supabase
      .from('leads')
      .update({ etapa_funil: etapa })
      .eq('id', lead.id);
    if (error) { toast.error('Erro ao mover lead'); return; }
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, etapa_funil: etapa } : l));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="CRM & Leads" subtitle="Funil de Vendas" />

      {/* Toolbar */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0,
        }}
      >
        <div style={{ position: 'relative', flex: '0 0 220px' }}>
          <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input
            placeholder="Pesquisar lead..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              height: 30, width: '100%', paddingLeft: 30, paddingRight: 10, fontSize: 12,
              background: 'rgba(0,255,87,0.04)', border: '1px solid var(--border)', borderRadius: 6,
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>
        <Button variant="outline" size="sm" style={{ height: 30, fontSize: 12 }}>
          <Filter style={{ width: 12, height: 12 }} /> Filtros
        </Button>
        <div style={{ flex: 1 }} />
        <Button variant="outline" size="sm" style={{ height: 30, fontSize: 12 }}>
          <Download style={{ width: 12, height: 12 }} /> Exportar
        </Button>
        <Button size="sm" onClick={() => setShowCreate(true)} style={{ height: 30, fontSize: 12 }}>
          <Plus style={{ width: 12, height: 12 }} /> Adicionar Lead
        </Button>
      </div>

      {/* Kanban */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '14px 20px 14px' }}>
        <div style={{ display: 'flex', gap: 10, height: '100%', minWidth: 'max-content' }}>
          {STAGES.map(stage => {
            const stageLeads = filtered.filter(l => l.etapa_funil === stage);
            const total = stageLeads.reduce((s, l) => s + (l.valor_estimado ?? 0), 0);

            return (
              <div
                key={stage}
                style={{
                  width: 210, display: 'flex', flexDirection: 'column',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                }}
              >
                {/* Column header */}
                <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid rgba(0,255,87,0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{stage}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#00FF57', background: 'rgba(0,255,87,0.1)', border: '1px solid rgba(0,255,87,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                      {stageLeads.length}
                    </span>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{formatCurrency(total)}</span>
                </div>

                {/* Cards */}
                <ScrollArea style={{ flex: 1 }}>
                  <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {loading
                      ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
                      : stageLeads.map(lead => (
                        <div
                          key={lead.id}
                          style={{
                            background: 'var(--bg-hover)', border: '1px solid var(--border)',
                            borderLeft: '2px solid rgba(0,255,87,0.35)', borderRadius: 6,
                            padding: '10px 10px', cursor: 'pointer', transition: 'border-color 0.12s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,87,0.28)'; (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(0,255,87,0.6)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.borderLeftColor = 'rgba(0,255,87,0.35)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{lead.nome}</p>
                            {/* Move stage dropdown */}
                            <select
                              value={lead.etapa_funil}
                              onChange={e => moveStage(lead, e.target.value as EtapaFunil)}
                              onClick={e => e.stopPropagation()}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 10, padding: 0 }}
                            >
                              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{lead.empresa}</p>
                          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                            <Badge variant={lead.produto_interesse === 'core' ? 'default' : 'info'} style={{ fontSize: 10 }}>
                              {lead.produto_interesse === 'core' ? 'Core' : lead.produto_interesse === 'high_ticket' ? 'HT' : '—'}
                            </Badge>
                            <Badge variant={lead.fonte === 'cold' ? 'secondary' : lead.fonte === 'warm' ? 'warning' : 'success'} style={{ fontSize: 10 }}>
                              {lead.fonte ?? '—'}
                            </Badge>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#00FF57', fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(lead.valor_estimado ?? 0)}
                            </span>
                            <div style={{ display: 'flex', gap: 2 }}>
                              {[MessageSquare, Mail, Briefcase].map((Icon, i) => (
                                <button
                                  key={i}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 3, borderRadius: 4 }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.06)'; (e.currentTarget as HTMLElement).style.color = '#00FF57'; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'; }}
                                >
                                  <Icon style={{ width: 11, height: 11 }} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    }

                    {!loading && stageLeads.length === 0 && (
                      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', padding: '16px 0' }}>
                        Nenhum lead
                      </p>
                    )}

                    <button
                      style={{ width: '100%', height: 28, background: 'rgba(0,255,87,0.04)', border: '1px dashed rgba(0,255,87,0.2)', borderRadius: 6, cursor: 'pointer', color: 'rgba(0,255,87,0.5)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                      onClick={() => setShowCreate(true)}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.08)'; (e.currentTarget as HTMLElement).style.color = '#00FF57'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,87,0.4)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(0,255,87,0.5)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,87,0.2)'; }}
                    >
                      +
                    </button>
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={open => { setShowCreate(open); if (!open) setForm(EMPTY_LEAD); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Adicione um novo lead ao funil.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Nome completo" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input placeholder="Nome da empresa" value={form.empresa} onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input placeholder="Cargo" value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Fonte</Label>
              <Select value={form.fonte} onValueChange={v => setForm(p => ({ ...p, fonte: v as FonteLead }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={form.produto_interesse} onValueChange={v => setForm(p => ({ ...p, produto_interesse: v as ProdutoTipo }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="high_ticket">High Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Estimado (R$)</Label>
              <Input type="number" placeholder="0" value={form.valor_estimado} onChange={e => setForm(p => ({ ...p, valor_estimado: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={form.etapa_funil} onValueChange={v => setForm(p => ({ ...p, etapa_funil: v as EtapaFunil }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Próxima Ação</Label>
              <Textarea placeholder="Descreva a próxima ação..." value={form.proxima_acao} onChange={e => setForm(p => ({ ...p, proxima_acao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setShowCreate(false); setForm(EMPTY_LEAD); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando…' : 'Criar Lead'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
