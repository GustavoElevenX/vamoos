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
import { BookOpen, HelpCircle, Star, Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ProdutoDoc, ProdutoDocTipo, Faq, Bug, Feedback, BugSeveridade, BugStatus } from '@/types/database';
import { SkeletonRow } from '@/components/shared/skeleton';
import { useUser } from '@/contexts/user-context';
import { formatDate } from '@/lib/utils';

const TABS = [
  { key: 'roadmap',     label: 'Roadmap' },
  { key: 'features',   label: 'Funcionalidades' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'faq',        label: 'FAQ' },
  { key: 'bugs',       label: 'Bugs' },
  { key: 'feedback',   label: 'Feedback' },
];

const severityBadge: Record<BugSeveridade, 'destructive' | 'warning' | 'info' | 'secondary'> = {
  critico: 'destructive', alto: 'warning', medio: 'info', baixo: 'secondary',
};

const BUG_COLS = '2fr 90px 100px 100px 60px';

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ height: 28, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
        border: active ? '1px solid rgba(0,255,87,0.28)' : '1px solid transparent',
        background: active ? 'rgba(0,255,87,0.1)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: active ? '#00FF57' : hovered ? 'var(--text-primary)' : 'var(--text-muted)',
      }}>
      {children}
    </button>
  );
}

// ── Doc tab (roadmap / features / onboarding) ────────────────────────────────
function DocTab({ tipo, title }: { tipo: ProdutoDocTipo; title: string }) {
  const [doc, setDoc]           = useState<ProdutoDoc | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [content, setContent]   = useState('');
  const [saving, setSaving]     = useState(false);
  const { userId } = useUser();

  useEffect(() => {
    const supabase = createClient();
    supabase.from('produto_docs').select('*').eq('tipo', tipo).maybeSingle().then(({ data }) => {
      setDoc(data as ProdutoDoc | null);
      setContent(data?.conteudo ?? '');
      setLoading(false);
    });
  }, [tipo]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    if (doc) {
      const { error } = await supabase.from('produto_docs').update({ conteudo: content }).eq('id', doc.id);
      if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return; }
      setDoc(prev => prev ? { ...prev, conteudo: content } : prev);
    } else {
      const { data, error } = await supabase.from('produto_docs')
        .insert({ tipo, conteudo: content, versao: '1.0', created_by: userId }).select().single();
      if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return; }
      setDoc(data as ProdutoDoc);
    }
    setSaving(false);
    setEditing(false);
    toast.success('Salvo!');
  }

  if (loading) return <div style={{ padding: '20px 16px', color: 'var(--text-faint)', fontSize: 12 }}>Carregando…</div>;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
          <BookOpen style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
          {title}
        </span>
        <Button variant="outline" size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => { setContent(doc?.conteudo ?? ''); setEditing(true); }}>
          <Pencil style={{ width: 11, height: 11 }} /> Editar
        </Button>
      </div>
      <div style={{ padding: '14px 16px' }}>
        {doc?.conteudo ? (
          <pre style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{doc.conteudo}</pre>
        ) : (
          <p style={{ fontSize: 12.5, color: 'var(--text-faint)', fontStyle: 'italic' }}>
            Nenhum conteúdo cadastrado. Clique em &quot;Editar&quot; para adicionar.
          </p>
        )}
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar — {title}</DialogTitle>
            <DialogDescription>Edite o conteúdo do documento.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea value={content} onChange={e => setContent(e.target.value)} className="min-h-[320px] font-mono text-sm" placeholder="Digite o conteúdo…" />
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

