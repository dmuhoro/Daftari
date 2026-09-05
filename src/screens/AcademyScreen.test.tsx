import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AcademyScreen from './AcademyScreen';

// vi.hoisted: the mock factory is hoisted above top-level consts, so a
// top-level `const mockX = vi.fn()` is unreachable from inside the factory.
const { mockMarkLessonCompleted } = vi.hoisted(() => ({ mockMarkLessonCompleted: vi.fn() }));

vi.mock('../lib/store', () => {
  const storeState = {
    completedLessonIds: ['debt_mastery'],
    markLessonCompleted: mockMarkLessonCompleted,
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

vi.mock('../lib/analytics', () => ({
  track: vi.fn(),
  EVENTS: {},
}));

describe('AcademyScreen (Daftari Academy Micro-Learning Engine)', () => {
  const onBackMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progress bar and list of micro-lessons', () => {
    render(<AcademyScreen onBack={onBackMock} />);

    expect(screen.getByText('Daftari Academy')).toBeDefined();
    expect(screen.getByText('Maendeleo Yako')).toBeDefined();
    expect(screen.getByText('1/4 (25%)')).toBeDefined();
    expect(screen.getByText('Jinsi ya Kufuatilia Madeni Bila Kugombana na Wateja')).toBeDefined();
    expect(screen.getByText('Mbinu ya Kutenga Pesa za Biashara na za Nyumbani')).toBeDefined();
  });

  it('filters lessons when category filter chips are clicked', () => {
    render(<AcademyScreen onBack={onBackMock} />);

    const debtFilterBtn = screen.getByText('Madeni');
    fireEvent.click(debtFilterBtn);

    expect(screen.getByText('Jinsi ya Kufuatilia Madeni Bila Kugombana na Wateja')).toBeDefined();
    expect(screen.queryByText('Mbinu ya Kutenga Pesa za Biashara na za Nyumbani')).toBeNull();
  });

  it('opens lesson modal reader when a lesson card is tapped', () => {
    render(<AcademyScreen onBack={onBackMock} />);

    const lessonCard = screen.getByText('Mbinu ya Kutenga Pesa za Biashara na za Nyumbani');
    fireEvent.click(lessonCard);

    expect(screen.getByText('2 dakika za kusoma')).toBeDefined();
    expect(screen.getByText('Jaribio Fupi (Micro-Quiz)')).toBeDefined();
    expect(
      screen.getByText('Kwa nini si vizuri kutoa pesa za mauzo kila saa kununua vitu vya nyumbani?')
    ).toBeDefined();
  });

  it('validates quiz answers and calls markLessonCompleted on correct answer', () => {
    render(<AcademyScreen onBack={onBackMock} />);

    fireEvent.click(screen.getByText('Mbinu ya Kutenga Pesa za Biashara na za Nyumbani'));

    const correctAnswerOption = screen.getByText(
      'Sababu inamaliza mtaji wa kununua bidhaa mpya na inaficha faida halisi'
    );
    fireEvent.click(correctAnswerOption);

    expect(mockMarkLessonCompleted).toHaveBeenCalledWith('profit_separation');
  });
});
