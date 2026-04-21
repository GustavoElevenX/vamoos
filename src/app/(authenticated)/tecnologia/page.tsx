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
import { Plus, ExternalLink, Database, Cloud, Shield, ArrowRight, Wrench, BookOpen, Link2, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Ferramenta, Integracao } from '@/types/database';
import { SkeletonRow } from '@/components/shared/skeleton';
import { useUser } from '@/contexts/user-context';

const TABS = [
  { key: 'ferramentas', label: 'Ferramentas' },
  { key: 'wiki',        label: 'Wiki' },
  { key: 'integracoes', label: 'Integrações' },
  { key: 'seguranca',   label: 'Segurança' },
];

const securityPolicies = [
  'Todos os acessos utilizam autenticação 2FA quando disponível.',
  'Senhas gerenciadas via password manager compartilhado.',
  'Código-fonte versionado no GitHub com branch protection.',
  'Dados do banco (Supabase) com backup automático diário.',
  'Acesso RLS (Row Level Security) habilitado em todas as tabelas.',
  'Revisão de acessos realizada mensalmente.',
];

const TOOL_COLS = '1.5fr 1fr 120px 80px';
const TOOL_HEADERS = ['Ferramenta', 'Categoria', 'Compartilhada', 'Link'];

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ height: 28, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap', border: active ? '1px solid rgba(0,255,87,0.28)' : '1px solid transparent', background: active ? 'rgba(0,255,87,0.1)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent', color: active ? '#00FF57' : hovered ? 'var(--text-primary)' : 'var(--text-muted)' }}>
      {children}
    </button>
  );
}

