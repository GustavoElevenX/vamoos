// ============================================
// VAMOOS — Database Types
// Derived from supabase/schema.sql
// ============================================

// ── Enums / Union Types ──────────────────────
export type EtapaFunil =
  | 'Prospecção'
  | 'Reunião agendada'
  | 'Diagnóstico'
  | 'Proposta enviada'
  | 'Negociação'
  | 'Fechado'
  | 'Perdido';

export type FonteLead = 'cold' | 'warm' | 'inbound';
export type ProdutoTipo = 'core' | 'high_ticket';
export type CanalProspeccao = 'LinkedIn' | 'WhatsApp' | 'E-mail';
export type CanalInteracao = 'LinkedIn' | 'WhatsApp' | 'E-mail' | 'Telefone';
export type ScriptTipo = 'cold' | 'warm' | 'inbound';
export type ReunioStatus = 'agendada' | 'realizada' | 'cancelada';
export type PacoteNome = 'entrada' | 'padrao' | 'premium';
export type PropostaStatus = 'rascunho' | 'enviada' | 'aceita' | 'recusada';
export type ContratoTipo = 'pj' | 'setor_publico' | 'nda';
export type ContratoStatus = 'aguardando' | 'enviado' | 'assinado' | 'cancelado';
export type ProdutoDocTipo =
  | 'visao_roadmap'
  | 'funcionalidades_atuais'
  | 'manual_onboarding'
  | 'faq'
  | 'bugs'
  | 'feedbacks';
export type BugSeveridade = 'critico' | 'alto' | 'medio' | 'baixo';
export type BugStatus = 'aberto' | 'em_analise' | 'corrigido' | 'fechado';
export type ReportadoPor = 'cliente' | 'time';
export type PostCanal = 'Instagram' | 'LinkedIn';
export type PostTipo = 'posicionamento' | 'produto' | 'CTA';
export type PostStatus = 'planejado' | 'publicado';
export type FinanceiroTipo = 'receita' | 'despesa';
export type FinanceiroStatus = 'pago' | 'pendente';
export type CobrancaStatus = 'aberto' | 'pago' | 'atrasado' | 'cancelado';
export type UserRoleTipo = 'admin' | 'colaborador';
export type PrestadorStatus = 'ativo' | 'inativo';

