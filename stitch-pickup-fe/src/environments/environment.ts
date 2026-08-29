const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

export const environment = {
  production: !isLocal,
  apiBaseUrl: isLocal ? 'http://localhost:8080/api/v1' : '/api/v1',
  apiUrl: isLocal ? 'http://localhost:8080/api/v1' : '/api/v1',
  wsUrl: isLocal ? 'http://localhost:8080/ws' : '/ws',
};
