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
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { Award, Plus, Edit2, Briefcase, Camera, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Post, Case, PostCanal, PostTipo } from '@/types/database';
import { SkeletonRow } from '@/components/shared/skeleton';
import { useUser } from '@/contexts/user-context';

const TABS = [
  { key: 'calendario', label: 'Calendário' },
  { key: 'cases',      label: 'Cases' },
  { key: 'brand',      label: 'Brand Book' },
  { key: 'templates',  label: 'Templates' },
];

const brandColors = [
  { nome: 'Verde VAMOOS', hex: '#00FF57', uso: 'Cor principal da marca' },
  { nome: 'Verde Escuro',  hex: '#00884E', uso: 'Variante da cor principal' },
  { nome: 'Background',    hex: '#070c07', uso: 'Fundo principal' },
  { nome: 'Success',       hex: '#4ade80', uso: 'Estados positivos' },
  { nome: 'Warning',       hex: '#f59e0b', uso: 'Alertas' },
];

const POST_COLS = '2fr 100px 100px 100px 90px 50px';

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ height: 28, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap', border: active ? '1px solid rgba(0,255,87,0.28)' : '1px solid transparent', background: active ? 'rgba(0,255,87,0.1)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent', color: active ? '#00FF57' : hovered ? 'var(--text-primary)' : 'var(--text-muted)' }}>
      {children}
    </button>
  );
}

