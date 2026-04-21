'use client';

import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  const { nome, email, loading } = useUser();
  const initial = loading ? '…' : getInitials(nome ?? email ?? 'U');

  return (
    <header
      style={{
        height: 48,
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
      }}
    >
      {/* Left: title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {title}
        </span>
        {subtitle && (
          <>
            <span style={{ color: 'var(--border-strong)', fontSize: 15 }}>/</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{subtitle}</span>
          </>
        )}
      </div>

      {/* Right: search + bell + avatar + optional children */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            style={{
              position: 'absolute',
              left: 9,
              width: 13,
              height: 13,
              color: 'var(--text-faint)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            placeholder="Pesquisar..."
            style={{
              height: 30,
              width: 200,
              paddingLeft: 30,
              paddingRight: 10,
              fontSize: 12,
              background: 'rgba(0,255,87,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 7,
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,255,87,0.35)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Bell */}
        <button
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            color: 'var(--text-muted)',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,87,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <Bell style={{ width: 14, height: 14 }} />
          <span
            style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#00FF57',
              boxShadow: '0 0 5px #00FF57',
            }}
          />
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(0,255,87,0.1)',
            border: `1px solid ${loading ? 'var(--border)' : 'rgba(0,255,87,0.22)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: loading ? 'var(--text-faint)' : '#00FF57',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {initial}
        </div>

        {children}
      </div>
    </header>
  );
}
