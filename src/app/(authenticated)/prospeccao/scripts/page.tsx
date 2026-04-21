'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Briefcase, Mail, Plus, Copy, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Script, Icp, CanalProspeccao, ScriptTipo } from '@/types/database';
import { useUser } from '@/contexts/user-context';

type ScriptComIcp = Script & { icp: { produto: string } | null };

const channelConfig: Record<string, { icon: React.ComponentType<{ style?: React.CSSProperties }>, color: string, bg: string }> = {
  WhatsApp: { icon: MessageSquare, color: '#00FF57', bg: 'rgba(0,255,87,0.1)' },
  LinkedIn:  { icon: Briefcase,    color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
  'E-mail':  { icon: Mail,         color: '#a78bfa', bg: 'rgba(139,92,246,0.1)' },
};

const icpLabel = (produto: string | null | undefined): string => {
  if (!produto) return '—';
  return produto === 'core' ? 'Core' : 'High Ticket';
};

const icpBadge = (produto: string | null | undefined): 'default' | 'info' => {
  return produto === 'high_ticket' ? 'info' : 'default';
};

export default function ScriptsPage() {
  const [scripts, setScripts]         = useState<ScriptComIcp[]>([]);
  const [icps, setIcps]               = useState<Icp[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showDialog, setShowDialog]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [activeTab, setActiveTab]     = useState('all');
  const [form, setForm] = useState({ canal: '' as CanalProspeccao | '', tipo: '' as ScriptTipo | '', icp_id: '', mensagem: '' });
  const { userId } = useUser();

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    const [scriptsRes, icpsRes] = await Promise.all([
      supabase.from('scripts').select('*, icp(produto)').order('created_at', { ascending: false }),
      supabase.from('icp').select('id, produto').order('produto'),
    ]);
    if (scriptsRes.error) toast.error('Erro ao carregar scripts');
    else setScripts((scriptsRes.data ?? []) as ScriptComIcp[]);
    if (icpsRes.data) setIcps(icpsRes.data as Icp[]);
    setLoading(false);
  }

  const filtered = activeTab === 'all'
    ? scripts
    : scripts.filter(s => s.canal === activeTab);

  async function handleCreate() {
    if (!form.mensagem) { toast.error('Mensagem é obrigatória'); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('scripts')
      .insert({
        canal:    (form.canal    as CanalProspeccao) || null,
        tipo:     (form.tipo     as ScriptTipo)      || null,
        icp_id:   form.icp_id   || null,
        mensagem: form.mensagem,
        created_by: userId,
      })
      .select('*, icp(produto)')
      .single();
    setSaving(false);
    if (error) { toast.error('Erro ao salvar script: ' + error.message); return; }
    if (data) setScripts(prev => [data as ScriptComIcp, ...prev]);
    toast.success('Script criado!');
    setShowDialog(false);
    setForm({ canal: '', tipo: '', icp_id: '', mensagem: '' });
  }

  async function handleCopy(mensagem: string) {
    try {
      await navigator.clipboard.writeText(mensagem);
      toast.success('Copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Scripts de Abordagem" subtitle="Prospecção" />

      <div style={{ padding: '10px 20px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="WhatsApp">WhatsApp</TabsTrigger>
            <TabsTrigger value="LinkedIn">LinkedIn</TabsTrigger>
            <TabsTrigger value="E-mail">E-mail</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" style={{ height: 30, fontSize: 12, marginBottom: 10 }} onClick={() => setShowDialog(true)}>
          <Plus style={{ width: 12, height: 12 }} /> Novo Script
        </Button>
      </div>

      <ScrollArea style={{ flex: 1 }}>
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="page-content">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, height: 180, opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))
          ) : filtered.length === 0 ? (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', fontSize: 12, color: 'var(--text-faint)' }}>
              Nenhum script {activeTab !== 'all' ? `para ${activeTab}` : ''} cadastrado.
            </p>
          ) : filtered.map(script => {
            const ch = channelConfig[script.canal ?? ''] ?? channelConfig['WhatsApp'];
            const Icon = ch.icon;
            const vars = script.mensagem.match(/\{\{(\w+)\}\}/g) ?? [];
            return (
              <div key={script.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: ch.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ch.color }}>
                      <Icon style={{ width: 15, height: 15 }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{script.canal ?? 'Canal'}</p>
                      <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                        {script.icp && (
                          <Badge variant={icpBadge(script.icp.produto)} style={{ fontSize: 10 }}>{icpLabel(script.icp.produto)}</Badge>
                        )}
                        {script.tipo && (
                          <Badge variant={script.tipo === 'cold' ? 'secondary' : script.tipo === 'warm' ? 'warning' : 'success'} style={{ fontSize: 10 }}>{script.tipo}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => handleCopy(script.mensagem)}
                      style={{ width: 26, height: 26, borderRadius: 5, background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.06)'; (e.currentTarget as HTMLElement).style.color = '#00FF57'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                      title="Copiar">
                      <Copy style={{ width: 11, height: 11 }} />
                    </button>
                    <button
                      style={{ width: 26, height: 26, borderRadius: 5, background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.06)'; (e.currentTarget as HTMLElement).style.color = '#00FF57'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
                      <Edit2 style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                </div>

                {/* Message */}
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ background: 'rgba(0,255,87,0.02)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px', marginBottom: 10 }}>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{script.mensagem}</p>
                  </div>
                  {vars.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>Variáveis:</span>
                      {vars.map((v, i) => (
                        <Badge key={i} variant="outline" style={{ fontSize: 10 }}>{v}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) setForm({ canal: '', tipo: '', icp_id: '', mensagem: '' }); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Script</DialogTitle>
            <DialogDescription>Crie um novo script de abordagem. Use {'{{nome}}'}, {'{{empresa}}'} como variáveis.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={form.canal} onValueChange={v => setForm(p => ({ ...p, canal: v as CanalProspeccao }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as ScriptTipo }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {icps.length > 0 && (
              <div className="space-y-2 col-span-2">
                <Label>ICP</Label>
                <Select value={form.icp_id} onValueChange={v => setForm(p => ({ ...p, icp_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {icps.map(icp => (
                      <SelectItem key={icp.id} value={icp.id}>
                        {icp.produto === 'core' ? 'Core' : 'High Ticket'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2 col-span-2">
              <Label>Mensagem *</Label>
              <Textarea
                value={form.mensagem}
                onChange={e => setForm(p => ({ ...p, mensagem: e.target.value }))}
                placeholder={`Use {{nome}}, {{empresa}}, etc. como variáveis...`}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando…' : 'Salvar Script'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
