'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';

export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'up' | 'left' | 'right' | 'scale';
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Start visible in SSR HTML so initial page paint is instant (0ms blank screen!)
  const [state, setState] = useState<'ssr' | 'pending' | 'visible'>('ssr');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    // If element is already in view on initial load, trigger a subtle entrance immediately
    if (rect.top < window.innerHeight * 0.94) {
      setState('pending');
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setState('visible'));
      });
      return () => cancelAnimationFrame(raf);
    }

    setState('pending');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const variantClass =
    variant === 'left'
      ? 'reveal-left'
      : variant === 'right'
        ? 'reveal-right'
        : variant === 'scale'
          ? 'reveal-scale'
          : 'reveal-up';

  const stateClass =
    state === 'pending' ? 'reveal-pending' : state === 'visible' ? 'is-visible' : '';

  return (
    <div
      ref={ref}
      style={delay > 0 && state === 'visible' ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${variantClass} ${stateClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShowScrollTop(window.scrollY > 360);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div key={pathname} className="page-transition-enter">
        {children}
      </div>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={`fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white/95 text-slate-900 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-black hover:bg-electric hover:shadow-xl ${
          showScrollTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}