// ── Row Types ────────────────────────────────

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRoleTipo;
  nome: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  nome: string;
  empresa: string | null;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  fonte: FonteLead | null;
  produto_interesse: ProdutoTipo | null;
  etapa_funil: EtapaFunil;
  valor_estimado: number;
  responsavel_id: string | null;
  ultimo_contato: string | null;
  proxima_acao: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Interacao {
  id: string;
  lead_id: string;
  data: string;
  canal: CanalInteracao | null;
  resumo: string | null;
  concluida: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Icp {
  id: string;
  produto: ProdutoTipo;
  setor: string | null;
  tamanho_empresa: string | null;
  cargo_decisor: string | null;
  dor_principal: string | null;
  sinal_compra: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Script {
  id: string;
  canal: CanalProspeccao | null;
  icp_id: string | null;
  tipo: ScriptTipo | null;
  mensagem: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Reuniao {
  id: string;
  lead_id: string;
  data: string;
  duracao: number;
  status: ReunioStatus;
  url_video: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Diagnostico {
  id: string;
  reuniao_id: string;
  dor_principal: string | null;
  budget: string | null;
  urgencia: number | null;
  autoridade: boolean | null;
  proximo_passo: string | null;
  probabilidade_fechamento: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Tarefa {
  id: string;
  lead_id: string | null;
  tipo: string;
  descricao: string | null;
  data_prevista: string;
  concluida: boolean;
  responsavel_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Proposta {
  id: string;
  lead_id: string;
  produto: ProdutoTipo | null;
  versao: string | null;
  url_arquivo: string | null;
  valor: number | null;
  pacote: PacoteNome | null;
  status: PropostaStatus;
  data_envio: string | null;
  validade: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Pacote {
  id: string;
  nome: string;
  descricao: string | null;
  preco_mensal: number;
  inclui: string[];
  desconto_maximo: number;
  autorizacao: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Contrato {
  id: string;
  proposta_id: string | null;
  lead_id: string | null;
  url_arquivo: string | null;
  tipo: ContratoTipo | null;
  data_assinatura: string | null;
  status: ContratoStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TemplateContrato {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  versao: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProdutoDoc {
  id: string;
  tipo: ProdutoDocTipo | null;
  conteudo: string | null;
  versao: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Faq {
  id: string;
  pergunta: string;
  resposta: string;
  ordem: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Bug {
  id: string;
  titulo: string;
  descricao: string | null;
  severidade: BugSeveridade | null;
  status: BugStatus;
  reportado_por: ReportadoPor | null;
  sla_resposta: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Feedback {
  id: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  nota: number | null;
  comentario: string | null;
  data: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Post {
  id: string;
  titulo: string;
  data_publicacao: string | null;
  canal: PostCanal | null;
  tipo: PostTipo | null;
  conteudo: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Case {
  id: string;
  cliente: string;
  resultado: string | null;
  depoimento: string | null;
  imagem_cliente: string | null;
  arquivo: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Financeiro {
  id: string;
  tipo: FinanceiroTipo;
  categoria: string | null;
  valor: number;
  data: string;
  status: FinanceiroStatus;
  cliente_id: string | null;
  contrato_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Cobranca {
  id: string;
  contrato_id: string | null;
  vencimento: string;
  valor: number;
  status: CobrancaStatus;
  url_boleto: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Socio {
  id: string;
  user_id: string | null;
  nome: string;
  percentual: number;
  prolabore_mensal: number | null;
  regras: string | null;
  created_at: string;
  updated_at: string;
}

export interface Empresa {
  id: string;
  razao_social: string | null;
  cnpj: string | null;
  regime_tributario: string | null;
  cnae: string | null;
  endereco: string | null;
  inscricao_municipal: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cargo {
  id: string;
  nome: string;
  responsabilidades: string | null;
  superior_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prestador {
  id: string;
  nome: string;
  especialidade: string | null;
  contrato_url: string | null;
  status: PrestadorStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Ritual {
  id: string;
  tipo: string;
  pauta: string | null;
  data_hora: string | null;
  ata: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Ferramenta {
  id: string;
  nome: string;
  categoria: string | null;
  url: string | null;
  conta_compartilhada: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Integracao {
  id: string;
  origem: string;
  destino: string;
  fluxo: string | null;
  automacao: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: string | null;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

// ── Database generic type for Supabase client ──
export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: UserRoleRow;
        Insert: Partial<UserRoleRow>;
        Update: Partial<UserRoleRow>;
        Relationships: any[];
      };
      leads: {
        Row: Lead;
        Insert: Partial<Lead>;
        Update: Partial<Lead>;
        Relationships: any[];
      };
      interacoes: {
        Row: Interacao;
        Insert: Partial<Interacao>;
        Update: Partial<Interacao>;
        Relationships: any[];
      };
      icp: {
        Row: Icp;
        Insert: Partial<Icp>;
        Update: Partial<Icp>;
        Relationships: any[];
      };
      scripts: {
        Row: Script;
        Insert: Partial<Script>;
        Update: Partial<Script>;
        Relationships: any[];
      };
      reunioes: {
        Row: Reuniao;
        Insert: Partial<Reuniao>;
        Update: Partial<Reuniao>;
        Relationships: any[];
      };
      diagnosticos: {
        Row: Diagnostico;
        Insert: Partial<Diagnostico>;
        Update: Partial<Diagnostico>;
        Relationships: any[];
      };
      tarefas: {
        Row: Tarefa;
        Insert: Partial<Tarefa>;
        Update: Partial<Tarefa>;
        Relationships: any[];
      };
      propostas: {
        Row: Proposta;
        Insert: Partial<Proposta>;
        Update: Partial<Proposta>;
        Relationships: any[];
      };
      pacotes: {
        Row: Pacote;
        Insert: Partial<Pacote>;
        Update: Partial<Pacote>;
        Relationships: any[];
      };
      contratos: {
        Row: Contrato;
        Insert: Partial<Contrato>;
        Update: Partial<Contrato>;
        Relationships: any[];
      };
      templates_contrato: {
        Row: TemplateContrato;
        Insert: Partial<TemplateContrato>;
        Update: Partial<TemplateContrato>;
        Relationships: any[];
      };
      produto_docs: {
        Row: ProdutoDoc;
        Insert: Partial<ProdutoDoc>;
        Update: Partial<ProdutoDoc>;
        Relationships: any[];
      };
      faq: {
        Row: Faq;
        Insert: Partial<Faq>;
        Update: Partial<Faq>;
        Relationships: any[];
      };
      bugs: {
        Row: Bug;
        Insert: Partial<Bug>;
        Update: Partial<Bug>;
        Relationships: any[];
      };
      feedbacks: {
        Row: Feedback;
        Insert: Partial<Feedback>;
        Update: Partial<Feedback>;
        Relationships: any[];
      };
      posts: {
        Row: Post;
        Insert: Partial<Post>;
        Update: Partial<Post>;
        Relationships: any[];
      };
      cases: {
        Row: Case;
        Insert: Partial<Case>;
        Update: Partial<Case>;
        Relationships: any[];
      };
      financeiro: {
        Row: Financeiro;
        Insert: Partial<Financeiro>;
        Update: Partial<Financeiro>;
        Relationships: any[];
      };
      cobrancas: {
        Row: Cobranca;
        Insert: Partial<Cobranca>;
        Update: Partial<Cobranca>;
        Relationships: any[];
      };
      socios: {
        Row: Socio;
        Insert: Partial<Socio>;
        Update: Partial<Socio>;
        Relationships: any[];
      };
      empresa: {
        Row: Empresa;
        Insert: Partial<Empresa>;
        Update: Partial<Empresa>;
        Relationships: any[];
      };
      cargos: {
        Row: Cargo;
        Insert: Partial<Cargo>;
        Update: Partial<Cargo>;
        Relationships: any[];
      };
      prestadores: {
        Row: Prestador;
        Insert: Partial<Prestador>;
        Update: Partial<Prestador>;
        Relationships: any[];
      };
      rituais: {
        Row: Ritual;
        Insert: Partial<Ritual>;
        Update: Partial<Ritual>;
        Relationships: any[];
      };
      ferramentas: {
        Row: Ferramenta;
        Insert: Partial<Ferramenta>;
        Update: Partial<Ferramenta>;
        Relationships: any[];
      };
      integracoes: {
        Row: Integracao;
        Insert: Partial<Integracao>;
        Update: Partial<Integracao>;
        Relationships: any[];
      };
      configuracoes: {
        Row: Configuracao;
        Insert: Partial<Configuracao>;
        Update: Partial<Configuracao>;
        Relationships: any[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
