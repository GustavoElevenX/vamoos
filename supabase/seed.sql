-- ============================================
-- VAMO Platform - Seed Data
-- Run after schema.sql
-- ============================================

-- ============================================
-- ICP (Perfil de Cliente Ideal)
-- ============================================
INSERT INTO public.icp (produto, setor, tamanho_empresa, cargo_decisor, dor_principal, sinal_compra) VALUES
('core', 'Varejo, Serviços, Tecnologia, SaaS', '10-200 funcionários', 'CEO, Diretor Comercial, Gerente de Vendas, VP de Revenue', 'Falta de previsibilidade de receita, processos comerciais desorganizados, time de vendas sem método, pipeline sem visibilidade', 'Buscando escalar vendas, contratando SDRs, reclamando de produtividade da equipe, perdendo deals por falta de follow-up'),
('high_ticket', 'Setor Público (Prefeituras, Governos Estaduais, Federal, Autarquias)', 'Órgãos públicos de qualquer porte', 'Secretário de Inovação, Coordenador de TI, Prefeito, Diretor de Modernização', 'Processos digitais atrasados, falta de automação, necessidade de modernização e compliance, gestão de contratos manual', 'Edital em andamento, verba destinada para transformação digital, demanda por compliance digital, plano de modernização aprovado');

-- ============================================
-- Pacotes (Tabela de Preços)
-- ============================================
INSERT INTO public.pacotes (nome, descricao, preco_mensal, inclui, desconto_maximo, autorizacao) VALUES
('Entrada', 'Ideal para empresas que estão começando a estruturar seu processo comercial', 2500.00, ARRAY['CRM básico', 'Dashboard de métricas', '1 usuário', 'Suporte por e-mail', 'Templates de prospecção'], 10, 'socio'),
('Padrão', 'Para empresas que querem escalar suas vendas com processo estruturado', 5000.00, ARRAY['CRM completo com Kanban', 'Dashboard avançado com KPIs', 'Até 5 usuários', 'Suporte prioritário', 'Cadências automáticas multi-canal', 'Scripts personalizados por ICP', 'Relatórios semanais'], 15, 'socio'),
('Premium', 'Solução completa para operações comerciais de alta performance', 10000.00, ARRAY['Tudo do Padrão', 'Usuários ilimitados', 'Integrações customizadas (WhatsApp, ERP)', 'Consultoria mensal com especialista', 'SLA dedicado de 4h', 'Treinamento presencial da equipe', 'Dashboard personalizado', 'API de integração'], 20, 'socio');

