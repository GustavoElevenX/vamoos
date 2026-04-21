'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color?: 'green' | 'emerald' | 'amber' | 'sky' | 'rose';
}

export function StatCard({ title, value, change, changeLabel, icon: Icon }: StatCardProps) {
  const positive = change !== undefined && change > 0;
  const negative = change !== undefined && change < 0;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid #00FF57',
        borderRadius: 8,
        padding: '16px 18px',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,87,0.3)'; (e.currentTarget as HTMLElement).style.borderLeftColor = '#00FF57'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.borderLeftColor = '#00FF57'; }}
    >
      {/* Label */}
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.02em' }}>
        {title}
      </p>

      {/* Value */}
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          lineHeight: 1,
          marginBottom: 10,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>

      {/* Change */}
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {positive && <TrendingUp style={{ width: 11, height: 11, color: '#00FF57' }} />}
          {negative && <TrendingDown style={{ width: 11, height: 11, color: '#ef4444' }} />}
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: positive ? '#00FF57' : negative ? '#ef4444' : 'var(--text-muted)',
            }}
          >
            {positive ? '+' : ''}{change}%
            {changeLabel && (
              <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}> {changeLabel}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
