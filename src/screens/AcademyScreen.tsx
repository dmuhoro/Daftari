import { useState } from 'react';
import {
  ChevronLeft, GraduationCap, Clock, CheckCircle2, BookOpen,
  ArrowRight, Award, Receipt, Wallet, Package, Smartphone, X, HelpCircle
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../lib/store';
import Card from '../components/ui/Card';
import { ACADEMY_LESSONS, type Lesson } from '../features/academy/lessons';
import { track } from '../lib/analytics';

const CATEGORY_ICONS: Record<string, typeof Receipt> = {
  debt: Receipt,
  profit: Wallet,
  inventory: Package,
  digital_pay: Smartphone,
};

interface AcademyScreenProps {
  onBack: () => void;
}

export default function AcademyScreen({ onBack }: AcademyScreenProps) {
  const { language } = useTranslation();
  const completedLessonIds = useStore((s) => s.completedLessonIds || []);
  const markLessonCompleted = useStore((s) => s.markLessonCompleted);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const isSw = language === 'sw';

  const categories = [
    { id: 'all', label: isSw ? 'Yote' : 'All' },
    { id: 'debt', label: isSw ? 'Madeni' : 'Debts' },
    { id: 'profit', label: isSw ? 'Faida & Mtaji' : 'Profit & Cash' },
    { id: 'inventory', label: isSw ? 'Stock & Bidhaa' : 'Stock & Items' },
    { id: 'digital_pay', label: isSw ? 'M-Pesa & Digital' : 'Digital Pay' },
  ];

  const filteredLessons = selectedCategory === 'all'
    ? ACADEMY_LESSONS
    : ACADEMY_LESSONS.filter((l) => l.category === selectedCategory);

  const totalLessons = ACADEMY_LESSONS.length;
  const completedCount = ACADEMY_LESSONS.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  function handleOpenLesson(lesson: Lesson) {
    setActiveLesson(lesson);
    setSelectedOptionId(null);
    setHasAnswered(false);
    track('academy_lesson_opened', { lesson_id: lesson.id });
  }

  function handleAnswerQuiz(optionId: string, isCorrect: boolean) {
    setSelectedOptionId(optionId);
    setHasAnswered(true);

    if (isCorrect && activeLesson) {
      markLessonCompleted(activeLesson.id);
      track('academy_quiz_passed', { lesson_id: activeLesson.id });
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background dark:bg-stone-950 font-sans">
      <header className="bg-white dark:bg-stone-900 border-b border-border dark:border-stone-700 px-4 sticky top-0 z-30">
        <div className="flex items-center h-14 gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 -ml-1"
          >
            <ChevronLeft className="w-5 h-5 text-ink dark:text-stone-100" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-ink dark:text-stone-100 text-base">
              Daftari Academy
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4 pb-20">
        {/* Progress Banner */}
        <Card padding="p-5" variant="subtle">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {isSw ? 'Maendeleo Yako' : 'Your Learning Progress'}
                </p>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {completedCount}/{totalLessons} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Lessons List */}
        <div className="flex flex-col gap-3">
          {filteredLessons.map((lesson) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            const Icon = CATEGORY_ICONS[lesson.category] || BookOpen;

            return (
              <Card
                key={lesson.id}
                padding="p-4"
                onClick={() => handleOpenLesson(lesson)}
                className="cursor-pointer hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {lesson.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {lesson.readTimeMinutes} min
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                      {lesson.title[language as 'sw' | 'en'] || lesson.title.sw}
                    </h3>

                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                      {lesson.summary[language as 'sw' | 'en'] || lesson.summary.sw}
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-stone-400 flex-shrink-0 self-center" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reader & Quiz Modal */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  {activeLesson.category.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setActiveLesson(null)}
                className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Reader */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 leading-snug">
                  {activeLesson.title[language as 'sw' | 'en'] || activeLesson.title.sw}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{activeLesson.readTimeMinutes} {isSw ? 'dakika za kusoma' : 'min read'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 my-2">
                {(activeLesson.content[language as 'sw' | 'en'] || activeLesson.content.sw).map(
                  (paragraph, idx) => (
                    <p key={idx} className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                      {paragraph}
                    </p>
                  )
                )}
              </div>

              {/* Interactive Quiz Section */}
              <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isSw ? 'Jaribio Fupi (Micro-Quiz)' : 'Micro-Quiz Check'}
                  </span>
                </div>

                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {activeLesson.quiz.question[language as 'sw' | 'en'] || activeLesson.quiz.question.sw}
                </p>

                <div className="flex flex-col gap-2">
                  {activeLesson.quiz.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    let btnStyle = 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200';

                    if (hasAnswered && isSelected) {
                      btnStyle = opt.correct
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-red-500 text-white border-red-500';
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswerQuiz(opt.id, opt.correct)}
                        disabled={hasAnswered && opt.correct}
                        className={`p-3.5 rounded-2xl border text-left text-xs font-semibold transition-all ${btnStyle}`}
                      >
                        {opt.label[language as 'sw' | 'en'] || opt.label.sw}
                      </button>
                    );
                  })}
                </div>

                {hasAnswered && (
                  <div className={`p-3.5 rounded-2xl text-xs font-medium mt-1 ${
                    selectedOptionId && activeLesson.quiz.options.find(o => o.id === selectedOptionId)?.correct
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}>
                    {activeLesson.quiz.explanation[language as 'sw' | 'en'] || activeLesson.quiz.explanation.sw}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
