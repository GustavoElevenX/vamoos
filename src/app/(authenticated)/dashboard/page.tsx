'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, Calendar, FileText, DollarSign, TrendingUp, Target } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Lead, Reuniao, EtapaFunil } from '@/types/database';
import { SkeletonRow, SkeletonStatCard } from '@/components/shared/skeleton';

type RecentLead = Pick<Lead, 'id' | 'nome' | 'empresa' | 'etapa_funil' | 'valor_estimado' | 'created_at'>;
type UpcomingMeeting = Reuniao & { leads: { nome: string; empresa: string | null } | null };

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const FUNNEL_ACTIVE: EtapaFunil[] = [
  'Prospecção', 'Reunião agendada', 'Diagnóstico', 'Proposta enviada', 'Negociação',
];

const etapaBadge = (etapa: EtapaFunil): 'success' | 'destructive' | 'info' | 'secondary' => {
  if (etapa === 'Fechado') return 'success';
  if (etapa === 'Perdido') return 'destructive';
  if (etapa === 'Proposta enviada' || etapa === 'Negociação') return 'info';
  return 'secondary';
};

/* ── Shared components ── */
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.dataKey === 'receita' ? 'Receita' : 'Meta'}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

function SectionCard({ title, children, action }: {
  title: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ── Page ── */
export default function DashboardPage() {
  const [loading, setLoading]           = useState(true);
  const [recentLeads, setRecentLeads]   = useState<RecentLead[]>([]);
  const [nextMeetings, setNextMeetings] = useState<UpcomingMeeting[]>([]);
  const [revenueData, setRevenueData]   = useState<Array<{ month: string; receita: number; meta: number }>>([]);
  const [funnelData, setFunnelData]     = useState<Array<{ stage: string; count: number }>>([]);
  const [kpis, setKpis] = useState({ leadsAbertos: 0, reunioesAgendadas: 0, propostasEnviadas: 0, mrr: 0 });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    const today    = new Date().toISOString();
    const yearStart = `${new Date().getFullYear()}-01-01`;

    const [leadsRes, meetingsRes, allLeadsRes, financeiroRes, propostasCountRes, reunioesCountRes, metaRes] =
      await Promise.all([
        supabase.from('leads').select('id, nome, empresa, etapa_funil, valor_estimado, created_at')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('reunioes').select('*, leads(nome, empresa)')
          .eq('status', 'agendada').gte('data', today).order('data').limit(5),
        supabase.from('leads').select('etapa_funil')
          .not('etapa_funil', 'eq', 'Fechado').not('etapa_funil', 'eq', 'Perdido'),
        supabase.from('financeiro').select('valor, data')
          .eq('tipo', 'receita').gte('data', yearStart),
        supabase.from('propostas').select('id', { count: 'exact', head: true })
          .eq('status', 'enviada'),
        supabase.from('reunioes').select('id', { count: 'exact', head: true })
          .eq('status', 'agendada'),
        supabase.from('configuracoes').select('valor').eq('chave', 'meta_revenue').maybeSingle(),
      ]);

    if (leadsRes.error) toast.error('Erro ao carregar leads');
    if (leadsRes.data) setRecentLeads(leadsRes.data as RecentLead[]);
    if (meetingsRes.data) setNextMeetings(meetingsRes.data as UpcomingMeeting[]);

    // Funnel counts from active stages
    if (allLeadsRes.data) {
      const counts: Record<string, number> = {};
      allLeadsRes.data.forEach(l => { counts[l.etapa_funil] = (counts[l.etapa_funil] ?? 0) + 1; });
      setFunnelData(FUNNEL_ACTIVE.map(s => ({ stage: s, count: counts[s] ?? 0 })));
    }

    // Revenue chart: aggregate by month (current year)
    const byMonth: number[] = Array(12).fill(0);
    if (financeiroRes.data) {
      financeiroRes.data.forEach(r => {
        const month = new Date(r.data + 'T00:00:00').getMonth();
        byMonth[month] += r.valor ?? 0;
      });
    }
    const metaAnual   = metaRes.data ? parseFloat(metaRes.data.valor ?? '0') : 0;
    const metaMensal  = metaAnual > 0 ? metaAnual / 12 : 0;
    setRevenueData(MONTH_LABELS.map((month, i) => ({ month, receita: byMonth[i], meta: metaMensal })));

    // MRR = current month receitas
    const now = new Date();
    const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const mrr = financeiroRes.data
      ?.filter(r => r.data >= currentMonthStart)
      .reduce((s, r) => s + (r.valor ?? 0), 0) ?? 0;

    setKpis({
      leadsAbertos:      allLeadsRes.data?.length   ?? 0,
      reunioesAgendadas: reunioesCountRes.count      ?? 0,
      propostasEnviadas: propostasCountRes.count     ?? 0,
      mrr,
    });
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Dashboard" />

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} className="page-content">

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
            ) : (
              <>
                <StatCard title="Leads em Aberto"    value={String(kpis.leadsAbertos)}      icon={Users}      color="green" />
                <StatCard title="Reuniões Agendadas" value={String(kpis.reunioesAgendadas)} icon={Calendar}   color="green" />
                <StatCard title="Propostas Enviadas" value={String(kpis.propostasEnviadas)} icon={FileText}   color="green" />
                <StatCard title="MRR"                value={formatCurrency(kpis.mrr)}       icon={DollarSign} color="green" />
              </>
            )}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>

            {/* Revenue chart */}
            <SectionCard
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                  Receita vs Meta (YTD)
                </span>
              }
            >
              <div style={{ padding: '12px 16px' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueData} margin={{ left: -10, right: 4, top: 4 }}>
                    <defs>
                      <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#00FF57" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#00FF57" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#00884E" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#00884E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,255,87,0.06)" vertical={false} />
                    <XAxis dataKey="month" stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10.5 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10.5 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v / 1000}k`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(0,255,87,0.1)', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="meta"    stroke="#00884E" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#gM)" dot={false} />
                    <Area type="monotone" dataKey="receita" stroke="#00FF57" strokeWidth={2}   fill="url(#gR)"   dot={false} activeDot={{ r: 3, fill: '#00FF57', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  {[{ color: '#00FF57', label: 'Receita', dash: false }, { color: '#00884E', label: 'Meta', dash: true }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="16" height="2" style={{ flexShrink: 0 }}>
                        {l.dash
                          ? <line x1="0" y1="1" x2="16" y2="1" stroke={l.color} strokeWidth="1.5" strokeDasharray="4 2" />
                          : <line x1="0" y1="1" x2="16" y2="1" stroke={l.color} strokeWidth="2" />}
                      </svg>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Funnel chart */}
            <SectionCard
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                  Funil de Vendas
                </span>
              }
            >
              <div style={{ padding: '12px 16px' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={funnelData} margin={{ left: -10, right: 4, top: 16 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,255,87,0.06)" horizontal={false} />
                    <XAxis dataKey="stage" stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10.5 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', borderRadius: 6, fontSize: 12 }}
                      cursor={{ fill: 'rgba(0,255,87,0.04)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40} label={{ position: 'top', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={`rgba(0,255,87,${0.9 - i * 0.15})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

          </div>

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>

            {/* Recent Leads */}
            <SectionCard
              title="Leads Recentes"
              action={
                <a href="/crm/leads" style={{ fontSize: 11, color: 'var(--accent)', opacity: 0.75 }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}
                >Ver todos →</a>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 110px 80px 85px', padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
                {['Nome', 'Empresa', 'Etapa', 'Valor', 'Data'].map(h => (
                  <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                : recentLeads.length === 0
                  ? <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum lead ainda.</p>
                  : recentLeads.map((l, i) => (
                    <div key={l.id}
                      style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 110px 80px 85px', alignItems: 'center', padding: '9px 16px', borderBottom: i < recentLeads.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                    >
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{l.nome}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.empresa ?? '—'}</span>
                      <span><Badge variant={etapaBadge(l.etapa_funil)} style={{ fontSize: 10 }}>{l.etapa_funil}</Badge></span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#00FF57', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(l.valor_estimado)}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{formatDate(l.created_at)}</span>
                    </div>
                  ))
              }
            </SectionCard>

            {/* Next Meetings */}
            <SectionCard
              title="Próximas Reuniões"
              action={
                <a href="/reunioes" style={{ fontSize: 11, color: 'var(--accent)', opacity: 0.75 }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}
                >Ver todas →</a>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
                {['Nome', 'Empresa', 'Data'].map(h => (
                  <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
                : nextMeetings.length === 0
                  ? <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhuma reunião agendada.</p>
                  : nextMeetings.map((m, i) => (
                    <div key={m.id}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', alignItems: 'center', padding: '9px 16px', borderBottom: i < nextMeetings.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                    >
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{m.leads?.nome ?? '—'}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.leads?.empresa ?? '—'}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{formatDate(m.data)}</span>
                    </div>
                  ))
              }
            </SectionCard>

          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