// ── FAQ tab ──────────────────────────────────────────────────────────────────
function FaqTab() {
  const [faqs, setFaqs]         = useState<Faq[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [form, setForm] = useState({ pergunta: '', resposta: '' });
  const { userId } = useUser();

  useEffect(() => {
    fetchFaqs();
  }, []);

  function fetchFaqs() {
    setLoading(true);
    const supabase = createClient();
    supabase.from('faq').select('*').order('ordem').then(({ data }) => {
      setFaqs((data ?? []) as Faq[]);
      setLoading(false);
    });
  }

  function handleOpenDialog(faq?: Faq) {
    if (faq) {
      setEditingFaq(faq);
      setForm({ pergunta: faq.pergunta, resposta: faq.resposta });
    } else {
      setEditingFaq(null);
      setForm({ pergunta: '', resposta: '' });
    }
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.pergunta || !form.resposta) { toast.error('Pergunta e resposta são obrigatórias'); return; }
    setSaving(true);
    const supabase = createClient();
    
    if (editingFaq) {
      const { error } = await supabase.from('faq')
        .update({ pergunta: form.pergunta, resposta: form.resposta })
        .eq('id', editingFaq.id);
      
      setSaving(false);
      if (error) { toast.error('Erro ao editar FAQ: ' + error.message); return; }
      toast.success('FAQ atualizada!');
    } else {
      const { error } = await supabase.from('faq')
        .insert({ pergunta: form.pergunta, resposta: form.resposta, ordem: faqs.length + 1, created_by: userId });
      
      setSaving(false);
      if (error) { toast.error('Erro ao criar FAQ: ' + error.message); return; }
      toast.success('FAQ adicionada!');
    }
    
    fetchFaqs();
    setShowDialog(false);
    setForm({ pergunta: '', resposta: '' });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => handleOpenDialog()}>
          <Plus style={{ width: 11, height: 11 }} /> Nova Pergunta
        </Button>
      </div>
      {loading
        ? <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={1} />)}</div>
        : faqs.length === 0
          ? <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: 'var(--text-faint)' }}>Nenhuma FAQ cadastrada.</p>
          : faqs.map((faq, i) => (
            <div key={faq.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                <HelpCircle style={{ width: 13, height: 13, color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{faq.pergunta}</span>
                <Button variant="ghost" size="icon" style={{ width: 24, height: 24, color: 'var(--text-muted)' }} onClick={() => handleOpenDialog(faq)}>
                  <Pencil style={{ width: 12, height: 12 }} />
                </Button>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{faq.resposta}</p>
              </div>
            </div>
          ))
      }

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Editar Pergunta FAQ' : 'Nova Pergunta FAQ'}</DialogTitle>
            <DialogDescription>{editingFaq ? 'Altere os dados da pergunta.' : 'Adicione uma pergunta frequente.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Pergunta *</Label>
              <Input placeholder="Ex: Como funciona o onboarding?" value={form.pergunta} onChange={e => setForm(p => ({ ...p, pergunta: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Resposta *</Label>
              <Textarea placeholder="Resposta detalhada…" value={form.resposta} onChange={e => setForm(p => ({ ...p, resposta: e.target.value }))} className="min-h-[120px]" />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Bugs tab ─────────────────────────────────────────────────────────────────
function BugsTab() {
  const [bugs, setBugs]         = useState<Bug[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', severidade: '' as BugSeveridade | '', reportado_por: '' as 'cliente' | 'time' | '', sla_resposta: '' });
  const { userId } = useUser();

  useEffect(() => {
    const supabase = createClient();
    supabase.from('bugs').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setBugs((data ?? []) as Bug[]);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    if (!form.titulo) { toast.error('Título é obrigatório'); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('bugs')
      .insert({
        titulo: form.titulo,
        descricao: form.descricao || null,
        severidade: (form.severidade as BugSeveridade) || null,
        reportado_por: (form.reportado_por as 'cliente' | 'time') || null,
        sla_resposta: form.sla_resposta || null,
        status: 'aberto' as BugStatus,
        created_by: userId,
      })
      .select().single();
    setSaving(false);
    if (error) { toast.error('Erro ao reportar bug: ' + error.message); return; }
    if (data) setBugs(prev => [data as Bug, ...prev]);
    toast.success('Bug reportado!');
    setShowDialog(false);
    setForm({ titulo: '', descricao: '', severidade: '', reportado_por: '', sla_resposta: '' });
  }

  return (
    <>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Bugs Reportados</span>
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowDialog(true)}>
            <Plus style={{ width: 11, height: 11 }} /> Reportar Bug
          </Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: BUG_COLS, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
          {['Título', 'Severidade', 'Status', 'Reportado', 'SLA'].map(h => (
            <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
          : bugs.length === 0
            ? <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum bug reportado.</p>
            : bugs.map((bug, i) => (
              <div key={bug.id}
                style={{ display: 'grid', gridTemplateColumns: BUG_COLS, alignItems: 'center', padding: '9px 16px', borderBottom: i < bugs.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{bug.titulo}</span>
                {bug.severidade ? <Badge variant={severityBadge[bug.severidade]} style={{ fontSize: 10 }}>{bug.severidade}</Badge> : <span>—</span>}
                <Badge variant={bug.status === 'corrigido' || bug.status === 'fechado' ? 'success' : bug.status === 'em_analise' ? 'info' : 'warning'} style={{ fontSize: 10 }}>
                  {bug.status.replace('_', ' ')}
                </Badge>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bug.reportado_por ?? '—'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bug.sla_resposta ?? '—'}</span>
              </div>
            ))
        }
      </div>

      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) setForm({ titulo: '', descricao: '', severidade: '', reportado_por: '', sla_resposta: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar Bug</DialogTitle>
            <DialogDescription>Descreva o problema encontrado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Ex: Filtro não funciona com acentos" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea placeholder="Descreva o problema com detalhes…" value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severidade</Label>
                <Select value={form.severidade} onValueChange={v => setForm(p => ({ ...p, severidade: v as BugSeveridade }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critico">Crítico</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="baixo">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reportado por</Label>
                <Select value={form.reportado_por} onValueChange={v => setForm(p => ({ ...p, reportado_por: v as 'cliente' | 'time' }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>SLA de Resposta</Label>
              <Input placeholder="Ex: 4h, 24h" value={form.sla_resposta} onChange={e => setForm(p => ({ ...p, sla_resposta: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando…' : 'Reportar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Feedback tab ─────────────────────────────────────────────────────────────
function FeedbackTab() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ cliente_nome: '', nota: '', comentario: '' });
  const { userId } = useUser();

  useEffect(() => {
    const supabase = createClient();
    supabase.from('feedbacks').select('*').order('data', { ascending: false }).then(({ data }) => {
      setFeedbacks((data ?? []) as Feedback[]);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    if (!form.cliente_nome || !form.nota) { toast.error('Nome e nota são obrigatórios'); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('feedbacks')
      .insert({
        cliente_nome: form.cliente_nome,
        nota: parseInt(form.nota),
        comentario: form.comentario || null,
        data: new Date().toISOString().split('T')[0],
        created_by: userId,
      })
      .select().single();
    setSaving(false);
    if (error) { toast.error('Erro ao registrar feedback: ' + error.message); return; }
    if (data) setFeedbacks(prev => [data as Feedback, ...prev]);
    toast.success('Feedback registrado!');
    setShowDialog(false);
    setForm({ cliente_nome: '', nota: '', comentario: '' });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowDialog(true)}>
          <Plus style={{ width: 11, height: 11 }} /> Registrar Feedback
        </Button>
      </div>
      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', height: 80, animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.4 }} />
        ))
        : feedbacks.length === 0
          ? <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum feedback registrado.</p>
          : feedbacks.map((fb) => (
            <div key={fb.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fb.cliente_nome ?? '—'}</span>
                    {fb.nota !== null && (
                      <>
                        <div style={{ display: 'flex', gap: 1 }}>
                          {Array.from({ length: 10 }, (_, j) => (
                            <Star key={j} style={{ width: 11, height: 11, color: j < (fb.nota ?? 0) ? '#fbbf24' : 'rgba(255,255,255,0.1)' }} />
                          ))}
                        </div>
                        <Badge variant={fb.nota >= 9 ? 'success' : fb.nota >= 7 ? 'info' : 'warning'} style={{ fontSize: 10 }}>NPS: {fb.nota}</Badge>
                      </>
                    )}
                  </div>
                  {fb.comentario && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.55 }}>&quot;{fb.comentario}&quot;</p>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 16, flexShrink: 0 }}>{formatDate(fb.data)}</span>
              </div>
            </div>
          ))
      }

      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) setForm({ cliente_nome: '', nota: '', comentario: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Feedback</DialogTitle>
            <DialogDescription>Registre o feedback de um cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Input placeholder="Nome do cliente ou empresa" value={form.cliente_nome} onChange={e => setForm(p => ({ ...p, cliente_nome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Nota (0–10) *</Label>
                <Input type="number" min={0} max={10} placeholder="0" value={form.nota} onChange={e => setForm(p => ({ ...p, nota: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comentário</Label>
              <Textarea placeholder="O que o cliente disse?" value={form.comentario} onChange={e => setForm(p => ({ ...p, comentario: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando…' : 'Registrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ProdutoPage() {
  const [tab, setTab] = useState('roadmap');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Produto VAMOOS" subtitle="Roadmap, Funcionalidades e Feedback" />

      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 20px', height: 42, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
        {TABS.map(t => <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabBtn>)}
      </div>

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} className="page-content">
          {tab === 'roadmap'     && <DocTab tipo="visao_roadmap"          title="Visão & Roadmap" />}
          {tab === 'features'   && <DocTab tipo="funcionalidades_atuais"  title="Funcionalidades Atuais" />}
          {tab === 'onboarding' && <DocTab tipo="manual_onboarding"       title="Manual de Onboarding" />}
          {tab === 'faq'        && <FaqTab />}
          {tab === 'bugs'       && <BugsTab />}
          {tab === 'feedback'   && <FeedbackTab />}
        </div>
      </ScrollArea>
    </div>
  );
}
