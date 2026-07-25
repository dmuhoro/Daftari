import { initSentry } from './lib/sentry'
import { initMonitoring } from './lib/monitoring'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

initSentry()
initMonitoring()

const IS_E2E = import.meta.env.VITE_E2E === 'true';

async function bootstrap() {
  if (IS_E2E) {
    const { seedE2eData } = await import('./lib/e2e');
    await seedE2eData();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