-- ============================================
-- Scripts de Abordagem
-- ============================================
INSERT INTO public.scripts (canal, tipo, mensagem) VALUES
-- WhatsApp Cold - Core
('WhatsApp', 'cold', 'Olá {{nome}}, tudo bem? 👋

Sou da VAMO e ajudamos empresas como a {{empresa}} a aumentar suas vendas em até 40% com processos comerciais estruturados.

Vi que vocês estão em um momento de crescimento e pode ser que estejam enfrentando desafios com previsibilidade de receita.

Posso te mostrar como resolvemos isso em uma conversa rápida de 15 min? 🚀'),

-- WhatsApp Warm - Core
('WhatsApp', 'warm', 'Olá {{nome}}, tudo bem?

Nos conhecemos no {{evento}} e conversamos sobre os desafios comerciais da {{empresa}}.

Preparei um diagnóstico rápido que pode te ajudar a identificar os gargalos do seu funil de vendas. São 20 min que podem mudar seu trimestre.

Quando seria um bom horário para conversarmos? 📊'),

-- WhatsApp Inbound - Core
('WhatsApp', 'inbound', 'Olá {{nome}}! 😊

Recebi seu contato pelo nosso site. Que bom que você se interessou pela VAMO!

Vi que a {{empresa}} atua no setor de {{setor}} - temos cases muito legais nessa área.

Tenho horários disponíveis amanhã para uma conversa rápida de 20 min. Qual horário funciona melhor para você?'),

-- LinkedIn Cold - Core
('LinkedIn', 'cold', 'Olá {{nome}}! 

Vi seu perfil e achei muito interessante seu trabalho como {{cargo}} na {{empresa}}.

Na VAMO, ajudamos líderes comerciais a estruturarem processos de vendas que geram previsibilidade e escala. Em média, nossos clientes aumentam o pipeline qualificado em 3x nos primeiros 90 dias.

Seria ótimo trocar uma ideia sobre os desafios que você enfrenta. Toparia um café virtual de 15 min?'),

-- LinkedIn Warm - Core
('LinkedIn', 'warm', '{{nome}}, bom te reencontrar!

Lembro da nossa conversa sobre {{contexto}}. Desde então, desenvolvemos uma metodologia que resolve exatamente o problema que você mencionou.

Inclusive, acabamos de ajudar uma empresa similar à {{empresa}} a {{resultado}}.

Que tal agendarmos 20 min para eu te mostrar como? Pode ser essa semana?'),

-- E-mail Cold - High Ticket
('E-mail', 'cold', 'Assunto: Modernização Digital para {{orgao}} - Caso de Sucesso

Prezado(a) {{nome}},

Meu nome é [NOME] e sou da VAMO, empresa especializada em soluções de transformação digital para o setor público.

Recentemente, ajudamos {{caso_referencia}} a digitalizar 100% dos seus processos de gestão de contratos, resultando em:
- 60% menos tempo em processos burocráticos
- Compliance total com a LGPD
- Economia de R$ 200mil/ano em papel e retrabalho

Gostaríamos de apresentar como podemos fazer o mesmo pelo {{orgao}}.

Teria disponibilidade para uma reunião de 30 minutos na próxima semana?

Atenciosamente,
Equipe VAMO'),

-- E-mail Warm - High Ticket
('E-mail', 'warm', 'Assunto: Proposta de Modernização - Continuação da nossa conversa

Prezado(a) {{nome}},

Conforme conversamos no {{evento}}, a VAMO possui soluções específicas para modernização digital no setor público, com total aderência aos requisitos de licitação e compliance.

Preparamos uma apresentação personalizada para o {{orgao}}, incluindo:
1. Diagnóstico das necessidades identificadas
2. Solução proposta com cronograma
3. Cases de sucesso em órgãos similares
4. Modelo de contratação via pregão eletrônico

Gostaria de agendar uma reunião para apresentar. Terça ou quinta da próxima semana funcionam?

Atenciosamente,
Equipe VAMO');

-- ============================================
-- FAQ
-- ============================================
INSERT INTO public.faq (pergunta, resposta, ordem) VALUES
('Como funciona o período de onboarding?', 'O onboarding leva em média 7 dias úteis. Incluímos configuração completa do CRM, importação de dados existentes, personalização de funil, treinamento da equipe e acompanhamento intensivo na primeira semana de uso.', 1),
('Posso cancelar a qualquer momento?', 'Sim! Nossos contratos para o produto Core são mensais e podem ser cancelados com 30 dias de antecedência, sem multa. Para projetos High Ticket (setor público), os termos seguem o contrato específico firmado.', 2),
('Quantos usuários posso adicionar?', 'Depende do pacote escolhido: Entrada permite 1 usuário, Padrão até 5 usuários, e Premium oferece usuários ilimitados. Usuários adicionais no plano Padrão custam R$ 500/mês cada.', 3),
('Vocês oferecem suporte para setor público?', 'Sim! Nosso produto High Ticket é especializado em soluções para setor público, incluindo total compliance com LGPD, aderência a processos licitatórios, e experiência com pregão eletrônico e ata de registro de preços.', 4),
('Como funciona a integração com outras ferramentas?', 'No plano Premium, oferecemos integrações customizadas com ERP, WhatsApp Business API, sistemas de e-mail marketing e outras ferramentas. No plano Padrão, disponibilizamos integrações nativas com as principais plataformas do mercado.', 5),
('Qual o prazo para ver resultados?', 'Em média, nossos clientes veem aumento de 30-40% no pipeline qualificado nos primeiros 90 dias. O ROI completo geralmente é atingido entre o 2º e 3º mês de uso, considerando o aumento de conversão e redução de churn no funil.', 6),
('Vocês oferecem treinamento para a equipe?', 'Sim! Todos os planos incluem treinamento inicial. O plano Premium inclui treinamento presencial e sessões mensais de reciclagem. Os planos Entrada e Padrão oferecem treinamento via videochamada e acesso à nossa base de conhecimento.', 7),
('Como funciona o suporte?', 'Entrada: suporte por e-mail em horário comercial (resposta em até 24h). Padrão: suporte prioritário por e-mail e chat (resposta em até 4h). Premium: suporte dedicado com SLA de 4h para bugs críticos, canal direto via WhatsApp.', 8);

-- ============================================
-- Templates de Contrato
-- ============================================
INSERT INTO public.templates_contrato (tipo, titulo, conteudo, versao) VALUES
('nda', 'Termo de Confidencialidade (NDA)', '# TERMO DE CONFIDENCIALIDADE E NÃO DIVULGAÇÃO

Pelo presente instrumento, as partes abaixo qualificadas firmam o presente Termo de Confidencialidade e Não Divulgação ("Termo"), que se regerá pelas cláusulas e condições seguintes:

## 1. PARTES

**PARTE REVELADORA:** VAMO Tecnologia e Consultoria LTDA., inscrita no CNPJ sob nº XX.XXX.XXX/0001-XX.

**PARTE RECEPTORA:** {{cliente_razao_social}}, inscrita no CNPJ sob nº {{cliente_cnpj}}.

## 2. OBJETO

O presente Termo tem por objeto estabelecer as condições de sigilo e confidencialidade que deverão ser observadas pelas Partes em relação às informações compartilhadas durante as negociações e/ou execução de serviços.

## 3. INFORMAÇÕES CONFIDENCIAIS

São consideradas Informações Confidenciais: dados comerciais, financeiros, técnicos, estratégicos, processos, metodologias, relatórios, listas de clientes, e quaisquer outras informações não públicas compartilhadas entre as partes.

## 4. OBRIGAÇÕES

A Parte Receptora se compromete a:
- Utilizar as Informações Confidenciais exclusivamente para a finalidade acordada;
- Não divulgar a terceiros sem autorização prévia e por escrito;
- Restringir o acesso às pessoas estritamente necessárias;
- Devolver ou destruir as informações quando solicitado.

## 5. VIGÊNCIA

Este Termo terá vigência de 2 (dois) anos a partir da data de assinatura, permanecendo em vigor mesmo após o término da relação comercial entre as partes.

## 6. PENALIDADES

O descumprimento deste Termo sujeitará a parte infratora ao pagamento de indenização por perdas e danos, sem prejuízo das demais medidas judiciais cabíveis.

---

**Data:** {{data}}

**PARTE REVELADORA:** ___________________________
VAMO Tecnologia e Consultoria LTDA.

**PARTE RECEPTORA:** ___________________________
{{cliente_razao_social}}', '1.0'),

('pj', 'Contrato de Prestação de Serviços PJ', '# CONTRATO DE PRESTAÇÃO DE SERVIÇOS

## CONTRATANTE
{{cliente_razao_social}}, CNPJ: {{cliente_cnpj}}

## CONTRATADA
VAMO Tecnologia e Consultoria LTDA.

## 1. OBJETO
Prestação de serviços de consultoria e fornecimento de plataforma de performance comercial, conforme pacote {{pacote}} descrito na proposta comercial nº {{proposta_id}}.

## 2. VALOR E PAGAMENTO
Valor mensal: R$ {{valor_mensal}}
Forma de pagamento: Boleto bancário ou PIX, com vencimento todo dia {{dia_vencimento}} de cada mês.

## 3. VIGÊNCIA
Este contrato tem vigência de {{vigencia_meses}} meses, com renovação automática por períodos iguais.

## 4. RESCISÃO
Qualquer das partes poderá rescindir mediante aviso prévio de 30 dias.

## 5. CONFIDENCIALIDADE
As partes se comprometem a manter sigilo sobre informações confidenciais.

---

Local e data: {{cidade}}, {{data}}

Assinaturas: ___________________________', '1.0');

-- ============================================
-- Empresa
-- ============================================
INSERT INTO public.empresa (razao_social, cnpj, regime_tributario, cnae, endereco, inscricao_municipal) VALUES
('VAMO Tecnologia e Consultoria LTDA', '12.345.678/0001-90', 'Simples Nacional', '6201-5/00 - Desenvolvimento de programas de computador sob encomenda', 'Av. Paulista, 1000, Sala 500 - Bela Vista, São Paulo/SP - CEP 01310-100', '1.234.567-8');

-- ============================================
-- Ferramentas
-- ============================================
INSERT INTO public.ferramentas (nome, categoria, url, conta_compartilhada) VALUES
('Supabase', 'Database/Backend', 'https://supabase.com', true),
('Vercel', 'Hosting/Deploy', 'https://vercel.com', true),
('GitHub', 'Código/Versionamento', 'https://github.com', true),
('Figma', 'Design/UI', 'https://figma.com', true),
('Google Workspace', 'Comunicação/Documentos', 'https://workspace.google.com', true),
('WhatsApp Business', 'Comunicação/Vendas', 'https://business.whatsapp.com', false),
('LinkedIn Sales Navigator', 'Prospecção', 'https://www.linkedin.com/sales', false),
('Canva', 'Design/Marketing', 'https://canva.com', true),
('Notion', 'Documentação/Wiki', 'https://notion.so', true),
('Slack', 'Comunicação Interna', 'https://slack.com', true);

-- ============================================
-- Integrações
-- ============================================
INSERT INTO public.integracoes (origem, destino, fluxo, automacao) VALUES
('Supabase', 'Vercel (Next.js)', 'Backend → Frontend', 'Deploy automático via Git push no GitHub'),
('VAMO Platform', 'Clicksign', 'Contratos → Assinatura Digital', 'Webhook atualiza status do contrato ao assinar'),
('VAMO Platform', 'NFe.io', 'Cobranças → Notas Fiscais', 'Emissão automática de NF-e após confirmação de pagamento'),
('VAMO Platform', 'Asaas', 'Cobranças → Boletos/PIX', 'Geração automática de boleto e link PIX ao criar cobrança'),
('VAMO Platform', 'Google Calendar', 'Reuniões → Agenda', 'Sincronização automática de reuniões agendadas'),
('VAMO Platform', 'SendGrid', 'Notificações → E-mail', 'Envio de e-mails de follow-up e notificações automáticas');

-- ============================================
-- Configurações
-- ============================================
INSERT INTO public.configuracoes (chave, valor, descricao) VALUES
('dias_envio_proposta', '2', 'Dias para enviar proposta após reunião realizada'),
('quantidade_follow_ups', '3', 'Quantidade de follow-ups após envio de proposta'),
('intervalo_follow_up', '3', 'Intervalo em dias entre cada follow-up'),
('meta_contatos_semana', '30', 'Meta semanal de novos contatos por colaborador'),
('meta_reunioes_semana', '5', 'Meta semanal de reuniões agendadas por colaborador'),
('meta_revenue_mensal', '50000', 'Meta de receita mensal em R$'),
('sla_bug_critico', '4', 'SLA em horas para bugs críticos'),
('sla_bug_alto', '24', 'SLA em horas para bugs de alta severidade'),
('sla_bug_medio', '48', 'SLA em horas para bugs de média severidade'),
('sla_bug_baixo', '72', 'SLA em horas para bugs de baixa severidade'),
('tolerancia_inadimplencia', '5', 'Dias úteis de tolerância após vencimento'),
('juros_atraso', '2', 'Percentual de juros por atraso'),
('dias_suspensao', '30', 'Dias de atraso para suspensão do acesso');

-- ============================================
-- Sócios
-- ============================================
INSERT INTO public.socios (nome, percentual, prolabore_mensal, regras) VALUES
('Sócio 1', 50.00, 8000.00, 'Responsável por: Estratégia comercial, vendas high ticket, relações institucionais e parcerias. Distribuição de lucros: trimestral, proporcional à participação, após reserva de 20% para reinvestimento.'),
('Sócio 2', 50.00, 8000.00, 'Responsável por: Operações, produto, tecnologia e marketing digital. Distribuição de lucros: trimestral, proporcional à participação, após reserva de 20% para reinvestimento.');

-- ============================================
-- Rituais
-- ============================================
INSERT INTO public.rituais (tipo, pauta, data_hora) VALUES
('Weekly Sócios', 'Pauta: 1) Review dos KPIs da semana 2) Pipeline e forecast 3) Decisões estratégicas pendentes 4) Action items para próxima semana', NOW() + INTERVAL '1 day'),
('Review Mensal', 'Pauta: 1) Resultados financeiros do mês 2) Roadmap de produto 3) Ações de marketing 4) Planejamento do próximo mês', NOW() + INTERVAL '15 days'),
('Retrospectiva', 'Pauta: 1) O que funcionou bem? 2) O que podemos melhorar? 3) Experimentos para testar 4) Prioridades do próximo ciclo', NOW() + INTERVAL '30 days');

-- ============================================
-- Prestadores
-- ============================================
INSERT INTO public.prestadores (nome, especialidade, status) VALUES
('Desenvolvedor Full-Stack', 'Next.js, React, Supabase, Node.js', 'ativo'),
('UI/UX Designer', 'Figma, Design System, Prototipação', 'ativo'),
('Copywriter', 'Copywriting comercial, e-mail marketing, conteúdo LinkedIn', 'inativo');

-- ============================================
-- Cargos (Organograma)
-- ============================================
INSERT INTO public.cargos (id, nome, responsabilidades, superior_id) VALUES
('a0000001-0000-0000-0000-000000000001', 'CEO / Sócio-Fundador', 'Estratégia, vendas high ticket, parcerias institucionais, relações com investidores', NULL),
('a0000001-0000-0000-0000-000000000002', 'COO / Sócio-Fundador', 'Operações, produto, tecnologia, marketing digital', NULL),
('a0000001-0000-0000-0000-000000000003', 'Closer', 'Fechamento de vendas, negociação, apresentação de propostas', 'a0000001-0000-0000-0000-000000000001'),
('a0000001-0000-0000-0000-000000000004', 'SDR', 'Prospecção ativa, qualificação de leads, agendamento de reuniões', 'a0000001-0000-0000-0000-000000000001'),
('a0000001-0000-0000-0000-000000000005', 'Desenvolvedor', 'Desenvolvimento da plataforma, manutenção, novos features', 'a0000001-0000-0000-0000-000000000002'),
('a0000001-0000-0000-0000-000000000006', 'Designer', 'UI/UX da plataforma, materiais de marketing, brand', 'a0000001-0000-0000-0000-000000000002');
