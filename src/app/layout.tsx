import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VAMO | Plataforma de Gestão',
  description: 'Plataforma completa de gestão empresarial VAMO - CRM, Propostas, Contratos, Financeiro e mais.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
