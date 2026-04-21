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
import { StatCard } from '@/components/shared/stat-card';
import { formatDateTime } from '@/lib/utils';
import { Calendar, Plus, Video, CheckCircle, XCircle, AlertCircle, ClipboardList, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Lead, Reuniao, ReunioStatus } from '@/types/database';
import { SkeletonRow } from '@/components/shared/skeleton';
import { useUser } from '@/contexts/user-context';

type ReuniaoComLead = Reuniao & { leads: { nome: string; empresa: string | null } | null };

const statusBadge: Record<ReunioStatus, 'info' | 'success' | 'destructive'> = {
  agendada: 'info', realizada: 'success', cancelada: 'destructive',
};

const COLS = '2fr 130px 70px 100px 80px 110px';
const TABLE_HEADERS = ['Lead', 'Data/Hora', 'Duração', 'Status', 'Vídeo', 'Ações'];

const DEFAULT_QUESTIONS = [
  'Qual é o principal desafio comercial da empresa hoje?',
  'Como funciona o processo de vendas atual? Quantas etapas?',
  'Qual é a meta de faturamento para os próximos 12 meses?',
  'Quantas pessoas estão na equipe comercial?',
  'Já utilizam algum CRM ou ferramenta de gestão de vendas?',
  'Qual é o ticket médio atual? E o ciclo de vendas?',
  'Se pudéssemos resolver um problema hoje, qual seria?',
  'Quem mais participa da decisão de contratação?',
];

