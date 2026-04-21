'use client';

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Target, PhoneCall, Calendar,
  FileText, FileSignature, Package, Megaphone, DollarSign,
  Scale, UserCircle, Cpu, Settings,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/contexts/user-context';
import { getInitials } from '@/lib/utils';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

/* Flat nav list — sem seções, igual ao screenshot */
const navItems = [
  { label: 'Dashboard',   icon: LayoutDashboard, href: '/dashboard' },
  { label: 'CRM & Leads', icon: Users,           href: '/crm/leads' },
  { label: 'ICP',         icon: Target,          href: '/crm/icp' },
  { label: 'Prospecção',  icon: PhoneCall,       href: '/prospeccao/scripts' },
  { label: 'Reuniões',    icon: Calendar,        href: '/reunioes' },
  { label: 'Propostas',   icon: FileText,        href: '/propostas' },
  { label: 'Contratos',   icon: FileSignature,   href: '/contratos' },
  { label: 'Produto',     icon: Package,         href: '/produto' },
  { label: 'Marketing',   icon: Megaphone,       href: '/marketing' },
  { label: 'Financeiro',  icon: DollarSign,      href: '/financeiro' },
  { label: 'Jurídico',   icon: Scale,           href: '/juridico' },
  { label: 'Pessoas',     icon: UserCircle,      href: '/pessoas' },
  { label: 'Tecnologia',  icon: Cpu,             href: '/tecnologia' },
  { label: 'Configurações', icon: Settings,      href: '/configuracoes' },
];

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex h-screen" style={{ background: 'var(--bg-app)' }}>
        <Sidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const { nome, email, role, loading } = useUser();

  const displayName = nome ?? email?.split('@')[0] ?? 'Usuário';
  const displayInitial = loading ? '…' : getInitials(nome ?? email ?? 'U');

  return (
    <aside
      style={{
        width: collapsed ? 52 : 188,
        background: 'var(--bg-subtle)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.25s ease',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: collapsed ? '0 14px' : '0 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          justifyContent: collapsed ? 'center' : undefined,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'rgba(0,255,87,0.1)',
            border: '1px solid rgba(0,255,87,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Image
            src="/logo.png"
            alt="VAMOOS"
            width={14}
            height={14}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(0,255,87,0.6))' }}
            onError={() => {}}
          />
        </div>
        {!collapsed && (
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            VAMOOS
          </span>
        )}
      </div>

      {/* Nav */}
      <ScrollArea style={{ flex: 1 }}>
        <nav style={{ padding: '8px 6px' }}>
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  height: 34,
                  padding: collapsed ? '0' : '0 10px',
                  borderRadius: 7,
                  marginBottom: 1,
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#00FF57' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(0,255,87,0.08)' : 'transparent',
                  transition: 'background 0.12s, color 0.12s',
                  justifyContent: collapsed ? 'center' : undefined,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.05)';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
                  }
                }}
              >
                <item.icon
                  style={{
                    width: 15,
                    height: 15,
                    flexShrink: 0,
                    color: isActive ? '#00FF57' : undefined,
                  }}
                />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <div
        style={{
          padding: '10px 10px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: collapsed ? 'center' : undefined,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(0,255,87,0.1)',
            border: `1px solid ${loading ? 'var(--border)' : 'rgba(0,255,87,0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: loading ? 'var(--text-faint)' : '#00FF57',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          {displayInitial}
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {loading ? '...' : displayName}
            </p>
            <p style={{ fontSize: 10.5, color: 'var(--text-faint)', lineHeight: 1.2, textTransform: 'capitalize' }}>
              {loading ? '' : (role ?? 'colaborador')}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
