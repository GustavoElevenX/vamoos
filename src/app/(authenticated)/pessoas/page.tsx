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

const VALORES_DEFAULT = [
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
  const [showCargoDialog, setShowCargoDialog] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [cargoForm, setCargoForm] = useState({ nome: '', responsabilidades: '', superior_id: 'none' });
  const [savingCargo, setSavingCargo] = useState(false);

  // Freelancers
  const [prestadores, setPrestadores]   = useState<Prestador[]>([]);
  const [presLoading, setPresLoading]   = useState(false);
  const [showPresDialog, setShowPresDialog] = useState(false);
  const [editingPres, setEditingPres] = useState<Prestador | null>(null);
  const [savingPres, setSavingPres]     = useState(false);
  const [presForm, setPresForm] = useState({ nome: '', especialidade: '', status: 'ativo' as PrestadorStatus });

  // Valores
  const [valores, setValores] = useState<{ title: string; desc: string }[]>(VALORES_DEFAULT);
  const [valoresLoading, setValoresLoading] = useState(false);
  const [showValorDialog, setShowValorDialog] = useState(false);
  const [editingValorIndex, setEditingValorIndex] = useState<number | null>(null);
  const [valorForm, setValorForm] = useState({ title: '', desc: '' });
  const [savingValor, setSavingValor] = useState(false);

  // Rituais
  const [rituais, setRituais]           = useState<Ritual[]>([]);
  const [rituaisLoading, setRituaisLoading] = useState(false);
  const [showRitualDialog, setShowRitualDialog] = useState(false);
  const [editingRitual, setEditingRitual] = useState<Ritual | null>(null);
  const [ritualForm, setRitualForm] = useState({ tipo: '', pauta: '', data_hora: '' });
  const [savingRitual, setSavingRitual] = useState(false);

  const { userId } = useUser();

  useEffect(() => {
    if (tab === 'organograma') fetchCargos();
    if (tab === 'freelancers') fetchPrestadores();
    if (tab === 'rituais')     fetchRituais();
    if (tab === 'valores')     fetchValores();
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

  async function fetchValores() {
    setValoresLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('configuracoes').select('*').eq('chave', 'valores_empresa').single();
    if (data && data.valor) {
      try {
        setValores(JSON.parse(data.valor));
      } catch {
        setValores(VALORES_DEFAULT);
      }
    } else {
      setValores(VALORES_DEFAULT);
    }
    setValoresLoading(false);
  }

  function openCargoDialog(cargo?: Cargo) {
    if (cargo) {
       setEditingCargo(cargo);
       setCargoForm({ nome: cargo.nome, responsabilidades: cargo.responsabilidades || '', superior_id: cargo.superior_id || 'none' });
    } else {
       setEditingCargo(null);
       setCargoForm({ nome: '', responsabilidades: '', superior_id: 'none' });
    }
    setShowCargoDialog(true);
  }

  function openPresDialog(p?: Prestador) {
    if (p) {
       setEditingPres(p);
       setPresForm({ nome: p.nome, especialidade: p.especialidade || '', status: p.status || 'ativo' });
    } else {
       setEditingPres(null);
       setPresForm({ nome: '', especialidade: '', status: 'ativo' });
    }
    setShowPresDialog(true);
  }

  function openRitualDialog(r?: Ritual) {
    if (r) {
       setEditingRitual(r);
       const dt = r.data_hora ? new Date(r.data_hora).toISOString().slice(0, 16) : '';
       setRitualForm({ tipo: r.tipo, pauta: r.pauta || '', data_hora: dt });
    } else {
       setEditingRitual(null);
       setRitualForm({ tipo: '', pauta: '', data_hora: '' });
    }
    setShowRitualDialog(true);
  }

  function openValorDialog(v?: {title: string; desc: string}, index?: number) {
    if (v && index !== undefined) {
      setEditingValorIndex(index);
      setValorForm({ title: v.title, desc: v.desc });
    } else {
      setEditingValorIndex(null);
      setValorForm({ title: '', desc: '' });
    }
    setShowValorDialog(true);
  }

  async function handleSaveCargo() {
    if (!cargoForm.nome) { toast.error('Nome é obrigatório'); return; }
    setSavingCargo(true);
    const supabase = createClient();
    const payload = {
      nome: cargoForm.nome,
      responsabilidades: cargoForm.responsabilidades || null,
      superior_id: cargoForm.superior_id === 'none' ? null : cargoForm.superior_id,
      user_id: userId
    };

    if (editingCargo) {
      const { error } = await supabase.from('cargos').update(payload).eq('id', editingCargo.id);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success('Cargo atualizado!'); setShowCargoDialog(false); fetchCargos(); }
    } else {
      const { error } = await supabase.from('cargos').insert(payload);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success('Cargo adicionado!'); setShowCargoDialog(false); fetchCargos(); }
    }
    setSavingCargo(false);
  }

  async function handleSavePrestador() {
    if (!presForm.nome) { toast.error('Nome é obrigatório'); return; }
    setSavingPres(true);
    const supabase = createClient();
    const payload = {
      nome: presForm.nome,
      especialidade: presForm.especialidade || null,
      status: presForm.status,
      created_by: userId
    };

    if (editingPres) {
      const { error } = await supabase.from('prestadores').update(payload).eq('id', editingPres.id);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success('Prestador atualizado!'); setShowPresDialog(false); fetchPrestadores(); }
    } else {
      const { error } = await supabase.from('prestadores').insert(payload);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success('Prestador adicionado!'); setShowPresDialog(false); fetchPrestadores(); }
    }
    setSavingPres(false);
  }

  async function handleSaveRitual() {
    if (!ritualForm.tipo) { toast.error('Tipo é obrigatório'); return; }
    setSavingRitual(true);
    const supabase = createClient();
    
    // Parse UTC assuming datetime-local is local time
    const data_hora = ritualForm.data_hora ? new Date(ritualForm.data_hora).toISOString() : null;

    const payload = {
      tipo: ritualForm.tipo,
      pauta: ritualForm.pauta || null,
      data_hora,
      created_by: userId
    };

    if (editingRitual) {
      const { error } = await supabase.from('rituais').update(payload).eq('id', editingRitual.id);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success('Ritual atualizado!'); setShowRitualDialog(false); fetchRituais(); }
    } else {
      const { error } = await supabase.from('rituais').insert(payload);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success('Ritual adicionado!'); setShowRitualDialog(false); fetchRituais(); }
    }
    setSavingRitual(false);
  }

  async function handleSaveValor() {
    if (!valorForm.title) { toast.error('Título é obrigatório'); return; }
    setSavingValor(true);
    let newValores = [...valores];
    if (editingValorIndex !== null) {
      newValores[editingValorIndex] = { title: valorForm.title, desc: valorForm.desc };
    } else {
      newValores.push({ title: valorForm.title, desc: valorForm.desc });
    }

    const supabase = createClient();
    const { error } = await supabase.from('configuracoes').upsert(
      { chave: 'valores_empresa', valor: JSON.stringify(newValores), descricao: 'Valores da Empresa' },
      { onConflict: 'chave' }
    );
    
    if (error) {
       toast.error('Erro: ' + error.message);
    } else { 
      toast.success('Valores atualizados!'); 
      setValores(newValores);
      setShowValorDialog(false); 
    }
    setSavingValor(false);
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
        {tab === 'organograma' && (
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => openCargoDialog()}>
            <Plus style={{ width: 11, height: 11 }} /> Novo Cargo
          </Button>
        )}
        {tab === 'freelancers' && (
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => openPresDialog()}>
            <Plus style={{ width: 11, height: 11 }} /> Novo Prestador
          </Button>
        )}
        {tab === 'valores' && (
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => openValorDialog()}>
            <Plus style={{ width: 11, height: 11 }} /> Novo Valor
          </Button>
        )}
        {tab === 'rituais' && (
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => openRitualDialog()}>
            <Plus style={{ width: 11, height: 11 }} /> Novo Ritual
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,255,87,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(0,255,87,0.12)', border: '1px solid rgba(0,255,87,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00FF57', flexShrink: 0 }}>
                      <Crown style={{ width: 20, height: 20 }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{leader.nome}</p>
                      {leader.responsabilidades && <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{leader.responsabilidades}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => openCargoDialog(leader)}
                    style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Edit2 style={{ width: 12, height: 12 }} />
                  </button>
                </div>
                {childrenOf(leader.id).length > 0 && (
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {childrenOf(leader.id).map(sub => (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 28, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: '50%', width: 20, height: 1, background: 'var(--border)' }} />
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(0,255,87,0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', flexShrink: 0 }}>
                          <User style={{ width: 14, height: 14 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>{sub.nome}</p>
                          {sub.responsabilidades && <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{sub.responsabilidades}</p>}
                        </div>
                        <button
                          onClick={() => openCargoDialog(sub)}
                          style={{ width: 24, height: 24, borderRadius: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit2 style={{ width: 11, height: 11 }} />
                        </button>
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
                        onClick={() => openPresDialog(p)}
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
                {valoresLoading ? (
                   Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, height: 70, opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                   ))
                ) : (
                  valores.map((v, i) => (
                    <div key={i}
                      style={{ position: 'relative', background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 7, padding: '12px 14px', transition: 'border-color 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,87,0.2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, paddingRight: 24 }}>{v.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{v.desc}</p>
                      <button
                        onClick={() => openValorDialog(v, i)}
                        style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  ))
                )}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {r.data_hora && (
                        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{formatDateTime(r.data_hora)}</p>
                      )}
                      <button
                        onClick={() => openRitualDialog(r)}
                        style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit2 style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  </div>
                ))
          )}

        </div>
      </ScrollArea>

      {/* Cargo Dialog */}
      <Dialog open={showCargoDialog} onOpenChange={open => { setShowCargoDialog(open); if (!open) setEditingCargo(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCargo ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
            <DialogDescription>{editingCargo ? 'Atualize as informações do cargo.' : 'Adicione um novo cargo ao organograma.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Diretor de Vendas" value={cargoForm.nome} onChange={e => setCargoForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Responsabilidades</Label>
              <Textarea placeholder="Ex: Liderar time, definir metas..." value={cargoForm.responsabilidades} onChange={e => setCargoForm(p => ({ ...p, responsabilidades: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Reporta para (Superior)</Label>
              <Select value={cargoForm.superior_id} onValueChange={v => setCargoForm(p => ({ ...p, superior_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Nível 1 / C-Level)</SelectItem>
                  {cargos.filter(c => c.id !== editingCargo?.id && !c.superior_id).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                  {cargos.filter(c => c.id !== editingCargo?.id && c.superior_id).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCargoDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCargo} disabled={savingCargo}>{savingCargo ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prestador Dialog */}
      <Dialog open={showPresDialog} onOpenChange={open => { setShowPresDialog(open); if (!open) setEditingPres(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPres ? 'Editar Prestador' : 'Novo Prestador'}</DialogTitle>
            <DialogDescription>{editingPres ? 'Atualize os dados do freelancer.' : 'Adicione um novo prestador de serviços.'}</DialogDescription>
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
            <Button onClick={handleSavePrestador} disabled={savingPres}>{savingPres ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ritual Dialog */}
      <Dialog open={showRitualDialog} onOpenChange={open => { setShowRitualDialog(open); if (!open) setEditingRitual(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRitual ? 'Editar Ritual' : 'Novo Ritual'}</DialogTitle>
            <DialogDescription>{editingRitual ? 'Atualize o evento.' : 'Adicione um novo ritual ou cerimônia.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Tipo / Nome *</Label>
              <Input placeholder="Ex: Weekly Sócios" value={ritualForm.tipo} onChange={e => setRitualForm(p => ({ ...p, tipo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Pauta Principal</Label>
              <Textarea placeholder="Qual o assunto principal ou formato?" value={ritualForm.pauta} onChange={e => setRitualForm(p => ({ ...p, pauta: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data / Hora</Label>
              <Input type="datetime-local" value={ritualForm.data_hora} onChange={e => setRitualForm(p => ({ ...p, data_hora: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowRitualDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveRitual} disabled={savingRitual}>{savingRitual ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Valor Dialog */}
      <Dialog open={showValorDialog} onOpenChange={open => { setShowValorDialog(open); if (!open) setEditingValorIndex(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingValorIndex !== null ? 'Editar Valor' : 'Novo Valor'}</DialogTitle>
            <DialogDescription>Define um pilar da cultura da empresa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Ex: Transparência Radical" value={valorForm.title} onChange={e => setValorForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea placeholder="O que esse valor significa no dia a dia?" value={valorForm.desc} onChange={e => setValorForm(p => ({ ...p, desc: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowValorDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveValor} disabled={savingValor}>{savingValor ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
