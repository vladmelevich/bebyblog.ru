// Централизованная конфигурация API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://93.183.80.220/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://93.183.80.220/ws';

// Функция для получения полного URL API
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

// Функция для получения WebSocket URL
export const getWsUrl = (endpoint) => {
  return `${WS_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export { API_BASE_URL, WS_BASE_URL };