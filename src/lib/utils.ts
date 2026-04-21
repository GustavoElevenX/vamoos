import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const FUNNEL_STAGES = [
  'Prospecção',
  'Reunião agendada',
  'Diagnóstico',
  'Proposta enviada',
  'Negociação',
  'Fechado',
  'Perdido',
] as const;

export const LEAD_SOURCES = ['cold', 'warm', 'inbound'] as const;
export const PRODUCTS = ['core', 'high_ticket'] as const;
export const CHANNELS = ['LinkedIn', 'WhatsApp', 'E-mail', 'Telefone'] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type Product = (typeof PRODUCTS)[number];
export type Channel = (typeof CHANNELS)[number];
