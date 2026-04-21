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
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, Plus, Users, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Financeiro, Cobranca, Socio, FinanceiroTipo, FinanceiroStatus } from '@/types/database';
import { SkeletonRow } from '@/components/shared/skeleton';
import { useUser } from '@/contexts/user-context';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const TABS = [
  { key: 'dre',         label: 'DRE' },
  { key: 'projecao',    label: 'Projeção 12m' },
  { key: 'lancamentos', label: 'Lançamentos' },
  { key: 'cobrancas',   label: 'Cobranças' },
  { key: 'socios',      label: 'Sócios' },
];

const LANC_COLS = '80px 1.5fr 1fr 110px 90px 80px';
const LANC_HEADERS = ['Tipo', 'Categoria', 'Cliente', 'Valor', 'Data', 'Status'];
const COB_COLS = '2fr 100px 110px 90px 110px';
const COB_HEADERS = ['Contrato', 'Vencimento', 'Valor', 'Status', 'Ação'];

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ height: 28, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap', border: active ? '1px solid rgba(0,255,87,0.28)' : '1px solid transparent', background: active ? 'rgba(0,255,87,0.1)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent', color: active ? '#00FF57' : hovered ? 'var(--text-primary)' : 'var(--text-muted)' }}>
      {children}
    </button>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.dataKey === 'receita' ? 'Receita' : 'Custos'}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

