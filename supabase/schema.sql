-- ============================================
-- VAMO Platform - Database Schema
-- Supabase (PostgreSQL)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. User Roles
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'colaborador')) DEFAULT 'colaborador',
  nome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- 2. Leads
-- ============================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  empresa TEXT,
  cargo TEXT,
  email TEXT,
  telefone TEXT,
  fonte TEXT CHECK (fonte IN ('cold', 'warm', 'inbound')),
  produto_interesse TEXT CHECK (produto_interesse IN ('core', 'high_ticket')),
  etapa_funil TEXT CHECK (etapa_funil IN ('Prospecção', 'Reunião agendada', 'Diagnóstico', 'Proposta enviada', 'Negociação', 'Fechado', 'Perdido')) DEFAULT 'Prospecção',
  valor_estimado NUMERIC(12, 2) DEFAULT 0,
  responsavel_id UUID REFERENCES auth.users(id),
  ultimo_contato DATE,
  proxima_acao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 3. Interações (Cadência)
-- ============================================
CREATE TABLE public.interacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  data TIMESTAMPTZ DEFAULT NOW(),
  canal TEXT CHECK (canal IN ('LinkedIn', 'WhatsApp', 'E-mail', 'Telefone')),
  resumo TEXT,
  concluida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 4. ICP (Perfil de Cliente Ideal)
-- ============================================
CREATE TABLE public.icp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto TEXT CHECK (produto IN ('core', 'high_ticket')) NOT NULL,
  setor TEXT,
  tamanho_empresa TEXT,
  cargo_decisor TEXT,
  dor_principal TEXT,
  sinal_compra TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 5. Scripts de Abordagem
-- ============================================
CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canal TEXT CHECK (canal IN ('WhatsApp', 'LinkedIn', 'E-mail')),
  icp_id UUID REFERENCES public.icp(id),
  tipo TEXT CHECK (tipo IN ('cold', 'warm', 'inbound')),
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 6. Reuniões
-- ============================================
CREATE TABLE public.reunioes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  data TIMESTAMPTZ NOT NULL,
  duracao INTEGER DEFAULT 30,
  status TEXT CHECK (status IN ('agendada', 'realizada', 'cancelada')) DEFAULT 'agendada',
  url_video TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 7. Diagnósticos
