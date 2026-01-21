// Backend URL - defaults to Docker service name if running in container
// Can be overridden via VITE_BACKEND_URL environment variable
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
