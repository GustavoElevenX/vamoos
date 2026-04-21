export default function LGPDPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, background: 'rgba(0,255,87,0.06)', border: '1px solid rgba(0,255,87,0.15)', borderRadius: 6, padding: '4px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF57' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#00FF57', letterSpacing: '0.08em', textTransform: 'uppercase' }}>VAMOOS</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Política de Privacidade
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
            VAMO Tecnologia e Consultoria LTDA. &mdash; Última atualização: 15/12/2024
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 40 }} />

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {[
            {
              heading: '1. Introdução',
              body: 'A VAMO Tecnologia e Consultoria LTDA ("VAMOOS", "nós") respeita a sua privacidade e se compromete a proteger os dados pessoais que você compartilha conosco, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).',
            },
            {
              heading: '2. Dados Coletados',
              body: 'Coletamos dados pessoais fornecidos diretamente por você durante o uso da plataforma: nome completo, endereço de e-mail, telefone, nome da empresa, cargo, e informações comerciais necessárias para a prestação dos nossos serviços.',
            },
            {
              heading: '3. Finalidade do Tratamento',
              list: [
                'Prestação dos serviços contratados',
                'Comunicação sobre produtos e atualizações',
                'Melhoria contínua da plataforma',
                'Cumprimento de obrigações legais e regulatórias',
                'Análise de desempenho e métricas agregadas',
              ],
            },
            {
              heading: '4. Compartilhamento de Dados',
              body: 'Seus dados não são vendidos a terceiros. Poderemos compartilhar dados com prestadores de serviço essenciais (hospedagem, processamento de pagamentos) sob contratos de confidencialidade, ou quando exigido por lei.',
            },
            {
              heading: '5. Segurança',
              body: 'Empregamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia, controle de acesso baseado em funções (RBAC), e auditorias regulares de segurança.',
            },
            {
              heading: '6. Seus Direitos',
              body: null,
              custom: (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  Você pode, a qualquer momento, solicitar acesso, correção, exclusão ou portabilidade dos seus dados através do e-mail:{' '}
                  <a
                    href="mailto:privacidade@vamo.com.br"
                    className="lgpd-link"
                  >
                    privacidade@vamo.com.br
                  </a>
                </p>
              ),
            },
            {
              heading: '7. Contato',
              body: null,
              custom: (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  Para dúvidas sobre esta política, entre em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail:{' '}
                  <a
                    href="mailto:dpo@vamo.com.br"
                    className="lgpd-link"
                  >
                    dpo@vamo.com.br
                  </a>
                </p>
              ),
            },
          ].map((section, i) => (
            <section key={i}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.01em' }}>
                {section.heading}
              </h2>
              {section.body && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{section.body}</p>
              )}
              {section.list && (
                <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {section.list.map((item, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00FF57', marginTop: 8, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.custom}
            </section>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            © 2025 VAMO Tecnologia e Consultoria LTDA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
