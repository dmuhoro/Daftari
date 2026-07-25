import { initSentry } from './lib/sentry'
import { initMonitoring } from './lib/monitoring'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

initSentry()
initMonitoring()

const IS_E2E = import.meta.env.VITE_E2E === 'true' || window.location.search.includes('e2e=true');

async function bootstrap() {
  if (IS_E2E) {
    try {
      const { seedE2eData } = await import('./lib/e2e');
      await seedE2eData();
    } catch (err) {
      console.error('[E2E] seeding failed:', err);
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