export default function MarketingPage() {
  const [tab, setTab] = useState('calendario');

  // Posts state
  const [posts, setPosts]           = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [postForm, setPostForm] = useState({ titulo: '', canal: '' as PostCanal | '', tipo: '' as PostTipo | '', data_publicacao: '' });

  // Cases state
  const [cases, setCases]           = useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [savingCase, setSavingCase] = useState(false);
  const [caseForm, setCaseForm] = useState({ cliente: '', resultado: '', depoimento: '' });

  const { userId } = useUser();

  useEffect(() => {
    if (tab === 'calendario') fetchPosts();
    if (tab === 'cases')      fetchCases();
  }, [tab]);

  async function fetchPosts() {
    setPostsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('posts').select('*').order('data_publicacao', { ascending: false });
    if (error) toast.error('Erro ao carregar posts');
    else setPosts((data ?? []) as Post[]);
    setPostsLoading(false);
  }

  async function fetchCases() {
    setCasesLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar cases');
    else setCases((data ?? []) as Case[]);
    setCasesLoading(false);
  }

  async function handleCreatePost() {
    if (!postForm.titulo) { toast.error('Título é obrigatório'); return; }
    setSavingPost(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('posts')
      .insert({
        titulo: postForm.titulo,
        canal: (postForm.canal as PostCanal) || null,
        tipo: (postForm.tipo as PostTipo) || null,
        data_publicacao: postForm.data_publicacao || null,
        status: 'planejado',
        created_by: userId,
      })
      .select().single();
    setSavingPost(false);
    if (error) { toast.error('Erro ao criar post: ' + error.message); return; }
    if (data) setPosts(prev => [data as Post, ...prev]);
    toast.success('Post criado!');
    setShowPostDialog(false);
    setPostForm({ titulo: '', canal: '', tipo: '', data_publicacao: '' });
  }

  async function handleCreateCase() {
    if (!caseForm.cliente) { toast.error('Cliente é obrigatório'); return; }
    setSavingCase(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('cases')
      .insert({
        cliente: caseForm.cliente,
        resultado: caseForm.resultado || null,
        depoimento: caseForm.depoimento || null,
        created_by: userId,
      })
      .select().single();
    setSavingCase(false);
    if (error) { toast.error('Erro ao criar case: ' + error.message); return; }
    if (data) setCases(prev => [data as Case, ...prev]);
    toast.success('Case adicionado!');
    setShowCaseDialog(false);
    setCaseForm({ cliente: '', resultado: '', depoimento: '' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Marketing" subtitle="Calendário Editorial, Cases e Brand" />

      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 42, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabBtn>)}
        </div>
        {tab === 'calendario' && (
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowPostDialog(true)}>
            <Plus style={{ width: 11, height: 11 }} /> Novo Post
          </Button>
        )}
        {tab === 'cases' && (
          <Button size="sm" style={{ height: 28, fontSize: 11 }} onClick={() => setShowCaseDialog(true)}>
            <Plus style={{ width: 11, height: 11 }} /> Novo Case
          </Button>
        )}
      </div>

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} className="page-content">

          {/* Calendário */}
          {tab === 'calendario' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: POST_COLS, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
                {['Título', 'Canal', 'Tipo', 'Data', 'Status', 'Ação'].map(h => (
                  <span key={h} style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {postsLoading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                : posts.length === 0
                  ? <p style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum post cadastrado.</p>
                  : posts.map((post, i) => (
                    <div key={post.id}
                      style={{ display: 'grid', gridTemplateColumns: POST_COLS, alignItems: 'center', padding: '9px 16px', borderBottom: i < posts.length - 1 ? '1px solid var(--border)' : undefined, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{post.titulo}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {post.canal === 'LinkedIn'
                          ? <Briefcase style={{ width: 11, height: 11, color: '#60a5fa' }} />
                          : <Camera style={{ width: 11, height: 11, color: '#f472b6' }} />}
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{post.canal ?? '—'}</span>
                      </div>
                      <Badge variant="outline" style={{ fontSize: 10 }}>{post.tipo ?? '—'}</Badge>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{post.data_publicacao ? formatDate(post.data_publicacao) : '—'}</span>
                      <Badge variant={post.status === 'publicado' ? 'success' : 'warning'} style={{ fontSize: 10 }}>{post.status}</Badge>
                      <button style={{ width: 26, height: 26, borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.06)'; (e.currentTarget as HTMLElement).style.color = '#00FF57'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'; }}>
                        <Edit2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  ))
              }
            </div>
          )}

          {/* Cases */}
          {tab === 'cases' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {casesLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, height: 160, animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.4 }} />
                ))
                : cases.length === 0
                  ? <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', fontSize: 12, color: 'var(--text-faint)' }}>Nenhum case cadastrado.</p>
                  : cases.map((c) => (
                    <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Award style={{ width: 13, height: 13, color: '#f59e0b' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.cliente}</span>
                        </div>
                      </div>
                      <div style={{ padding: '12px 16px' }}>
                        {c.resultado && (
                          <div style={{ background: 'rgba(0,255,87,0.06)', border: '1px solid rgba(0,255,87,0.15)', borderRadius: 6, padding: '9px 12px', marginBottom: 10 }}>
                            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#00FF57' }}>{c.resultado}</p>
                          </div>
                        )}
                        {c.depoimento && (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.55 }}>&quot;{c.depoimento}&quot;</p>
                        )}
                      </div>
                    </div>
                  ))
              }
            </div>
          )}

          {/* Brand Book */}
          {tab === 'brand' && (
            <>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Paleta de Cores</span>
                </div>
                <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  {brandColors.map(cor => (
                    <div key={cor.hex} style={{ textAlign: 'center' }}>
                      <div style={{ height: 60, borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)', background: cor.hex }} />
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{cor.nome}</p>
                      <p style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{cor.hex}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{cor.uso}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Tipografia</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 14 }}>Inter (Google Fonts) — Weights: 300, 400, 500, 600, 700, 800</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>Heading Bold 800</p>
                  <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 6 }}>Subheading Semibold 600</p>
                  <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 6 }}>Body Regular 400</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Caption Light 300</p>
                </div>
              </div>
            </>
          )}

          {/* Templates */}
          {tab === 'templates' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(0,255,87,0.06)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon style={{ width: 20, height: 20, color: 'var(--text-faint)' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Biblioteca de Templates Visuais</p>
                <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Faça upload de templates do Canva ou Figma</p>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      {/* New Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={open => { setShowPostDialog(open); if (!open) setPostForm({ titulo: '', canal: '', tipo: '', data_publicacao: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Post</DialogTitle>
            <DialogDescription>Planeje um novo post para o calendário editorial.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Ex: Como escalar vendas B2B" value={postForm.titulo} onChange={e => setPostForm(p => ({ ...p, titulo: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={postForm.canal} onValueChange={v => setPostForm(p => ({ ...p, canal: v as PostCanal }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={postForm.tipo} onValueChange={v => setPostForm(p => ({ ...p, tipo: v as PostTipo }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posicionamento">Posicionamento</SelectItem>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="CTA">CTA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Publicação</Label>
              <Input type="date" value={postForm.data_publicacao} onChange={e => setPostForm(p => ({ ...p, data_publicacao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreatePost} disabled={savingPost}>{savingPost ? 'Salvando…' : 'Criar Post'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Case Dialog */}
      <Dialog open={showCaseDialog} onOpenChange={open => { setShowCaseDialog(open); if (!open) setCaseForm({ cliente: '', resultado: '', depoimento: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Case</DialogTitle>
            <DialogDescription>Adicione um caso de sucesso.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Input placeholder="Nome do cliente ou empresa" value={caseForm.cliente} onChange={e => setCaseForm(p => ({ ...p, cliente: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Input placeholder="Ex: +40% em vendas em 3 meses" value={caseForm.resultado} onChange={e => setCaseForm(p => ({ ...p, resultado: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Depoimento</Label>
              <Textarea placeholder="O que o cliente disse?" value={caseForm.depoimento} onChange={e => setCaseForm(p => ({ ...p, depoimento: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCaseDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateCase} disabled={savingCase}>{savingCase ? 'Salvando…' : 'Adicionar Case'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
