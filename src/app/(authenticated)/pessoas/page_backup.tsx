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
import { Plus, Edit2, Heart, Calendar, Crown, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Cargo, Prestador, Ritual, PrestadorStatus } from '@/types/database';
import { SkeletonRow } from '@/components/shared/skeleton';
import { useUser } from '@/contexts/user-context';
import { formatDateTime } from '@/lib/utils';

const TABS = [
  { key: 'organograma', label: 'Organograma' },
  { key: 'freelancers', label: 'Freelancers' },
  { key: 'valores',     label: 'Valores' },
  { key: 'rituais',     label: 'Rituais' },
];

// Static company values — no DB table for this
const VALORES = [
  { title: 'Execução > Perfeição',          desc: 'Preferimos fazer e iterar do que planejar indefinidamente.' },
  { title: 'Transparência Radical',          desc: 'Compartilhamos números, desafios e decisões abertamente.' },
  { title: 'Obsessão pelo Cliente',          desc: 'Cada decisão deve gerar valor real para quem nos contrata.' },
  { title: 'Autonomia com Responsabilidade', desc: 'Confiamos nas pessoas e esperamos resultados mensuráveis.' },
  { title: 'Crescimento Contínuo',           desc: 'Investimos em aprendizado e nos desafiamos constantemente.' },
  { title: 'Data-Driven',                    desc: 'Decisões baseadas em dados, não em achismos.' },
];

const PRES_COLS = '1fr 1.5fr 80px 50px';
const PRES_HEADERS = ['Nome', 'Especialidade', 'Status', 'Ação'];

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ height: 28, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap', border: active ? '1px solid rgba(0,255,87,0.28)' : '1px solid transparent', background: active ? 'rgba(0,255,87,0.1)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent', color: active ? '#00FF57' : hovered ? 'var(--text-primary)' : 'var(--text-muted)' }}>
      {children}
    </button>
  );
}

