'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatCard } from '@/components/shared/stat-card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileSignature, Plus, Download, Eye, Pen, Clock, CheckCircle, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Contrato, ContratoStatus, ContratoTipo, Lead, TemplateContrato } from '@/types/database';
import { SkeletonRow } from '@/components/shared/skeleton';
import { useUser } from '@/contexts/user-context';

type ContratoComLead = Contrato & {
  leads: { nome: string; empresa: string | null } | null;
  propostas: { valor: number | null } | null;
};

const statusBadge: Record<ContratoStatus, 'secondary' | 'info' | 'success' | 'warning'> = {
  aguardando: 'warning', enviado: 'info', assinado: 'success', cancelado: 'secondary',
};

const tipoBadge: Record<ContratoTipo, { label: string; variant: 'default' | 'info' | 'secondary' }> = {
  pj:           { label: 'PJ',           variant: 'default' },
  setor_publico: { label: 'Setor Público', variant: 'info' },
  nda:          { label: 'NDA',          variant: 'secondary' },
};

const COLS = '2fr 110px 110px 90px 110px 80px';
const TABLE_HEADERS = ['Lead / Empresa', 'Tipo', 'Valor Mensal', 'Status', 'Assinatura', 'Ações'];

export default function ContratosPage() {
  const [contratos, setContratos] = useState<ContratoComLead[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ndaTemplate, setNdaTemplate] = useState<TemplateContrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const { userId } = useUser();

  const [form, setForm] = useState({ lead_id: '', tipo: '' as ContratoTipo | '' });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    const [contRes, leadRes, tplRes] = await Promise.all([
      supabase.from('contratos').select('*, leads(nome, empresa), propostas(valor)').order('created_at', { ascending: false }),
      supabase.from('leads').select('id, nome, empresa').order('nome'),
      supabase.from('templates_contrato').select('*').eq('tipo', 'nda').single(),
    ]);
    if (contRes.error) toast.error('Erro ao carregar contratos');
    else setContratos((contRes.data ?? []) as ContratoComLead[]);
    if (leadRes.data) setLeads(leadRes.data as Lead[]);
    if (tplRes.data) { setNdaTemplate(tplRes.data); setTemplateContent(tplRes.data.conteudo); }
    setLoading(false);
  }

  const aguardando = contratos.filter(c => c.status === 'aguardando').length;
  const enviados   = contratos.filter(c => c.status === 'enviado').length;
  const assinados  = contratos.filter(c => c.status === 'assinado').length;
  const valorTotal = contratos.filter(c => c.status === 'assinado').reduce((s, c) => s + (c.propostas?.valor ?? 0), 0);

  async function handleCreate() {
    if (!form.lead_id || !form.tipo) { toast.error('Lead e tipo são obrigatórios'); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contratos')
      .insert({ lead_id: form.lead_id, tipo: form.tipo as ContratoTipo, status: 'aguardando', created_by: userId })
      .select('*, leads(nome, empresa), propostas(valor)')
      .single();
    setSaving(false);
    if (error) { toast.error('Erro ao criar contrato: ' + error.message); return; }
    if (data) setContratos(prev => [data as ContratoComLead, ...prev]);
    toast.success('Contrato criado!');
    setShowCreateDialog(false);
    setForm({ lead_id: '', tipo: '' });
  }

  async function handleSaveTemplate() {
    if (!ndaTemplate) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('templates_contrato')
      .update({ conteudo: templateContent })
      .eq('id', ndaTemplate.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar template: ' + error.message); return; }
    setNdaTemplate(prev => prev ? { ...prev, conteudo: templateContent } : prev);
    toast.success('Template salvo!');
    setShowTemplateDialog(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Contratos" subtitle="Contratos e Assinaturas" />

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} className="page-content">

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard title="Aguardando"       value={String(aguardando)}         icon={Clock}         color="green" />
            <StatCard title="Enviados"          value={String(enviados)}           icon={Send}          color="green" />
            <StatCard title="Assinados"         value={String(assinados)}          icon={CheckCircle}   color="green" />
            <StatCard title="Valor Contratado"  value={formatCurrency(valorTotal)} icon={FileSignature} color="green" />
          </div>

          {/* NDA Template */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pen style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                Template NDA Padrão
              </span>
              <Button variant="outline" size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowTemplateDialog(true)}>
                Editar Template
              </Button>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px' }}>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {ndaTemplate?.conteudo ?? (
                    <>
                      <strong style={{ color: 'var(--text-primary)' }}>TERMO DE CONFIDENCIALIDADE (NDA)</strong>
                      {'\n\n'}Pelo presente instrumento, as partes abaixo qualificadas firmam o presente Termo de Confidencialidade e Não Divulgação...
                      {'\n\n'}<span style={{ color: 'rgba(0,255,87,0.45)' }}>[Nenhum template cadastrado. Clique em Editar Template para adicionar.]</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Contracts table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Contratos</span>
              <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowCreateDialog(true)}>
                <Plus style={{ width: 11, height: 11 }} /> Novo Contrato
              </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
              {TABLE_HEADERS.map(h => (
                <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : contratos.map((c, i) => (
                <div key={c.id}
                  style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '9px 16px', borderBottom: i < contratos.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{c.leads?.nome ?? '—'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{c.leads?.empresa ?? ''}</p>
                  </div>
                  <span>
                    {c.tipo ? <Badge variant={tipoBadge[c.tipo].variant} style={{ fontSize: 10 }}>{tipoBadge[c.tipo].label}</Badge> : '—'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#00FF57', fontVariantNumeric: 'tabular-nums' }}>
                    {c.propostas?.valor ? formatCurrency(c.propostas.valor) : '—'}
                  </span>
                  <span><Badge variant={statusBadge[c.status]} style={{ fontSize: 10 }}>{c.status}</Badge></span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {c.data_assinatura ? formatDate(c.data_assinatura) : 'Pendente'}
                  </span>
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
            {!loading && contratos.length === 0 && (
              <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum contrato ainda.</p>
            )}
          </div>

        </div>
      </ScrollArea>

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={open => { setShowCreateDialog(open); if (!open) setForm({ lead_id: '', tipo: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <DialogDescription>Crie um novo contrato para um lead.</DialogDescription>
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
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as ContratoTipo }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pj">PJ</SelectItem>
                  <SelectItem value="setor_publico">Setor Público</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando…' : 'Criar Contrato'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template editor dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Template NDA</DialogTitle>
            <DialogDescription>Edite o conteúdo do template de NDA padrão.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              value={templateContent}
              onChange={e => setTemplateContent(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Digite o conteúdo do template NDA..."
            />
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setShowTemplateDialog(false); setTemplateContent(ndaTemplate?.conteudo ?? ''); }}>Cancelar</Button>
            <Button onClick={handleSaveTemplate} disabled={saving}>{saving ? 'Salvando…' : 'Salvar Template'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
