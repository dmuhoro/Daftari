import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GrowthShareScreen from './GrowthShareScreen';

const mockShareViaWhatsApp = vi.fn();

vi.mock('../lib/store', () => {
  const storeState = {
    business: { name: 'Duka la Mama Amina', category: 'retail_shop' },
    transactions: [
      { id: '1', type: 'income', amount: 3500 },
      { id: '2', type: 'income', amount: 1500 },
      { id: '3', type: 'expense', amount: 800 },
    ],
    completedLessonIds: ['debt_mastery', 'profit_separation'],
  };
  const useStore = Object.assign(
    vi.fn((s?: (state: Record<string, unknown>) => unknown) =>
      s ? s(storeState as unknown as Record<string, unknown>) : storeState
    ),
    { getState: vi.fn(() => storeState) }
  );
  return { useStore };
});

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'sw',
  }),
}));

vi.mock('../lib/whatsapp', () => ({
  shareViaWhatsApp: (...args: unknown[]) => mockShareViaWhatsApp(...args),
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../lib/analytics', () => ({
  track: vi.fn(),
  EVENTS: { REFERRAL_LINK_SHARED: 'referral_link_shared' },
}));

describe('GrowthShareScreen (Growth Engine)', () => {
  const onBackMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, real-time stats, and story options', () => {
    render(<GrowthShareScreen onBack={onBackMock} />);

    expect(screen.getByText('Growth Engine')).toBeDefined();
    expect(screen.getByText('KES 5,000')).toBeDefined(); // 3500 + 1500
    expect(screen.getByText('2')).toBeDefined(); // 2 sales txs
    expect(screen.getByText('2/4')).toBeDefined(); // 2 academy lessons completed
  });

  it('allows switching story templates and updates preview', () => {
    render(<GrowthShareScreen onBack={onBackMock} />);

    const debtOption = screen.getByText('Ushindi wa Madeni: Kumbukumbu za WhatsApp');
    fireEvent.click(debtOption);

    expect(screen.getByText(/Duka la Mama Amina\*? inafuatilia madeni kwa njia ya kisasa/i)).toBeDefined();
  });

  it('triggers WhatsApp share when WhatsApp status button is clicked', () => {
    render(<GrowthShareScreen onBack={onBackMock} />);

    const whatsappBtn = screen.getByText('WhatsApp Status');
    fireEvent.click(whatsappBtn);

    expect(mockShareViaWhatsApp).toHaveBeenCalledTimes(1);
    expect(mockShareViaWhatsApp).toHaveBeenCalledWith(expect.stringContaining('Duka la Mama Amina'));
  });
});