export default function PessoasPage() {
  const [tab, setTab] = useState('organograma');

  // Organograma
  const [cargos, setCargos]       = useState<Cargo[]>([]);
  const [cargosLoading, setCargosLoading] = useState(false);

  // Freelancers
  const [prestadores, setPrestadores]   = useState<Prestador[]>([]);
  const [presLoading, setPresLoading]   = useState(false);
  const [showPresDialog, setShowPresDialog] = useState(false);
  const [savingPres, setSavingPres]     = useState(false);
  const [presForm, setPresForm] = useState({ nome: '', especialidade: '', status: 'ativo' as PrestadorStatus });

  // Rituais
  const [rituais, setRituais]           = useState<Ritual[]>([]);
  const [rituaisLoading, setRituaisLoading] = useState(false);

  const { userId } = useUser();

  useEffect(() => {
    if (tab === 'organograma') fetchCargos();
    if (tab === 'freelancers') fetchPrestadores();
    if (tab === 'rituais')     fetchRituais();
  }, [tab]);

  async function fetchCargos() {
    setCargosLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('cargos').select('*').order('created_at');
    setCargos((data ?? []) as Cargo[]);
    setCargosLoading(false);
  }

  async function fetchPrestadores() {
    setPresLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('prestadores').select('*').order('nome');
    setPrestadores((data ?? []) as Prestador[]);
    setPresLoading(false);
  }

  async function fetchRituais() {
    setRituaisLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('rituais').select('*').order('data_hora', { ascending: true });
    setRituais((data ?? []) as Ritual[]);
    setRituaisLoading(false);
  }

  async function handleCreatePrestador() {
    if (!presForm.nome) { toast.error('Nome é obrigatório'); return; }
    setSavingPres(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('prestadores')
      .insert({ nome: presForm.nome, especialidade: presForm.especialidade || null, status: presForm.status, created_by: userId })
      .select().single();
    setSavingPres(false);
    if (error) { toast.error('Erro ao adicionar prestador: ' + error.message); return; }
    if (data) setPrestadores(prev => [...prev, data as Prestador]);
    toast.success('Prestador adicionado!');
    setShowPresDialog(false);
    setPresForm({ nome: '', especialidade: '', status: 'ativo' });
  }

  // Build org tree: top-level (no superior) + their children
  const topLevel   = cargos.filter(c => !c.superior_id);
  const childrenOf = (id: string) => cargos.filter(c => c.superior_id === id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Pessoas e Cultura" subtitle="Organograma, Freelancers e Valores" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 42, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabBtn>)}
        </div>
        {tab === 'freelancers' && (
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowPresDialog(true)}>
            <Plus style={{ width: 11, height: 11 }} /> Novo Prestador
          </Button>
        )}
      </div>

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} className="page-content">

          {/* Organograma */}
          {tab === 'organograma' && (
            cargosLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, height: 140, opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))
            ) : topLevel.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum cargo cadastrado.</p>
            ) : topLevel.map(leader => (
              <div key={leader.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,255,87,0.04)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(0,255,87,0.12)', border: '1px solid rgba(0,255,87,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00FF57', flexShrink: 0 }}>
                    <Crown style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{leader.nome}</p>
                    {leader.responsabilidades && <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{leader.responsabilidades}</p>}
                  </div>
                </div>
                {childrenOf(leader.id).length > 0 && (
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {childrenOf(leader.id).map(sub => (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 28, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: '50%', width: 20, height: 1, background: 'var(--border)' }} />
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(0,255,87,0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', flexShrink: 0 }}>
                          <User style={{ width: 14, height: 14 }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>{sub.nome}</p>
                          {sub.responsabilidades && <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{sub.responsabilidades}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Freelancers */}
          {tab === 'freelancers' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: PRES_COLS, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
                {PRES_HEADERS.map(h => (
                  <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {presLoading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                : prestadores.length === 0
                  ? <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum prestador cadastrado.</p>
                  : prestadores.map((p, i) => (
                    <div key={p.id}
                      style={{ display: 'grid', gridTemplateColumns: PRES_COLS, alignItems: 'center', padding: '9px 16px', borderBottom: i < prestadores.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{p.nome}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.especialidade ?? '—'}</span>
                      <span><Badge variant={p.status === 'ativo' ? 'success' : 'secondary'} style={{ fontSize: 10 }}>{p.status}</Badge></span>
                      <button
                        style={{ width: 26, height: 26, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.06)'; (e.currentTarget as HTMLElement).style.color = '#00FF57'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'; }}>
                        <Edit2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  ))
              }
            </div>
          )}

          {/* Valores */}
          {tab === 'valores' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Heart style={{ width: 13, height: 13, color: '#f87171' }} /> Valores e Cultura VAMOOS
                </span>
              </div>
              <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {VALORES.map((v, i) => (
                  <div key={i}
                    style={{ background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 7, padding: '12px 14px', transition: 'border-color 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,87,0.2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{v.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rituais */}
          {tab === 'rituais' && (
            rituaisLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, height: 72, opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))
              : rituais.length === 0
                ? <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum ritual cadastrado.</p>
                : rituais.map((r) => (
                  <div key={r.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,255,87,0.08)', border: '1px solid rgba(0,255,87,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00FF57', flexShrink: 0 }}>
                        <Calendar style={{ width: 15, height: 15 }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.tipo}</p>
                        {r.pauta && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.pauta}</p>}
                      </div>
                    </div>
                    {r.data_hora && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{formatDateTime(r.data_hora)}</p>
                      </div>
                    )}
                  </div>
                ))
          )}

        </div>
      </ScrollArea>

      {/* New Prestador Dialog */}
      <Dialog open={showPresDialog} onOpenChange={open => { setShowPresDialog(open); if (!open) setPresForm({ nome: '', especialidade: '', status: 'ativo' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Prestador</DialogTitle>
            <DialogDescription>Adicione um novo prestador de serviços.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Nome completo" value={presForm.nome} onChange={e => setPresForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Input placeholder="Ex: Desenvolvimento Full-Stack" value={presForm.especialidade} onChange={e => setPresForm(p => ({ ...p, especialidade: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={presForm.status} onValueChange={v => setPresForm(p => ({ ...p, status: v as PrestadorStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowPresDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreatePrestador} disabled={savingPres}>{savingPres ? 'Salvando…' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
