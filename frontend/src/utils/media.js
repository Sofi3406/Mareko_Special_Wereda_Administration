import { API_BASE } from '../services/api';

const API_ROOT = API_BASE.replace(/\/api\/?$/, '');

export const getMediaUrl = (mediaPath) => {
  if (!mediaPath) {
    return '';
  }

  if (/^https?:\/\//i.test(mediaPath)) {
    return mediaPath;
  }

  const normalizedPath = String(mediaPath)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^(?:\.\/)+/, '');

  if (normalizedPath.startsWith('uploads/')) {
    return `${API_ROOT}/${normalizedPath}`;
  }

  return `${API_ROOT}/uploads/${normalizedPath}`;
};
