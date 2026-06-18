export const IS_DEV = import.meta.env.DEV;

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').toString().trim();
const defaultApiUrl = IS_DEV
  ? 'http://localhost:8000'
  : 'https://afisha.itcube-norilsk.tech/api';

export const API_URL = configuredApiUrl || defaultApiUrl;
