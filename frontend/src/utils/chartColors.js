export const CHART_PALETTE = [
  '#d97706',
  '#ea580c',
  '#f59e0b',
  '#0ea5e9',
  '#8b5cf6',
  '#16a34a',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
  '#84cc16',
  '#f97316'
];

export const STATUS_CHART_COLORS = {
  Pending: '#eab308',
  'In Progress': '#3b82f6',
  Resolved: '#16a34a',
  Rejected: '#ef4444'
};

export const TREND_LINE_COLOR = '#d97706';

export const getPaletteColor = (index) => CHART_PALETTE[index % CHART_PALETTE.length];

export const getStatusColor = (status) =>
  STATUS_CHART_COLORS[status] || getPaletteColor(0);

export const getLabelColor = (label, index = 0) =>
  STATUS_CHART_COLORS[label] || getPaletteColor(index);
