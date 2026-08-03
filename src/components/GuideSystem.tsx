import { useEffect, useState } from 'react';
import type { ComponentType, RefObject } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, X, HelpCircle } from 'lucide-react';

type Slide = {
  title: string;
  description: string;
  bullets: string[];
};

type OnboardingCarouselProps = {
  open: boolean;
  onFinish: () => void;
  onClose: () => void;
  slides: Slide[];
};

export function OnboardingCarousel({ open, onFinish, onClose, slides }: OnboardingCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const currentSlide = slides[activeIndex] ?? slides[0];

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles size={14} /> SwimSync 가이드
            </p>
            <h2 className="text-2xl font-bold">처음 만나는 팀의 핵심 경험을 한눈에 보여드려요</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              운영 관리부터 앱 미리보기, 서비스 기획까지 중요한 흐름을 카드형으로 순서대로 보여줍니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10"
          >
            건너뛰기
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[24px] border border-white/10 bg-white/10 p-6">
            <div className="mb-5 flex items-center gap-2 text-cyan-300">
              <Sparkles size={16} />
              <span className="text-sm font-semibold">{activeIndex + 1}/{slides.length}</span>
            </div>
            <h3 className="text-xl font-semibold text-white">{currentSlide.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{currentSlide.description}</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-200">
              {currentSlide.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] border border-cyan-400/20 bg-slate-800/70 p-6">
            <p className="mb-4 text-sm font-semibold text-slate-200">바로 따라할 수 있는 흐름</p>
            <div className="space-y-3">
              {slides.map((slide, index) => (
                <div
                  key={slide.title}
                  className={`rounded-2xl border p-3 transition ${index === activeIndex ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-white/10 bg-white/5'}`}
                >
                  <p className="text-sm font-semibold text-white">{slide.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{slide.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${index === activeIndex ? 'bg-cyan-400' : 'bg-white/25'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} /> 이전
            </button>
            {activeIndex < slides.length - 1 ? (
              <button
                onClick={() => setActiveIndex((prev) => prev + 1)}
                className="flex items-center gap-1 rounded-full bg-cyan-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400"
              >
                다음 <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={onFinish}
                className="flex items-center gap-1 rounded-full bg-cyan-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400"
              >
                시작하기 <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type InteractiveTooltipProps = {
  open: boolean;
  targetRef: RefObject<HTMLElement | null>;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  onClose: () => void;
};

export function InteractiveTooltip({
  open,
  targetRef,
  title,
  description,
  ctaLabel = '바로 시작하기',
  onCta,
  onClose,
}: InteractiveTooltipProps) {
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    const measure = () => {
      const target = targetRef.current;
      if (!target) {
        setRect(null);
        return;
      }
      const box = target.getBoundingClientRect();
      setRect({ left: box.left, top: box.top, width: box.width, height: box.height });
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, targetRef]);

  if (!open) return null;

  const safeRect = rect ?? { left: 80, top: 120, width: 220, height: 48 };

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none">
      <div
        className="absolute rounded-[20px] border border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_0_9999px_rgba(2,8,23,0.1)] pointer-events-none"
        style={{
          left: Math.max(8, safeRect.left - 12),
          top: Math.max(8, safeRect.top - 12),
          width: safeRect.width + 24,
          height: safeRect.height + 24,
        }}
      />
      <div
        className="absolute max-w-[280px] rounded-2xl border border-white/10 bg-white p-4 text-slate-700 shadow-2xl pointer-events-auto"
        style={{
          left: Math.min(window.innerWidth - 300, safeRect.left + safeRect.width + 16),
          top: Math.max(16, safeRect.top + 6),
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">인터랙티브 가이드</p>
        <h3 className="mt-2 text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-4 flex items-center gap-2">
          {onCta && (
            <button
              onClick={onCta}
              className="rounded-full bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              {ctaLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

type EmptyStateGuideProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
};

export function EmptyStateGuide({ icon: Icon, title, description, ctaLabel, onCta }: EmptyStateGuideProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-600/10 text-cyan-700">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
      <button
        onClick={onCta}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
      >
        {ctaLabel} <ArrowRight size={15} />
      </button>
    </div>
  );
}

export type PageGuideFeature = { label: string; description: string };

type PageGuidePanelProps = {
  open: boolean;
  title: string;
  description: string;
  features: PageGuideFeature[];
  onClose: () => void;
};

export function PageGuidePanel({ open, title, description, features, onClose }: PageGuidePanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex justify-end">
      <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-600">
              <HelpCircle size={13} /> 페이지 가이드
            </p>
            <h3 className="mt-1.5 text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-400 transition-colors hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {features.map((f, i) => (
            <div key={f.label} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[11px] font-bold text-cyan-700">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{f.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
