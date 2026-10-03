import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { clsx } from 'clsx';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={clsx(
        'inline-flex items-center justify-center w-9 h-9 rounded-button transition-colors',
        'text-text-muted hover:text-text-primary hover:bg-slate-100',
        '[data-theme="dark"]_&:hover:bg-slate-700',
        className
      )}
    >
      {theme === 'dark' ? (
        <Sun className="w-4.5 h-4.5 w-[18px] h-[18px]" />
      ) : (
        <Moon className="w-[18px] h-[18px]" />
      )}
    </button>
  );
};
