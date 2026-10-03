import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const lastKeyRef = useRef<{ key: string; time: number } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or select
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      const now = Date.now();

      if (key === 'escape') {
        e.preventDefault();
        navigate(-1);
        return;
      }

      if (key === 'n') {
        e.preventDefault();
        navigate('/bills/new');
        return;
      }

      // Two-key sequence: g then h, or g then b
      if (lastKeyRef.current && lastKeyRef.current.key === 'g' && now - lastKeyRef.current.time < 1000) {
        if (key === 'h') {
          e.preventDefault();
          navigate('/dashboard');
          lastKeyRef.current = null;
          return;
        }
        if (key === 'b') {
          e.preventDefault();
          navigate('/bills');
          lastKeyRef.current = null;
          return;
        }
      }

      if (key === 'g') {
        lastKeyRef.current = { key: 'g', time: now };
      } else {
        lastKeyRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