export default function ReunioesPage() {
  const [reunioes, setReunioes] = useState<ReuniaoComLead[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showDiagnosticDialog, setShowDiagnosticDialog] = useState(false);
  const [selectedReuniao, setSelectedReuniao] = useState<ReuniaoComLead | null>(null);
  const [saving, setSaving] = useState(false);
  const { userId } = useUser();

  // Meeting form
  const [mForm, setMForm] = useState({ lead_id: '', data: '', duracao: '45', url_video: '' });
  // Diagnostic form
  const [dForm, setDForm] = useState({ dor_principal: '', budget: '', urgencia: '3', autoridade: 'sim', probabilidade_fechamento: '', proximo_passo: '' });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    const [reunioesRes, leadsRes] = await Promise.all([
      supabase.from('reunioes').select('*, leads(nome, empresa)').order('data', { ascending: true }),
      supabase.from('leads').select('id, nome, empresa').order('nome'),
    ]);
    if (reunioesRes.error) toast.error('Erro ao carregar reuniões');
    else setReunioes((reunioesRes.data ?? []) as ReuniaoComLead[]);
    if (leadsRes.data) setLeads(leadsRes.data as Lead[]);
    setLoading(false);
  }

  const agendadas = reunioes.filter(r => r.status === 'agendada').length;
  const realizadas = reunioes.filter(r => r.status === 'realizada').length;
  const canceladas = reunioes.filter(r => r.status === 'cancelada').length;
  const taxaConversao = reunioes.length > 0
    ? Math.round((realizadas / (reunioes.length - canceladas || 1)) * 100)
    : 0;

  async function handleCreateMeeting() {
    if (!mForm.lead_id || !mForm.data) { toast.error('Lead e data são obrigatórios'); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reunioes')
      .insert({ lead_id: mForm.lead_id, data: mForm.data, duracao: parseInt(mForm.duracao), url_video: mForm.url_video || null, created_by: userId })
      .select('*, leads(nome, empresa)')
      .single();
    setSaving(false);
    if (error) { toast.error('Erro ao agendar: ' + error.message); return; }
    if (data) setReunioes(prev => [...prev, data as ReuniaoComLead]);
    toast.success('Reunião agendada!');
    setShowMeetingDialog(false);
    setMForm({ lead_id: '', data: '', duracao: '45', url_video: '' });
  }

  async function handleSaveDiagnostic() {
    if (!selectedReuniao) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('diagnosticos').insert({
      reuniao_id: selectedReuniao.id,
      dor_principal: dForm.dor_principal || null,
      budget: dForm.budget || null,
      urgencia: parseInt(dForm.urgencia),
      autoridade: dForm.autoridade === 'sim',
      probabilidade_fechamento: parseInt(dForm.probabilidade_fechamento) || null,
      proximo_passo: dForm.proximo_passo || null,
      created_by: userId,
    });
    setSaving(false);
    if (error) { toast.error('Erro ao salvar diagnóstico: ' + error.message); return; }
    toast.success('Diagnóstico salvo!');
    setShowDiagnosticDialog(false);
    setSelectedReuniao(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Reuniões" subtitle="Agende e acompanhe reuniões" />

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} className="page-content">

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard title="Agendadas"         value={String(agendadas)}          icon={Calendar}     color="green" />
            <StatCard title="Realizadas (total)" value={String(realizadas)}         icon={CheckCircle}  color="green" />
            <StatCard title="Canceladas (total)" value={String(canceladas)}         icon={XCircle}      color="green" />
            <StatCard title="Taxa Conversão"     value={`${taxaConversao}%`}        icon={AlertCircle}  color="green" />
          </div>

          {/* Discovery roteiro */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ClipboardList style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                Roteiro de Descoberta
              </span>
              <Button variant="outline" size="sm" style={{ height: 28, fontSize: 11 }}>
                <FileText style={{ width: 11, height: 11 }} /> Editar Roteiro
              </Button>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {DEFAULT_QUESTIONS.map((q, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < DEFAULT_QUESTIONS.length - 1 ? '1px solid var(--border)' : undefined }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#00FF57', minWidth: 20, marginTop: 1 }}>{i + 1}.</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{q}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meetings table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Todas as Reuniões</span>
              <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowMeetingDialog(true)}>
                <Plus style={{ width: 11, height: 11 }} /> Agendar
              </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
              {TABLE_HEADERS.map(h => (
                <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : reunioes.map((m, i) => (
                <div
                  key={m.id}
                  style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '9px 16px', borderBottom: i < reunioes.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                >
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{m.leads?.nome ?? '—'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{m.leads?.empresa ?? ''}</p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDateTime(m.data)}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.duracao} min</span>
                  <span><Badge variant={statusBadge[m.status]}>{m.status}</Badge></span>
                  <span>
                    {m.url_video ? (
                      <a href={m.url_video} target="_blank" style={{ color: '#00FF57', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Video style={{ width: 11, height: 11 }} /> Abrir
                      </a>
                    ) : <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>—</span>}
                  </span>
                  <span>
                    {m.status === 'realizada' && (
                      <Button variant="outline" size="sm" style={{ height: 26, fontSize: 11 }} onClick={() => { setSelectedReuniao(m); setShowDiagnosticDialog(true); }}>
                        Diagnóstico
                      </Button>
                    )}
                  </span>
                </div>
              ))
            }
            {!loading && reunioes.length === 0 && (
              <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhuma reunião registrada.</p>
            )}
          </div>

        </div>
      </ScrollArea>

      {/* Schedule meeting dialog */}
      <Dialog open={showMeetingDialog} onOpenChange={open => { setShowMeetingDialog(open); if (!open) setMForm({ lead_id: '', data: '', duracao: '45', url_video: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Reunião</DialogTitle>
            <DialogDescription>Agende uma nova reunião com um lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Lead *</Label>
              <Select value={mForm.lead_id} onValueChange={v => setMForm(p => ({ ...p, lead_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.nome}{l.empresa ? ` — ${l.empresa}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data e Hora *</Label>
                <Input type="datetime-local" value={mForm.data} onChange={e => setMForm(p => ({ ...p, data: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Select value={mForm.duracao} onValueChange={v => setMForm(p => ({ ...p, duracao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['15', '30', '45', '60'].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL do Vídeo (opcional)</Label>
              <Input placeholder="https://meet.google.com/..." value={mForm.url_video} onChange={e => setMForm(p => ({ ...p, url_video: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowMeetingDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateMeeting} disabled={saving}>{saving ? 'Salvando…' : 'Agendar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diagnostic dialog */}
      <Dialog open={showDiagnosticDialog} onOpenChange={open => { setShowDiagnosticDialog(open); if (!open) setSelectedReuniao(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Diagnóstico Pós-Reunião</DialogTitle>
            <DialogDescription>
              {selectedReuniao?.leads?.nome ? `Reunião com ${selectedReuniao.leads.nome}` : 'Preencha o diagnóstico após a reunião.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2 col-span-2">
              <Label>Dor Principal</Label>
              <Textarea placeholder="Qual a principal dor identificada?" value={dForm.dor_principal} onChange={e => setDForm(p => ({ ...p, dor_principal: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Budget (Faixa)</Label>
              <Select value={dForm.budget} onValueChange={v => setDForm(p => ({ ...p, budget: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-5k">Até R$ 5.000/mês</SelectItem>
                  <SelectItem value="5k-15k">R$ 5.000 - R$ 15.000/mês</SelectItem>
                  <SelectItem value="15k-50k">R$ 15.000 - R$ 50.000</SelectItem>
                  <SelectItem value="50k+">Acima de R$ 50.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urgência (1-5)</Label>
              <Select value={dForm.urgencia} onValueChange={v => setDForm(p => ({ ...p, urgencia: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} — {['Muito baixa','Baixa','Média','Alta','Muito alta'][n-1]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Autoridade</Label>
              <Select value={dForm.autoridade} onValueChange={v => setDForm(p => ({ ...p, autoridade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim — É decisor</SelectItem>
                  <SelectItem value="nao">Não — Precisa de aprovação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Probabilidade Fechamento (%)</Label>
              <Input type="number" placeholder="%" min={0} max={100} value={dForm.probabilidade_fechamento} onChange={e => setDForm(p => ({ ...p, probabilidade_fechamento: e.target.value }))} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Próximo Passo</Label>
              <Textarea placeholder="Qual o próximo passo definido?" value={dForm.proximo_passo} onChange={e => setDForm(p => ({ ...p, proximo_passo: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDiagnosticDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveDiagnostic} disabled={saving}>{saving ? 'Salvando…' : 'Salvar Diagnóstico'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
