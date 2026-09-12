// Production uses the same origin as the backend. For local development, set localhost:5001.
window.ADDI_API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5001' : window.location.origin;
