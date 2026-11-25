export const colors = {
  bg: '#121212',
  surface: '#1A1A1C',
  card: '#222225',
  brown: '#5C3A21',
  brownLight: '#8B5E3C',
  gold: '#C89B3C',
  cream: '#F8F3ED',
  white: '#FFFFFF',
  muted: '#9C9388',
  border: '#2E2E32',
  danger: '#E5484D',
  ok: '#4CAF7A',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 12, md: 18, lg: 26 };

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.35,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

export const brl = (n) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const CATS = [
  { k: 'Cafés', e: '☕' },
  { k: 'Padaria', e: '🥐' },
  { k: 'Doces', e: '🍰' },
  { k: 'Gelados', e: '🥤' },
];

export const catEmoji = (c) => (CATS.find((x) => x.k === c) || { e: '☕' }).e;

export const STATUS = { novo: 'Novo', preparando: 'Preparando', pronto: 'Pronto', finalizado: 'Finalizado' };
export const STATUS_COLOR = { novo: '#C89B3C', preparando: '#5B9BD5', pronto: '#4CAF7A', finalizado: '#9C9388' };
export const NEXT_STATUS = { novo: 'preparando', preparando: 'pronto', pronto: 'finalizado' };
export const COUPONS = { MCS10: 0.1, CAFE15: 0.15 };
export const DELIVERY_FEE = 6;
