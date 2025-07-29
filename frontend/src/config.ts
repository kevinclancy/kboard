// Configuration for KBoard frontend
// For development, you can change this manually or set up environment variables
// For production builds served by Loco, use relative API paths
const isDevelopment = window.location.port === '3000';

export const API_ROOT = isDevelopment 
  ? 'http://127.0.0.1:5150/api'  // Dev server talks to backend on different port
  : '/api';                      // Production uses same origin