export default function TecnologiaPage() {
  const [tab, setTab] = useState('ferramentas');

  // Ferramentas
  const [ferramentas, setFerramentas]   = useState<Ferramenta[]>([]);
  const [ferLoading, setFerLoading]     = useState(false);
  const [showFerDialog, setShowFerDialog] = useState(false);
  const [savingFer, setSavingFer]       = useState(false);
  const [ferForm, setFerForm] = useState({ nome: '', categoria: '', url: '', conta_compartilhada: 'true' });

  // Integrações
  const [integracoes, setIntegracoes]   = useState<Integracao[]>([]);
  const [intLoading, setIntLoading]     = useState(false);
  const [showIntDialog, setShowIntDialog] = useState(false);
  const [savingInt, setSavingInt]       = useState(false);
  const [intForm, setIntForm] = useState({ origem: '', destino: '', fluxo: '', automacao: '' });

  const { userId } = useUser();

  useEffect(() => {
    if (tab === 'ferramentas') fetchFerramentas();
    if (tab === 'integracoes') fetchIntegracoes();
  }, [tab]);

  async function fetchFerramentas() {
    setFerLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('ferramentas').select('*').order('nome');
    setFerramentas((data ?? []) as Ferramenta[]);
    setFerLoading(false);
  }

  async function fetchIntegracoes() {
    setIntLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('integracoes').select('*').order('created_at');
    setIntegracoes((data ?? []) as Integracao[]);
    setIntLoading(false);
  }

  async function handleCreateFerramenta() {
    if (!ferForm.nome) { toast.error('Nome é obrigatório'); return; }
    setSavingFer(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('ferramentas')
      .insert({ nome: ferForm.nome, categoria: ferForm.categoria || null, url: ferForm.url || null, conta_compartilhada: ferForm.conta_compartilhada === 'true', created_by: userId })
      .select().single();
    setSavingFer(false);
    if (error) { toast.error('Erro ao adicionar ferramenta: ' + error.message); return; }
    if (data) setFerramentas(prev => [...prev, data as Ferramenta]);
    toast.success('Ferramenta adicionada!');
    setShowFerDialog(false);
    setFerForm({ nome: '', categoria: '', url: '', conta_compartilhada: 'true' });
  }

  async function handleCreateIntegracao() {
    if (!intForm.origem || !intForm.destino) { toast.error('Origem e destino são obrigatórios'); return; }
    setSavingInt(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('integracoes')
      .insert({ origem: intForm.origem, destino: intForm.destino, fluxo: intForm.fluxo || null, automacao: intForm.automacao || null, created_by: userId })
      .select().single();
    setSavingInt(false);
    if (error) { toast.error('Erro ao criar integração: ' + error.message); return; }
    if (data) setIntegracoes(prev => [...prev, data as Integracao]);
    toast.success('Integração adicionada!');
    setShowIntDialog(false);
    setIntForm({ origem: '', destino: '', fluxo: '', automacao: '' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Tecnologia" subtitle="Ferramentas, Wiki e Integrações" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 42, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabBtn>)}
        </div>
        {tab === 'ferramentas' && (
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowFerDialog(true)}>
            <Plus style={{ width: 11, height: 11 }} /> Nova Ferramenta
          </Button>
        )}
        {tab === 'integracoes' && (
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowIntDialog(true)}>
            <Plus style={{ width: 11, height: 11 }} /> Nova Integração
          </Button>
        )}
      </div>

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} className="page-content">

          {/* Ferramentas */}
          {tab === 'ferramentas' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: TOOL_COLS, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
                {TOOL_HEADERS.map(h => (
                  <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {ferLoading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                : ferramentas.length === 0
                  ? <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhuma ferramenta cadastrada.</p>
                  : ferramentas.map((f, i) => (
                    <div key={f.id}
                      style={{ display: 'grid', gridTemplateColumns: TOOL_COLS, alignItems: 'center', padding: '9px 16px', borderBottom: i < ferramentas.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,255,87,0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Wrench style={{ width: 12, height: 12, color: 'var(--text-faint)' }} />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{f.nome}</span>
                      </div>
                      <span><Badge variant="outline" style={{ fontSize: 10 }}>{f.categoria ?? '—'}</Badge></span>
                      <span><Badge variant={f.conta_compartilhada ? 'success' : 'secondary'} style={{ fontSize: 10 }}>{f.conta_compartilhada ? 'Sim' : 'Não'}</Badge></span>
                      {f.url ? (
                        <a href={f.url} target="_blank"
                          style={{ fontSize: 11, color: '#00FF57', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.75, transition: 'opacity 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}>
                          <ExternalLink style={{ width: 11, height: 11 }} /> Acessar
                        </a>
                      ) : <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>—</span>}
                    </div>
                  ))
              }
            </div>
          )}

          {/* Wiki */}
          {tab === 'wiki' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <BookOpen style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Wiki VAMOOS</span>
              </div>
              <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <BookOpen style={{ width: 24, height: 24, color: 'var(--text-faint)' }} />
                <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Wiki em construção</p>
                <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Em breve: documentos internos e guias de processo</p>
              </div>
            </div>
          )}

          {/* Integrações */}
          {tab === 'integracoes' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <Link2 style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Integrações entre Ferramentas</span>
              </div>
              {intLoading
                ? <div style={{ padding: '12px 16px' }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={3} />)}</div>
                : integracoes.length === 0
                  ? <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhuma integração cadastrada.</p>
                  : (
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {integracoes.map((int) => (
                        <div key={int.id} style={{ background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 7, padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Badge variant="default" style={{ fontSize: 10 }}>{int.origem}</Badge>
                            <ArrowRight style={{ width: 12, height: 12, color: 'var(--text-faint)' }} />
                            <Badge variant="info" style={{ fontSize: 10 }}>{int.destino}</Badge>
                          </div>
                          {int.fluxo && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{int.fluxo}</p>}
                          {int.automacao && (
                            <p style={{ fontSize: 11, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <RefreshCw style={{ width: 10, height: 10 }} /> {int.automacao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )
              }
            </div>
          )}

          {/* Segurança */}
          {tab === 'seguranca' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <Shield style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Política de Segurança e Backup</span>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {securityPolicies.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#00FF57', minWidth: 18, marginTop: 1 }}>{i + 1}.</span>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <Database style={{ width: 13, height: 13, color: '#00FF57' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Status do Backup</span>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,255,87,0.05)', border: '1px solid rgba(0,255,87,0.15)', borderRadius: 7, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Cloud style={{ width: 16, height: 16, color: '#00FF57' }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Backup automático</p>
                        <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>Supabase — Backup diário completo</p>
                      </div>
                    </div>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      {/* New Ferramenta Dialog */}
      <Dialog open={showFerDialog} onOpenChange={open => { setShowFerDialog(open); if (!open) setFerForm({ nome: '', categoria: '', url: '', conta_compartilhada: 'true' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ferramenta</DialogTitle>
            <DialogDescription>Adicione uma ferramenta ao stack tecnológico.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Supabase" value={ferForm.nome} onChange={e => setFerForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input placeholder="Ex: Database, Design" value={ferForm.categoria} onChange={e => setFerForm(p => ({ ...p, categoria: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Conta Compartilhada</Label>
                <Select value={ferForm.conta_compartilhada} onValueChange={v => setFerForm(p => ({ ...p, conta_compartilhada: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input placeholder="https://..." value={ferForm.url} onChange={e => setFerForm(p => ({ ...p, url: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowFerDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateFerramenta} disabled={savingFer}>{savingFer ? 'Salvando…' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Integração Dialog */}
      <Dialog open={showIntDialog} onOpenChange={open => { setShowIntDialog(open); if (!open) setIntForm({ origem: '', destino: '', fluxo: '', automacao: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Integração</DialogTitle>
            <DialogDescription>Documente uma integração entre ferramentas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origem *</Label>
                <Input placeholder="Ex: VAMOOS Platform" value={intForm.origem} onChange={e => setIntForm(p => ({ ...p, origem: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Input placeholder="Ex: Asaas" value={intForm.destino} onChange={e => setIntForm(p => ({ ...p, destino: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fluxo</Label>
              <Input placeholder="Ex: Cobranças → Boletos/PIX" value={intForm.fluxo} onChange={e => setIntForm(p => ({ ...p, fluxo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Automação</Label>
              <Input placeholder="Ex: Geração automática de boleto" value={intForm.automacao} onChange={e => setIntForm(p => ({ ...p, automacao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowIntDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateIntegracao} disabled={savingInt}>{savingInt ? 'Salvando…' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
