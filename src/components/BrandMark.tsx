import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { usePlatformAuthStore } from '../platform/store/platformAuthStore';

export interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showWordmark?: boolean;
  className?: string;
  isPlatform?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 'md',
  onClick,
  showWordmark = true,
  className = '',
  isPlatform = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { isAuthenticated: isPlatformAuth } = usePlatformAuthStore();

  const isLoginPage =
    location.pathname === '/login' ||
    location.pathname === '/platform/login' ||
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/platform/reset-password');

  const handleClick = (_e?: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }

    if (isLoginPage) {
      return;
    }

    if (isPlatform || location.pathname.startsWith('/platform')) {
      if (isPlatformAuth) {
        navigate('/platform');
      }
    } else {
      if (isAuthenticated) {
        navigate('/dashboard');
      }
    }
  };

  const iconSizes = {
    sm: 'w-7 h-7 text-xs rounded-md',
    md: 'w-8 h-8 text-sm rounded-lg',
    lg: 'w-10 h-10 text-base rounded-xl',
  };

  const textSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-extrabold',
  };

  const cursorClass = isLoginPage ? 'cursor-default' : 'cursor-pointer';

  return (
    <div
      id="brand-mark"
      onClick={handleClick}
      className={`inline-flex items-center gap-2.5 select-none ${cursorClass} ${className} brand-mark-container`}
      role={isLoginPage ? undefined : 'button'}
      tabIndex={isLoginPage ? undefined : 0}
      onKeyDown={(e) => {
        if (!isLoginPage && (e.key === 'Enter' || e.key === ' ')) {
          handleClick(e as any);
        }
      }}
      aria-label="Sahayak"
    >
      {/* S Icon with accent glow and pulse animation */}
      <div
        data-testid="brand-mark-s"
        className={`${iconSizes[size]} shrink-0 flex items-center justify-center text-white relative transition-all duration-300 brand-s-icon`}
        style={{
          backgroundColor: 'var(--accent, #e07b5a)',
          border: '1px solid rgba(224, 123, 90, 0.40)',
          boxShadow: '0 0 12px rgba(224, 123, 90, 0.25)',
        }}
      >
        <span className="relative z-10 font-bold tracking-tight">S</span>
      </div>

      {/* Sahayak Wordmark */}
      {showWordmark && (
        <span
          className={`tracking-tight transition-transform duration-200 brand-wordmark ${textSizes[size]}`}
          style={{
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          Sahayak
        </span>
      )}

      <style>{`
        @keyframes brandPulse {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }

        .brand-s-icon {
          animation: brandPulse 3s ease-in-out infinite;
        }

        .brand-mark-container:hover .brand-s-icon {
          box-shadow: 0 0 16px rgba(224, 123, 90, 0.35) !important;
          opacity: 1;
        }

        .brand-mark-container:hover .brand-wordmark {
          transform: scale(1.03);
        }

        @media (prefers-reduced-motion: reduce) {
          .brand-s-icon {
            animation: none !important;
            opacity: 1 !important;
          }
          .brand-mark-container:hover .brand-wordmark {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
