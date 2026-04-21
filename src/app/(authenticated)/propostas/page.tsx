'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatCard } from '@/components/shared/stat-card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, Plus, Send, Eye, Download, DollarSign, CheckCircle, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Lead, Proposta, Pacote, PropostaStatus, ProdutoTipo, PacoteNome } from '@/types/database';
import { SkeletonRow } from '@/components/shared/skeleton';
import { useUser } from '@/contexts/user-context';

type PropostaComLead = Proposta & { leads: { nome: string; empresa: string | null } | null };

const statusBadge: Record<PropostaStatus, 'secondary' | 'info' | 'success' | 'destructive'> = {
  rascunho: 'secondary', enviada: 'info', aceita: 'success', recusada: 'destructive',
};

const COLS = '2fr 90px 80px 110px 90px 90px 90px 70px';
const TABLE_HEADERS = ['Lead', 'Produto', 'Pacote', 'Valor', 'Status', 'Envio', 'Validade', 'Ações'];

export default function PropostasPage() {
  const [propostas, setPropostas] = useState<PropostaComLead[]>([]);
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const { userId } = useUser();

  const [form, setForm] = useState({ lead_id: '', produto: '' as ProdutoTipo | '', pacote: '' as PacoteNome | '', valor: '', validade_dias: '14' });

  const [editingPkg, setEditingPkg] = useState<Pacote | null>(null);
  const [pkgForm, setPkgForm] = useState({ nome: '', preco_mensal: '', inclui: '', desconto_maximo: '' });
  const [savingPkg, setSavingPkg] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    const [propRes, pacRes, leadRes] = await Promise.all([
      supabase.from('propostas').select('*, leads(nome, empresa)').order('created_at', { ascending: false }),
      supabase.from('pacotes').select('*').order('preco_mensal'),
      supabase.from('leads').select('id, nome, empresa').order('nome'),
    ]);
    if (propRes.error) toast.error('Erro ao carregar propostas');
    else setPropostas((propRes.data ?? []) as PropostaComLead[]);
    if (pacRes.data) setPacotes(pacRes.data);
    if (leadRes.data) setLeads(leadRes.data as Lead[]);
    setLoading(false);
  }

  const rascunhos = propostas.filter(p => p.status === 'rascunho').length;
  const enviadas  = propostas.filter(p => p.status === 'enviada').length;
  const aceitas   = propostas.filter(p => p.status === 'aceita').length;
  const valorTotal = propostas.reduce((s, p) => s + (p.valor ?? 0), 0);

  async function handleCreate() {
    if (!form.lead_id) { toast.error('Selecione um lead'); return; }
    setSaving(true);
    const supabase = createClient();
    const hoje = new Date();
    const validade = new Date(hoje);
    validade.setDate(hoje.getDate() + parseInt(form.validade_dias || '14'));

    const { data, error } = await supabase
      .from('propostas')
      .insert({
        lead_id: form.lead_id,
        produto: (form.produto as ProdutoTipo) || null,
        pacote: (form.pacote as PacoteNome) || null,
        valor: parseFloat(form.valor) || null,
        status: 'rascunho',
        validade: validade.toISOString().split('T')[0],
        created_by: userId,
      })
      .select('*, leads(nome, empresa)')
      .single();
    setSaving(false);
    if (error) { toast.error('Erro ao criar proposta: ' + error.message); return; }
    if (data) setPropostas(prev => [data as PropostaComLead, ...prev]);
    toast.success('Proposta criada!');
    setShowDialog(false);
    setForm({ lead_id: '', produto: '', pacote: '', valor: '', validade_dias: '14' });
  }

  async function handleSavePacote() {
    if (!editingPkg) return;
    setSavingPkg(true);
    const supabase = createClient();
    const items = pkgForm.inclui.split('\n').map(i => i.trim()).filter(i => i);
    const { data, error } = await supabase.from('pacotes').update({
      nome: pkgForm.nome,
      preco_mensal: parseFloat(pkgForm.preco_mensal) || 0,
      inclui: items,
      desconto_maximo: parseInt(pkgForm.desconto_maximo) || 0
    }).eq('id', editingPkg.id).select();
    
    if (error) {
      toast.error('Erro ao atualizar pacote: ' + error.message);
    } else if (!data || data.length === 0) {
      toast.error('Acesso negado: Você não tem permissão de administrador para editar pacotes.');
    } else {
      toast.success('Pacote atualizado!');
      setEditingPkg(null);
      fetchAll();
    }
    setSavingPkg(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Propostas" subtitle="Propostas Comerciais" />

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} className="page-content">

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard title="Rascunhos"   value={String(rascunhos)}          icon={FileText}    color="green" />
            <StatCard title="Enviadas"    value={String(enviadas)}           icon={Send}        color="green" />
            <StatCard title="Aceitas"     value={String(aceitas)}            icon={CheckCircle} color="green" />
            <StatCard title="Valor Total" value={formatCurrency(valorTotal)} icon={DollarSign}  color="green" />
          </div>

          {/* Pricing packages */}
          {pacotes.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pacotes.length}, 1fr)`, gap: 12 }}>
              {pacotes.map((pkg, i) => {
                const isPopular = i === 1;
                return (
                  <div key={pkg.id} style={{ background: 'var(--bg-card)', border: `1px solid ${isPopular ? 'rgba(0,255,87,0.35)' : 'var(--border)'}`, borderTop: isPopular ? '2px solid #00FF57' : '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    {isPopular && (
                      <div style={{ background: 'rgba(0,255,87,0.1)', padding: '6px 16px', textAlign: 'center', borderBottom: '1px solid rgba(0,255,87,0.2)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#00FF57', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mais Popular</span>
                      </div>
                    )}
                    <div style={{ padding: '16px 18px', textAlign: 'center', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                      <button 
                        onClick={() => {
                          setEditingPkg(pkg);
                          setPkgForm({
                            nome: pkg.nome,
                            preco_mensal: String(pkg.preco_mensal),
                            inclui: (pkg.inclui || []).join('\n'),
                            desconto_maximo: String(pkg.desconto_maximo || 0)
                          });
                        }}
                        style={{ position: 'absolute', top: 12, right: 12, padding: 6, background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        title="Editar pacote"
                      >
                        <Edit2 style={{ width: 12, height: 12 }} />
                      </button>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{pkg.nome}</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                        {formatCurrency(pkg.preco_mensal)}
                        <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/mês</span>
                      </p>
                    </div>
                    <div style={{ padding: '14px 18px' }}>
                      {(pkg.inclui ?? []).map((item, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <CheckCircle style={{ width: 12, height: 12, color: '#00FF57', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item}</span>
                        </div>
                      ))}
                      <p style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 10, textAlign: 'center' }}>
                        Desconto máx: {pkg.desconto_maximo}% (só sócios)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Proposals table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Propostas</span>
              <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowDialog(true)}>
                <Plus style={{ width: 11, height: 11 }} /> Nova Proposta
              </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
              {TABLE_HEADERS.map(h => (
                <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
              : propostas.map((p, i) => (
                <div key={p.id}
                  style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '9px 16px', borderBottom: i < propostas.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{p.leads?.nome ?? '—'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{p.leads?.empresa ?? ''}</p>
                  </div>
                  <span><Badge variant={p.produto === 'core' ? 'default' : 'info'} style={{ fontSize: 10 }}>{p.produto === 'core' ? 'Core' : p.produto === 'high_ticket' ? 'HT' : '—'}</Badge></span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.pacote ?? '—'}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#00FF57', fontVariantNumeric: 'tabular-nums' }}>{p.valor ? formatCurrency(p.valor) : '—'}</span>
                  <span><Badge variant={statusBadge[p.status]} style={{ fontSize: 10 }}>{p.status}</Badge></span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.data_envio ? formatDate(p.data_envio) : '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.validade ? formatDate(p.validade) : '—'}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[Eye, Download].map((Icon, idx) => (
                      <button key={idx} style={{ width: 26, height: 26, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.06)'; (e.currentTarget as HTMLElement).style.color = '#00FF57'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'; }}>
                        <Icon style={{ width: 11, height: 11 }} />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            }
            {!loading && propostas.length === 0 && (
              <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhuma proposta ainda.</p>
            )}
          </div>

        </div>
      </ScrollArea>

      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) setForm({ lead_id: '', produto: '', pacote: '', valor: '', validade_dias: '14' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Proposta</DialogTitle>
            <DialogDescription>Crie uma nova proposta comercial a partir de um lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Lead *</Label>
              <Select value={form.lead_id} onValueChange={v => setForm(p => ({ ...p, lead_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}{l.empresa ? ` — ${l.empresa}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={form.produto} onValueChange={v => setForm(p => ({ ...p, produto: v as ProdutoTipo }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="high_ticket">High Ticket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pacote</Label>
                <Select value={form.pacote} onValueChange={v => setForm(p => ({ ...p, pacote: v as PacoteNome }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="padrao">Padrão</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor Mensal (R$)</Label>
              <Input type="number" placeholder="0" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Validade (dias)</Label>
              <Input type="number" value={form.validade_dias} onChange={e => setForm(p => ({ ...p, validade_dias: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando…' : 'Criar Proposta'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPkg} onOpenChange={open => { if (!open) setEditingPkg(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pacote</DialogTitle>
            <DialogDescription>Edite as informações e os itens inclusos neste plano.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome do Pacote</Label>
              <Input value={pkgForm.nome} onChange={e => setPkgForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Mensal (R$)</Label>
                <Input type="number" value={pkgForm.preco_mensal} onChange={e => setPkgForm(p => ({ ...p, preco_mensal: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Desconto Máx. (%)</Label>
                <Input type="number" value={pkgForm.desconto_maximo} onChange={e => setPkgForm(p => ({ ...p, desconto_maximo: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Itens Inclusos (um por linha)</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={pkgForm.inclui}
                onChange={e => setPkgForm(p => ({ ...p, inclui: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingPkg(null)}>Cancelar</Button>
            <Button onClick={handleSavePacote} disabled={savingPkg}>{savingPkg ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
