'use client';

import React from 'react';

function pulse(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 5,
    animation: 'pulse 1.5s ease-in-out infinite',
    ...extra,
  };
}

// ── Skeleton primitives ──────────────────────

export function SkeletonLine({ width = '100%', height = 12 }: { width?: string | number; height?: number }) {
  return <div style={pulse({ width, height, borderRadius: 4 })} />;
}

export function SkeletonBlock({ height = 40 }: { height?: number }) {
  return <div style={pulse({ width: '100%', height, borderRadius: 6 })} />;
}

// ── Table row skeleton ────────────────────────
export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        alignItems: 'center',
        padding: '9px 16px',
        gap: 12,
        borderBottom: '1px solid var(--border)',
      }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? '70%' : '55%'} height={11} />
      ))}
    </div>
  );
}

// ── Kanban card skeleton ──────────────────────
export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--bg-hover)',
        border: '1px solid var(--border)',
        borderLeft: '2px solid rgba(255,255,255,0.06)',
        borderRadius: 6,
        padding: '10px 10px',
      }}
    >
      <SkeletonLine width="65%" height={12} />
      <div style={{ marginTop: 6 }}>
        <SkeletonLine width="45%" height={10} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <SkeletonLine width={32} height={18} />
        <SkeletonLine width={32} height={18} />
      </div>
      <div style={{ marginTop: 8 }}>
        <SkeletonLine width="40%" height={12} />
      </div>
    </div>
  );
}

// ── Stat card skeleton ────────────────────────
export function SkeletonStatCard() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '14px 16px',
      }}
    >
      <SkeletonLine width="55%" height={10} />
      <div style={{ marginTop: 10 }}>
        <SkeletonLine width="40%" height={22} />
      </div>
    </div>
  );
}

// ── Generic page content skeleton ────────────
export function SkeletonPage({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} height={44} />
      ))}
    </div>
  );
}

// Inject keyframe once into the document
if (typeof document !== 'undefined') {
  const styleId = 'vamoos-skeleton-pulse';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
  }
}
