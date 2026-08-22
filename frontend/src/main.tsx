import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Initialize theme from localStorage on app start
const storedTheme = localStorage.getItem('theme-storage');
if (storedTheme) {
  try {
    const parsed = JSON.parse(storedTheme);
    const theme = parsed?.state?.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
} else {
  document.documentElement.setAttribute('data-theme', 'dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
