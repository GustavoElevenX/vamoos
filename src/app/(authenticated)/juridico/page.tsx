'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Scale, FileText, Shield, Building2, Upload, Edit2, Eye, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Empresa } from '@/types/database';

const TABS = [
  { key: 'documentos', label: 'Documentos' },
  { key: 'empresa',    label: 'Dados da Empresa' },
  { key: 'lgpd',       label: 'LGPD' },
  { key: 'pi',         label: 'Prop. Intelectual' },
];

const documents = [
  {
    icon: FileText, iconColor: '#00FF57', iconBg: 'rgba(0,255,87,0.1)',
    title: 'Contrato Societário', subtitle: 'Vigência: 01/01/2024 - Indefinido', badge: { label: 'Vigente', variant: 'success' as const },
    actions: [{ icon: Eye, label: 'Visualizar' }, { icon: Upload, label: 'Atualizar' }],
  },
  {
    icon: Shield, iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.1)',
    title: 'Política de Privacidade', subtitle: 'Versão 2.0 — Aprovada', badge: { label: 'Aprovada', variant: 'success' as const },
    actions: [{ icon: Edit2, label: 'Editar' }, { icon: ExternalLink, label: 'Página Pública' }],
  },
  {
    icon: Scale, iconColor: '#fbbf24', iconBg: 'rgba(245,158,11,0.1)',
    title: 'Termos de Uso', subtitle: 'Versão 1.5 — Aprovada', badge: { label: 'Aprovada', variant: 'success' as const },
    actions: [{ icon: Edit2, label: 'Editar' }, { icon: ExternalLink, label: 'Página Pública' }],
  },
  {
    icon: FileText, iconColor: '#4ade80', iconBg: 'rgba(0,255,87,0.08)',
    title: 'Template de Contrato PJ', subtitle: 'Usado para novos clientes', badge: { label: 'Template', variant: 'info' as const },
    actions: [{ icon: Edit2, label: 'Editar' }],
  },
];

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ height: 28, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap', border: active ? '1px solid rgba(0,255,87,0.28)' : '1px solid transparent', background: active ? 'rgba(0,255,87,0.1)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent', color: active ? '#00FF57' : hovered ? 'var(--text-primary)' : 'var(--text-muted)' }}>
      {children}
    </button>
  );
}

