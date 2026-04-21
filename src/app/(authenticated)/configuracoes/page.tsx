'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Target, Clock, Shield, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const TABS = [
  { key: 'metas',     label: 'Metas' },
  { key: 'sla',       label: 'SLAs' },
  { key: 'politicas', label: 'Políticas' },
  { key: 'geral',     label: 'Geral' },
];

type Settings = Record<string, string>;

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 28, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
        cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
        border: active ? '1px solid rgba(0,255,87,0.28)' : '1px solid transparent',
        background: active ? 'rgba(0,255,87,0.1)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: active ? '#00FF57' : hovered ? 'var(--text-primary)' : 'var(--text-muted)',
      }}>
      {children}
    </button>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ style?: React.CSSProperties }>; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />}
          {title}
        </span>
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;
}

function Field({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div style={{ gridColumn: span2 ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</Label>
      {children}
    </div>
  );
}

function PolicyBlock({ items }: { items: string[] }) {
  return (
    <div style={{ background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#00FF57', minWidth: 16, marginTop: 1 }}>{i + 1}.</span>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 8px' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState('metas');
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('configuracoes').select('chave, valor').then(({ data }) => {
      if (data) {
        const map: Settings = {};
        data.forEach(row => { if (row.chave) map[row.chave] = row.valor ?? ''; });
        setSettings(map);
      }
    });
  }, []);

  function val(key: string, fallback = '') {
    return settings[key] ?? fallback;
  }

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function save(keys: string[]) {
    setSaving(true);
    const supabase = createClient();
    const rows = keys.map(chave => ({ chave, valor: settings[chave] ?? '' }));
    const { error } = await supabase.from('configuracoes').upsert(rows, { onConflict: 'chave' });
    setSaving(false);
    if (error) toast.error('Erro ao salvar: ' + error.message);
    else toast.success('Configurações salvas!');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Configurações" subtitle="Metas, SLAs e Políticas" />

      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 42, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0, gap: 4 }}>
        {TABS.map(t => <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabBtn>)}
      </div>

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} className="page-content">

          {/* Metas */}
          {tab === 'metas' && (
            <SectionCard title="Metas Semanais" icon={Target}>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14 }}>Defina metas de prospecção e reuniões por colaborador.</p>
              <FieldGrid>
                <Field label="Novos Contatos por Semana">
                  <Input type="number" value={val('meta_novos_contatos', '30')} onChange={e => set('meta_novos_contatos', e.target.value)} />
                </Field>
                <Field label="Reuniões Agendadas por Semana">
                  <Input type="number" value={val('meta_reunioes', '5')} onChange={e => set('meta_reunioes', e.target.value)} />
                </Field>
                <Field label="Meta de Revenue Mensal (R$)">
                  <Input type="number" value={val('meta_revenue', '50000')} onChange={e => set('meta_revenue', e.target.value)} />
                </Field>
                <Field label="Taxa de Conversão Alvo (%)">
                  <Input type="number" value={val('meta_conversao', '25')} onChange={e => set('meta_conversao', e.target.value)} />
                </Field>
              </FieldGrid>
              <Button
                disabled={saving}
                style={{ marginTop: 18, gap: 6 }}
                onClick={() => save(['meta_novos_contatos', 'meta_reunioes', 'meta_revenue', 'meta_conversao'])}
              >
                <Save style={{ width: 13, height: 13 }} /> {saving ? 'Salvando…' : 'Salvar Metas'}
              </Button>
            </SectionCard>
          )}

          {/* SLAs */}
          {tab === 'sla' && (
            <SectionCard title="SLAs de Follow-up" icon={Clock}>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14 }}>Configure os tempos de resposta e follow-up automáticos.</p>
              <FieldGrid>
                <Field label="Dias para enviar proposta após reunião">
                  <Input type="number" value={val('sla_proposta_dias', '2')} onChange={e => set('sla_proposta_dias', e.target.value)} />
                </Field>
                <Field label="Quantidade de follow-ups">
                  <Input type="number" value={val('sla_followups', '3')} onChange={e => set('sla_followups', e.target.value)} />
                </Field>
                <Field label="Intervalo entre follow-ups (dias)" span2>
                  <Input type="number" value={val('sla_intervalo', '3')} onChange={e => set('sla_intervalo', e.target.value)} />
                </Field>
              </FieldGrid>
              <SectionDivider label="SLA de Bugs" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { label: 'Crítico (horas)', key: 'sla_critico_h', def: '4' },
                  { label: 'Alto (horas)',    key: 'sla_alto_h',    def: '24' },
                  { label: 'Médio (horas)',   key: 'sla_medio_h',   def: '48' },
                  { label: 'Baixo (horas)',   key: 'sla_baixo_h',   def: '72' },
                ].map(f => (
                  <Field key={f.key} label={f.label}>
                    <Input type="number" value={val(f.key, f.def)} onChange={e => set(f.key, e.target.value)} />
                  </Field>
                ))}
              </div>
              <Button
                disabled={saving}
                style={{ marginTop: 18, gap: 6 }}
                onClick={() => save(['sla_proposta_dias', 'sla_followups', 'sla_intervalo', 'sla_critico_h', 'sla_alto_h', 'sla_medio_h', 'sla_baixo_h'])}
              >
                <Save style={{ width: 13, height: 13 }} /> {saving ? 'Salvando…' : 'Salvar SLAs'}
              </Button>
            </SectionCard>
          )}

          {/* Políticas */}
          {tab === 'politicas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionCard title="Política de Reajuste">
                <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 12 }}>Regras de reajuste anual dos contratos.</p>
                <PolicyBlock items={[
                  'Reajuste anual baseado no IGPM ou IPCA (o maior dos dois).',
                  'Comunicação ao cliente com 30 dias de antecedência.',
                  'Desconto de fidelidade: 5% para clientes com mais de 12 meses.',
                ]} />
                <Button variant="outline" style={{ marginTop: 14, gap: 6 }}>
                  <Settings style={{ width: 13, height: 13 }} /> Editar Política
                </Button>
              </SectionCard>

              <SectionCard title="Política de Inadimplência">
                <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 12 }}>Regras para tratamento de pagamentos atrasados.</p>
                <PolicyBlock items={[
                  'Tolerância de 5 dias úteis após vencimento.',
                  'Após 5 dias: notificação automática por e-mail.',
                  'Após 15 dias: juros de 2% + correção monetária.',
                  'Após 30 dias: suspensão do acesso à plataforma.',
                  'Após 60 dias: cancelamento do contrato e cobrança judicial.',
                ]} />
                <Button variant="outline" style={{ marginTop: 14, gap: 6 }}>
                  <Settings style={{ width: 13, height: 13 }} /> Editar Política
                </Button>
              </SectionCard>
            </div>
          )}

          {/* Geral */}
          {tab === 'geral' && (
            <SectionCard title="Configurações Gerais" icon={Shield}>
              <FieldGrid>
                <Field label="Nome da Empresa">
                  <Input value={val('empresa_nome', 'VAMOOS')} onChange={e => set('empresa_nome', e.target.value)} />
                </Field>
                <Field label="E-mail Principal">
                  <Input type="email" value={val('empresa_email', 'contato@vamoos.com.br')} onChange={e => set('empresa_email', e.target.value)} />
                </Field>
                <Field label="Fuso Horário">
                  <Input value={val('empresa_timezone', 'America/Sao_Paulo')} onChange={e => set('empresa_timezone', e.target.value)} />
                </Field>
                <Field label="Moeda">
                  <Input value={val('empresa_moeda', 'BRL')} onChange={e => set('empresa_moeda', e.target.value)} />
                </Field>
              </FieldGrid>
              <Button
                disabled={saving}
                style={{ marginTop: 18, gap: 6 }}
                onClick={() => save(['empresa_nome', 'empresa_email', 'empresa_timezone', 'empresa_moeda'])}
              >
                <Save style={{ width: 13, height: 13 }} /> {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </SectionCard>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}
