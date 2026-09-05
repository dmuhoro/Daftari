import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InstallBanner from './InstallBanner';

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'sw',
  }),
}));

vi.mock('../hooks/usePWAInstall', () => ({
  usePWAInstall: () => ({ canInstall: hoisted.canInstallState.value, install: hoisted.installFn }),
}));

const hoisted = vi.hoisted(() => {
  const canInstallState = { value: false };
  const installFn = vi.fn();
  return { canInstallState, installFn };
});

vi.mock('../hooks/usePWAInstall', () => ({
  usePWAInstall: () => ({ canInstall: hoisted.canInstallState.value, install: hoisted.installFn }),
}));

function setCanInstall(v: boolean) {
  hoisted.canInstallState.value = v;
}

function setStandalone(v: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: v, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
}

function setIOS() {
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' });
  setStandalone(false);
}

function setAndroid() {
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36' });
  setStandalone(false);
}

beforeEach(() => {
  setCanInstall(true);
  setAndroid();
  hoisted.installFn.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('InstallBanner', () => {
  it('shows the install CTA when the app is installable and not yet installed', () => {
    render(<InstallBanner />);
    expect(screen.getByTestId('install-banner-cta')).toBeInTheDocument();
    expect(screen.getByText('install')).toBeInTheDocument();
  });

  it('hides entirely once the app is running installed (display-mode: standalone)', () => {
    setStandalone(true);
    const { container } = render(<InstallBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('runs the install flow when Install is tapped', () => {
    render(<InstallBanner />);
    fireEvent.click(screen.getByText('install'));
    expect(hoisted.installFn).toHaveBeenCalledTimes(1);
  });

  it('dismisses the banner without installing', () => {
    render(<InstallBanner />);
    fireEvent.click(screen.getByTestId('install-banner-dismiss'));
    expect(screen.queryByTestId('install-banner-cta')).not.toBeInTheDocument();
  });

  it('offers no CTA before the browser fires beforeinstallprompt', () => {
    setCanInstall(false);
    const { container } = render(<InstallBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows iOS guidance when on iOS Safari (no install prompt event exists there)', () => {
    setCanInstall(false);
    setIOS();
    render(<InstallBanner />);
    expect(screen.getByTestId('install-banner-ios')).toBeInTheDocument();
  });

  it('hides the iOS guidance once dismissed', () => {
    setCanInstall(false);
    setIOS();
    render(<InstallBanner />);
    fireEvent.click(screen.getByTestId('install-banner-dismiss'));
    expect(screen.queryByTestId('install-banner-ios')).not.toBeInTheDocument();
  });
});