export default function FinanceiroPage() {
  const [tab, setTab] = useState('dre');
  const [lancamentos, setLancamentos] = useState<Financeiro[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showSocioDialog, setShowSocioDialog] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [socioForm, setSocioForm] = useState({ nome: '', percentual: '', prolabore_mensal: '', regras: '' });
  const [saving, setSaving] = useState(false);
  const { userId } = useUser();

  const [form, setForm] = useState({ tipo: 'receita' as FinanceiroTipo, categoria: '', valor: '', data: new Date().toISOString().split('T')[0], status: 'pendente' as FinanceiroStatus });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    const [lancRes, cobRes, socRes] = await Promise.all([
      supabase.from('financeiro').select('*').order('data', { ascending: false }),
      supabase.from('cobrancas').select('*').order('vencimento'),
      supabase.from('socios').select('*'),
    ]);
    if (lancRes.error) toast.error('Erro ao carregar financeiro');
    else setLancamentos(lancRes.data ?? []);
    if (cobRes.data) setCobrancas(cobRes.data);
    if (socRes.data) setSocios(socRes.data);
    setLoading(false);
  }

  // ── DRE computed from lancamentos ──
  const receitas = lancamentos.filter(l => l.tipo === 'receita');
  const despesas = lancamentos.filter(l => l.tipo === 'despesa');
  const receita_recorrente = receitas.filter(l => (l.categoria ?? '').toLowerCase().includes('assinatura')).reduce((s, l) => s + l.valor, 0);
  const receita_projetos   = receitas.filter(l => !(l.categoria ?? '').toLowerCase().includes('assinatura')).reduce((s, l) => s + l.valor, 0);
  const receita_total      = receita_recorrente + receita_projetos;
  const custos_fixos       = despesas.filter(l => ['salários', 'pró-labore', 'infraestrutura', 'aluguel'].some(k => (l.categoria ?? '').toLowerCase().includes(k))).reduce((s, l) => s + l.valor, 0);
  const custos_variaveis   = despesas.filter(l => !['salários', 'pró-labore', 'infraestrutura', 'aluguel'].some(k => (l.categoria ?? '').toLowerCase().includes(k))).reduce((s, l) => s + l.valor, 0);
  const lucro_bruto        = receita_total - custos_fixos - custos_variaveis;
  const ponto_equilibrio   = custos_fixos + custos_variaveis;

  // ── 12-month projection from real data ──
  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const projectionData = MONTHS.map((month, idx) => {
    const m = idx + 1;
    const recs = lancamentos.filter(l => l.tipo === 'receita' && new Date(l.data).getMonth() === idx);
    const desps = lancamentos.filter(l => l.tipo === 'despesa' && new Date(l.data).getMonth() === idx);
    return {
      month,
      receita: recs.reduce((s, l) => s + l.valor, 0),
      custos:  desps.reduce((s, l) => s + l.valor, 0),
    };
  });

  async function handleCreateLancamento() {
    if (!form.categoria || !form.valor) { toast.error('Categoria e valor são obrigatórios'); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('financeiro').insert({
      tipo: form.tipo, categoria: form.categoria, valor: parseFloat(form.valor),
      data: form.data, status: form.status, created_by: userId,
    }).select().single();
    setSaving(false);
    if (error) { toast.error('Erro ao criar lançamento: ' + error.message); return; }
    if (data) setLancamentos(prev => [data, ...prev]);
    toast.success('Lançamento criado!');
    setShowDialog(false);
    setForm({ tipo: 'receita', categoria: '', valor: '', data: new Date().toISOString().split('T')[0], status: 'pendente' });
  }

  function handleOpenSocioDialog(socio?: Socio) {
    if (socio) {
      setEditingSocio(socio);
      setSocioForm({
        nome: socio.nome,
        percentual: socio.percentual.toString(),
        prolabore_mensal: (socio.prolabore_mensal || 0).toString(),
        regras: socio.regras || ''
      });
    } else {
      setEditingSocio(null);
      setSocioForm({ nome: '', percentual: '', prolabore_mensal: '', regras: '' });
    }
    setShowSocioDialog(true);
  }

  async function handleSaveSocio() {
    if (!socioForm.nome || !socioForm.percentual) { toast.error('Nome e percentual são obrigatórios'); return; }
    const perc = parseFloat(socioForm.percentual);
    if (perc <= 0 || perc > 100) { toast.error('Percentual deve ser entre 0 e 100'); return; }
    
    setSaving(true);
    const supabase = createClient();
    
    const payload = {
      nome: socioForm.nome,
      percentual: perc,
      prolabore_mensal: parseFloat(socioForm.prolabore_mensal) || 0,
      regras: socioForm.regras || null
    };

    if (editingSocio) {
      const { error } = await supabase.from('socios').update(payload).eq('id', editingSocio.id);
      setSaving(false);
      if (error) { toast.error('Erro ao editar sócio: ' + error.message); return; }
      toast.success('Sócio atualizado!');
    } else {
      const { error } = await supabase.from('socios').insert(payload);
      setSaving(false);
      if (error) { toast.error('Erro ao adicionar sócio: ' + error.message); return; }
      toast.success('Sócio adicionado!');
    }
    
    fetchAll();
    setShowSocioDialog(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Financeiro" subtitle="DRE, Projeções e Cobranças" />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <StatCard title="Receita Recorrente" value={formatCurrency(receita_recorrente)} change={undefined} icon={TrendingUp}   color="green" />
        <StatCard title="Receita Projetos"   value={formatCurrency(receita_projetos)}   icon={DollarSign}                       color="green" />
        <StatCard title="Custos Totais"      value={formatCurrency(custos_fixos + custos_variaveis)} icon={TrendingDown}        color="green" />
        <StatCard title="Lucro Bruto"        value={formatCurrency(lucro_bruto)}         icon={ArrowUpRight}                    color="green" />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 42, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabBtn>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'lancamentos' && (
            <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowDialog(true)}>
              <Plus style={{ width: 11, height: 11 }} /> Nova Entrada
            </Button>
          )}
          {tab === 'socios' && (
            <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => handleOpenSocioDialog()}>
              <Plus style={{ width: 11, height: 11 }} /> Novo Sócio
            </Button>
          )}
        </div>
      </div>

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} className="page-content">

          {/* DRE */}
          {tab === 'dre' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Demonstrativo de Resultados</span>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Receita Recorrente (MRR)', value: receita_recorrente, color: '#00FF57', bg: 'rgba(0,255,87,0.06)', border: 'rgba(0,255,87,0.15)' },
                  { label: 'Receita de Projetos',       value: receita_projetos,   color: '#4ade80', bg: 'rgba(0,255,87,0.03)', border: 'rgba(0,255,87,0.1)' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: row.bg, border: `1px solid ${row.border}`, borderRadius: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(row.value)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,255,87,0.04)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Receita Total</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(receita_total)}</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                {[
                  { label: '(-) Custos Fixos',     value: custos_fixos,     color: '#f87171', bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.1)' },
                  { label: '(-) Custos Variáveis', value: custos_variaveis, color: '#fca5a5', bg: 'rgba(239,68,68,0.03)', border: 'rgba(239,68,68,0.08)' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: row.bg, border: `1px solid ${row.border}`, borderRadius: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(row.value)}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(0,255,87,0.08)', border: '1px solid rgba(0,255,87,0.2)', borderRadius: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Lucro Bruto</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: lucro_bruto >= 0 ? '#00FF57' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(lucro_bruto)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Ponto de Equilíbrio</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(ponto_equilibrio)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Projeção */}
          {tab === 'projecao' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Receita vs Custos por Mês</span>
              </div>
              <div style={{ padding: '16px' }}>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={projectionData} margin={{ left: -10, right: 4, top: 4 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,255,87,0.06)" vertical={false} />
                    <XAxis dataKey="month" stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10.5 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(0,255,87,0.1)', strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="receita" stroke="#00FF57" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#00FF57', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="custos"  stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  {[{ color: '#00FF57', label: 'Receita', dash: false }, { color: '#f87171', label: 'Custos', dash: true }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke={l.color} strokeWidth={l.dash ? 1.5 : 2} strokeDasharray={l.dash ? '4 2' : undefined} /></svg>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lançamentos */}
          {tab === 'lancamentos' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: LANC_COLS, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
                {LANC_HEADERS.map(h => <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>)}
              </div>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                : lancamentos.map((f, i) => (
                  <div key={f.id}
                    style={{ display: 'grid', gridTemplateColumns: LANC_COLS, alignItems: 'center', padding: '9px 16px', borderBottom: i < lancamentos.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <span><Badge variant={f.tipo === 'receita' ? 'success' : 'destructive'} style={{ fontSize: 10 }}>{f.tipo}</Badge></span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{f.categoria ?? '—'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: f.tipo === 'receita' ? '#00FF57' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                      {f.tipo === 'despesa' ? '-' : ''}{formatCurrency(f.valor)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(f.data)}</span>
                    <span><Badge variant={f.status === 'pago' ? 'success' : 'warning'} style={{ fontSize: 10 }}>{f.status}</Badge></span>
                  </div>
                ))
              }
              {!loading && lancamentos.length === 0 && (
                <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum lançamento ainda.</p>
              )}
            </div>
          )}

          {/* Cobranças */}
          {tab === 'cobrancas' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Cobranças</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: COB_COLS, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
                {COB_HEADERS.map(h => <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>)}
              </div>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                : cobrancas.map((c, i) => (
                  <div key={c.id}
                    style={{ display: 'grid', gridTemplateColumns: COB_COLS, alignItems: 'center', padding: '9px 16px', borderBottom: i < cobrancas.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.contrato_id ? `Contrato #${c.contrato_id.slice(0, 8)}` : '—'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(c.vencimento)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#00FF57', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(c.valor)}</span>
                    <span><Badge variant={c.status === 'pago' ? 'success' : c.status === 'atrasado' ? 'destructive' : 'warning'} style={{ fontSize: 10 }}>{c.status}</Badge></span>
                    <span>
                      {c.status === 'aberto' && <Button variant="outline" size="sm" style={{ height: 26, fontSize: 11 }}>Gerar Boleto</Button>}
                    </span>
                  </div>
                ))
              }
              {!loading && cobrancas.length === 0 && (
                <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhuma cobrança cadastrada.</p>
              )}
            </div>
          )}

          {/* Sócios */}
          {tab === 'socios' && (
            socios.length === 0 ? (
              <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum sócio cadastrado.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {socios.map((s, i) => (
                  <div key={s.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Users style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{s.nome}</span>
                      </div>
                      <Button variant="ghost" size="icon" style={{ width: 24, height: 24, color: 'var(--text-muted)' }} onClick={() => handleOpenSocioDialog(s)}>
                        <Pencil style={{ width: 12, height: 12 }} />
                      </Button>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Participação',       value: `${s.percentual}%`,                                  color: 'var(--text-primary)' },
                        { label: 'Pró-labore',          value: formatCurrency(s.prolabore_mensal ?? 0),              color: '#00FF57' },
                        { label: 'Dist. Lucros (mês)',  value: formatCurrency(lucro_bruto * s.percentual / 100),    color: '#00FF57' },
                      ].map((row, j) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </ScrollArea>

      {/* Nova entrada dialog */}
      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) setForm({ tipo: 'receita', categoria: '', valor: '', data: new Date().toISOString().split('T')[0], status: 'pendente' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
            <DialogDescription>Registre uma receita ou despesa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as FinanceiroTipo }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as FinanceiroStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Input placeholder="Ex: Assinatura Core, Salários..." value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" placeholder="0" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateLancamento} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sócio Dialog */}
      <Dialog open={showSocioDialog} onOpenChange={setShowSocioDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSocio ? 'Editar Sócio' : 'Novo Sócio'}</DialogTitle>
            <DialogDescription>{editingSocio ? 'Altere os dados informados do sócio.' : 'Cadastre um novo sócio.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Ex: João Silva" value={socioForm.nome} onChange={e => setSocioForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Percentual (%) *</Label>
                <Input type="number" placeholder="Ex: 33.3" value={socioForm.percentual} onChange={e => setSocioForm(p => ({ ...p, percentual: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Pró-labore Mensal (R$)</Label>
                <Input type="number" placeholder="Ex: 5000" value={socioForm.prolabore_mensal} onChange={e => setSocioForm(p => ({ ...p, prolabore_mensal: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowSocioDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveSocio} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