-- ============================================
CREATE TABLE public.diagnosticos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reuniao_id UUID REFERENCES public.reunioes(id) ON DELETE CASCADE NOT NULL,
  dor_principal TEXT,
  budget TEXT,
  urgencia INTEGER CHECK (urgencia BETWEEN 1 AND 5),
  autoridade BOOLEAN,
  proximo_passo TEXT,
  probabilidade_fechamento INTEGER CHECK (probabilidade_fechamento BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 8. Tarefas (Cadências automáticas)
-- ============================================
CREATE TABLE public.tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT,
  data_prevista DATE NOT NULL,
  concluida BOOLEAN DEFAULT FALSE,
  responsavel_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 9. Propostas
-- ============================================
CREATE TABLE public.propostas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  produto TEXT CHECK (produto IN ('core', 'high_ticket')),
  versao TEXT,
  url_arquivo TEXT,
  valor NUMERIC(12, 2),
  pacote TEXT CHECK (pacote IN ('entrada', 'padrao', 'premium')),
  status TEXT CHECK (status IN ('rascunho', 'enviada', 'aceita', 'recusada')) DEFAULT 'rascunho',
  data_envio DATE,
  validade DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 10. Pacotes (Tabela de Preços)
-- ============================================
CREATE TABLE public.pacotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal NUMERIC(10, 2) NOT NULL,
  inclui TEXT[] DEFAULT '{}',
  desconto_maximo INTEGER DEFAULT 0,
  autorizacao TEXT DEFAULT 'socio',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 11. Contratos
-- ============================================
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposta_id UUID REFERENCES public.propostas(id),
  lead_id UUID REFERENCES public.leads(id),
  url_arquivo TEXT,
  tipo TEXT CHECK (tipo IN ('pj', 'setor_publico', 'nda')),
  data_assinatura DATE,
  status TEXT CHECK (status IN ('aguardando', 'enviado', 'assinado', 'cancelado')) DEFAULT 'aguardando',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 12. Templates de Contrato
-- ============================================
CREATE TABLE public.templates_contrato (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  versao TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 13. Produto Docs
-- ============================================
CREATE TABLE public.produto_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT CHECK (tipo IN ('visao_roadmap', 'funcionalidades_atuais', 'manual_onboarding', 'faq', 'bugs', 'feedbacks')),
  conteudo TEXT,
  versao TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 14. FAQ
-- ============================================
CREATE TABLE public.faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 15. Bugs
-- ============================================
CREATE TABLE public.bugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  severidade TEXT CHECK (severidade IN ('critico', 'alto', 'medio', 'baixo')),
  status TEXT CHECK (status IN ('aberto', 'em_analise', 'corrigido', 'fechado')) DEFAULT 'aberto',
  reportado_por TEXT CHECK (reportado_por IN ('cliente', 'time')),
  sla_resposta TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 16. Feedbacks (NPS)
-- ============================================
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID,
  cliente_nome TEXT,
  nota INTEGER CHECK (nota BETWEEN 0 AND 10),
  comentario TEXT,
  data DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 17. Posts (Marketing)
-- ============================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  data_publicacao DATE,
  canal TEXT CHECK (canal IN ('Instagram', 'LinkedIn')),
  tipo TEXT CHECK (tipo IN ('posicionamento', 'produto', 'CTA')),
  conteudo TEXT,
  status TEXT CHECK (status IN ('planejado', 'publicado')) DEFAULT 'planejado',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 18. Cases (Provas Sociais)
-- ============================================
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente TEXT NOT NULL,
  resultado TEXT,
  depoimento TEXT,
  imagem_cliente TEXT,
  arquivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 19. Financeiro
-- ============================================
CREATE TABLE public.financeiro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT CHECK (tipo IN ('receita', 'despesa')) NOT NULL,
  categoria TEXT,
  valor NUMERIC(12, 2) NOT NULL,
  data DATE DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('pago', 'pendente')) DEFAULT 'pendente',
  cliente_id UUID,
  contrato_id UUID REFERENCES public.contratos(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 20. Cobranças
-- ============================================
CREATE TABLE public.cobrancas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id UUID REFERENCES public.contratos(id),
  vencimento DATE NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  status TEXT CHECK (status IN ('aberto', 'pago', 'atrasado', 'cancelado')) DEFAULT 'aberto',
  url_boleto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 21. Sócios
-- ============================================
CREATE TABLE public.socios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  percentual NUMERIC(5, 2) NOT NULL,
  prolabore_mensal NUMERIC(10, 2),
  regras TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 22. Empresa
-- ============================================
CREATE TABLE public.empresa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razao_social TEXT,
  cnpj TEXT,
  regime_tributario TEXT,
  cnae TEXT,
  endereco TEXT,
  inscricao_municipal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 23. Cargos (Organograma)
-- ============================================
CREATE TABLE public.cargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  responsabilidades TEXT,
  superior_id UUID REFERENCES public.cargos(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 24. Prestadores (Freelancers)
-- ============================================
CREATE TABLE public.prestadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  especialidade TEXT,
  contrato_url TEXT,
  status TEXT CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 25. Rituais
-- ============================================
CREATE TABLE public.rituais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  pauta TEXT,
  data_hora TIMESTAMPTZ,
  ata TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 26. Ferramentas
-- ============================================
CREATE TABLE public.ferramentas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  categoria TEXT,
  url TEXT,
  conta_compartilhada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 27. Integrações
-- ============================================
CREATE TABLE public.integracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  fluxo TEXT,
  automacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 28. Configurações
-- ============================================
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave TEXT NOT NULL UNIQUE,
  valor TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rituais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Generic policies: authenticated users can read, admins can do everything
-- Leads
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated USING (public.is_admin());

-- Interacoes
CREATE POLICY "interacoes_select" ON public.interacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "interacoes_insert" ON public.interacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "interacoes_update" ON public.interacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "interacoes_delete" ON public.interacoes FOR DELETE TO authenticated USING (public.is_admin());

-- ICP
CREATE POLICY "icp_select" ON public.icp FOR SELECT TO authenticated USING (true);
CREATE POLICY "icp_insert" ON public.icp FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "icp_update" ON public.icp FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "icp_delete" ON public.icp FOR DELETE TO authenticated USING (public.is_admin());

-- Scripts
CREATE POLICY "scripts_all" ON public.scripts FOR ALL TO authenticated USING (true);

-- Reunioes
CREATE POLICY "reunioes_all" ON public.reunioes FOR ALL TO authenticated USING (true);

-- Diagnosticos
CREATE POLICY "diagnosticos_all" ON public.diagnosticos FOR ALL TO authenticated USING (true);

-- Tarefas
CREATE POLICY "tarefas_all" ON public.tarefas FOR ALL TO authenticated USING (true);

-- Propostas
CREATE POLICY "propostas_select" ON public.propostas FOR SELECT TO authenticated USING (true);
CREATE POLICY "propostas_insert" ON public.propostas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "propostas_update" ON public.propostas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "propostas_delete" ON public.propostas FOR DELETE TO authenticated USING (public.is_admin());

-- Pacotes (only admin can modify)
CREATE POLICY "pacotes_select" ON public.pacotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "pacotes_modify" ON public.pacotes FOR ALL TO authenticated USING (public.is_admin());

-- Contratos
CREATE POLICY "contratos_all" ON public.contratos FOR ALL TO authenticated USING (true);

-- Templates Contrato (only admin)
CREATE POLICY "templates_select" ON public.templates_contrato FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_modify" ON public.templates_contrato FOR ALL TO authenticated USING (public.is_admin());

-- Produto Docs
CREATE POLICY "produto_docs_all" ON public.produto_docs FOR ALL TO authenticated USING (true);

-- FAQ
CREATE POLICY "faq_select" ON public.faq FOR SELECT USING (true); -- public read
CREATE POLICY "faq_modify" ON public.faq FOR ALL TO authenticated USING (true);

-- Bugs
CREATE POLICY "bugs_all" ON public.bugs FOR ALL TO authenticated USING (true);

-- Feedbacks
CREATE POLICY "feedbacks_all" ON public.feedbacks FOR ALL TO authenticated USING (true);

-- Posts
CREATE POLICY "posts_all" ON public.posts FOR ALL TO authenticated USING (true);

-- Cases
CREATE POLICY "cases_select" ON public.cases FOR SELECT USING (true); -- public read
CREATE POLICY "cases_modify" ON public.cases FOR ALL TO authenticated USING (true);

-- Financeiro (only admin can modify)
CREATE POLICY "financeiro_select" ON public.financeiro FOR SELECT TO authenticated USING (true);
CREATE POLICY "financeiro_modify" ON public.financeiro FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "financeiro_update" ON public.financeiro FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "financeiro_delete" ON public.financeiro FOR DELETE TO authenticated USING (public.is_admin());

-- Cobrancas
CREATE POLICY "cobrancas_select" ON public.cobrancas FOR SELECT TO authenticated USING (true);
CREATE POLICY "cobrancas_modify" ON public.cobrancas FOR ALL TO authenticated USING (public.is_admin());

-- Socios (only admin)
CREATE POLICY "socios_select" ON public.socios FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "socios_modify" ON public.socios FOR ALL TO authenticated USING (public.is_admin());

-- Empresa
CREATE POLICY "empresa_select" ON public.empresa FOR SELECT TO authenticated USING (true);
CREATE POLICY "empresa_modify" ON public.empresa FOR ALL TO authenticated USING (public.is_admin());

-- Cargos
CREATE POLICY "cargos_all" ON public.cargos FOR ALL TO authenticated USING (true);

-- Prestadores
CREATE POLICY "prestadores_all" ON public.prestadores FOR ALL TO authenticated USING (true);

-- Rituais
CREATE POLICY "rituais_all" ON public.rituais FOR ALL TO authenticated USING (true);

-- Ferramentas
CREATE POLICY "ferramentas_all" ON public.ferramentas FOR ALL TO authenticated USING (true);

-- Integracoes
CREATE POLICY "integracoes_all" ON public.integracoes FOR ALL TO authenticated USING (true);

-- Configuracoes
CREATE POLICY "config_select" ON public.configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "config_modify" ON public.configuracoes FOR ALL TO authenticated USING (public.is_admin());

-- User Roles
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_modify" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin());

-- ============================================
-- Storage Buckets
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('propostas', 'propostas', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('contratos', 'contratos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('cases', 'cases', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('templates_visuais', 'templates_visuais', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('contratos_societarios', 'contratos_societarios', false);

-- ============================================
-- Auto-create user_roles on new signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, nome)
  VALUES (
    NEW.id,
    'admin',
    COALESCE(NEW.raw_user_meta_data->>'nome', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage policies
CREATE POLICY "auth_users_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_users_read" ON storage.objects FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_delete" ON storage.objects FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
    GROUP BY table_name
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    ', t);
  END LOOP;
END;
$$;