// ── Empresa tab ───────────────────────────────────────────────────────────────
function EmpresaTab() {
  const [empresa, setEmpresa]   = useState<Empresa | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({ razao_social: '', cnpj: '', regime_tributario: '', cnae: '', endereco: '', inscricao_municipal: '' });

  useEffect(() => {
    const supabase = createClient();
    supabase.from('empresa').select('*').maybeSingle().then(({ data }) => {
      setEmpresa(data as Empresa | null);
      if (data) setForm({
        razao_social:      data.razao_social      ?? '',
        cnpj:              data.cnpj              ?? '',
        regime_tributario: data.regime_tributario  ?? '',
        cnae:              data.cnae              ?? '',
        endereco:          data.endereco          ?? '',
        inscricao_municipal: data.inscricao_municipal ?? '',
      });
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      razao_social:      form.razao_social      || null,
      cnpj:              form.cnpj              || null,
      regime_tributario: form.regime_tributario  || null,
      cnae:              form.cnae              || null,
      endereco:          form.endereco          || null,
      inscricao_municipal: form.inscricao_municipal || null,
    };

    if (empresa) {
      const { error } = await supabase.from('empresa').update(payload).eq('id', empresa.id);
      if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return; }
      setEmpresa(prev => prev ? { ...prev, ...payload } : prev);
    } else {
      const { data, error } = await supabase.from('empresa').insert(payload).select().single();
      if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return; }
      setEmpresa(data as Empresa);
    }
    setSaving(false);
    setEditing(false);
    toast.success('Dados salvos!');
  }

  const fields = [
    { label: 'Razão Social',        key: 'razao_social'       as const },
    { label: 'CNPJ',                key: 'cnpj'               as const },
    { label: 'Regime Tributário',   key: 'regime_tributario'  as const },
    { label: 'CNAE',                key: 'cnae'               as const },
    { label: 'Endereço',            key: 'endereco'           as const },
    { label: 'Inscrição Municipal', key: 'inscricao_municipal' as const },
  ];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Building2 style={{ width: 13, height: 13, color: 'var(--text-muted)' }} /> Dados da Empresa
        </span>
        <Button variant="outline" size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => { setForm({ razao_social: empresa?.razao_social ?? '', cnpj: empresa?.cnpj ?? '', regime_tributario: empresa?.regime_tributario ?? '', cnae: empresa?.cnae ?? '', endereco: empresa?.endereco ?? '', inscricao_municipal: empresa?.inscricao_municipal ?? '' }); setEditing(true); }}>
          <Edit2 style={{ width: 11, height: 11 }} /> Editar
        </Button>
      </div>
      {loading ? (
        <div style={{ padding: '20px 16px', color: 'var(--text-faint)', fontSize: 12 }}>Carregando…</div>
      ) : (
        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {fields.map(f => (
            <div key={f.key} style={{ background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{f.label}</p>
              <p style={{ fontSize: 12.5, color: empresa?.[f.key] ? 'var(--text-secondary)' : 'var(--text-faint)', fontStyle: empresa?.[f.key] ? 'normal' : 'italic' }}>
                {empresa?.[f.key] ?? 'Não preenchido'}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Dados da Empresa</DialogTitle>
            <DialogDescription>Atualize as informações societárias.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {fields.map(f => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                <Input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function JuridicoPage() {
  const [tab, setTab] = useState('documentos');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Jurídico" subtitle="Documentos Societários e LGPD" />

      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 42, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0, gap: 4 }}>
        {TABS.map(t => <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabBtn>)}
      </div>

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} className="page-content">

          {/* Documentos */}
          {tab === 'documentos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {documents.map((doc, i) => {
                const Icon = doc.icon;
                return (
                  <div key={i}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,87,0.2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: doc.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: doc.iconColor, flexShrink: 0 }}>
                        <Icon style={{ width: 16, height: 16 }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{doc.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{doc.subtitle}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
                      <Badge variant={doc.badge.variant} style={{ fontSize: 10 }}>{doc.badge.label}</Badge>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {doc.actions.map((action, j) => {
                          const ActionIcon = action.icon;
                          return (
                            <Button key={j} variant="outline" size="sm" style={{ height: 28, fontSize: 11, gap: 4 }}>
                              <ActionIcon style={{ width: 11, height: 11 }} />{action.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empresa */}
          {tab === 'empresa' && <EmpresaTab />}

          {/* LGPD */}
          {tab === 'lgpd' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield style={{ width: 13, height: 13, color: 'var(--text-muted)' }} /> Política de Privacidade e Termos de Uso (LGPD)
                </span>
                <Button variant="outline" size="sm" style={{ height: 28, fontSize: 11 }}>
                  <Edit2 style={{ width: 11, height: 11 }} /> Editar Documento
                </Button>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 18px', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>POLÍTICA DE PRIVACIDADE — VAMOOS</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      ['1. INTRODUÇÃO', 'A VAMO Tecnologia respeita sua privacidade e se compromete a proteger os dados pessoais que você compartilha conosco.'],
                      ['2. DADOS COLETADOS', 'Coletamos dados pessoais fornecidos diretamente por você: nome, e-mail, telefone, empresa, cargo.'],
                      ['3. FINALIDADE', 'Seus dados são utilizados para: prestação dos serviços contratados, comunicação sobre produtos e atualizações, melhoria da plataforma.'],
                    ].map(([title, body], j) => (
                      <p key={j} style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{title}</strong><br />{body}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PI */}
          {tab === 'pi' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Política de Propriedade Intelectual</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Todo código-fonte, design, documentação e materiais produzidos são propriedade exclusiva da VAMOOS.',
                    'Colaboradores e prestadores cedem automaticamente todos os direitos de PI criados durante a prestação de serviços.',
                    'A utilização de ferramentas de terceiros deve ser aprovada pela diretoria com análise de licenciamento.',
                    'Informações confidenciais de clientes são protegidas por NDA e não podem ser reutilizadas.',
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#00FF57', minWidth: 18, marginTop: 1 }}>{i + 1}.</span>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}
