import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Plus, LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/auth.store';
import { navItemsForRole } from './navItems';

interface NavSlot {
  key: string;
  icon: LucideIcon;
  label: string;
  path: string;
}

const NavSlotLink: React.FC<{ slot: NavSlot }> = ({ slot }) => {
  const Icon = slot.icon;
  return (
    <NavLink
      to={slot.path}
      className={({ isActive }) =>
        clsx(
          'flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors',
          isActive
            ? 'text-primary font-semibold'
            : 'text-text-muted hover:text-text-primary'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={clsx('w-5 h-5 mb-1 transition-transform', isActive && 'scale-110')} />
          <span className="text-[11px] leading-tight">{slot.label}</span>
        </>
      )}
    </NavLink>
  );
};

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Role-filtered nav items with redundant 'bills' removed in favor of center 'Create Bill'
  const allItems = navItemsForRole(user?.role);
  const mobileSlots = allItems.filter((i) => i.key !== 'bills');

  // Split remaining slots symmetrically around center Create Bill button
  const half = Math.ceil(mobileSlots.length / 2);
  const leftSlots = mobileSlots.slice(0, half);
  const rightSlots = mobileSlots.slice(half);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t border-border flex justify-around items-center h-16 safe-bottom"
      style={{
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Left slots */}
      {leftSlots.map((slot) => (
        <NavSlotLink key={slot.key} slot={slot} />
      ))}

      {/* Center Create Bill Action — Primary billing entry */}
      <div className="flex flex-col items-center justify-center flex-1 relative -translate-y-2">
        <button
          type="button"
          id="mobile-fab-new-bill"
          onClick={() => navigate('/bills/new')}
          aria-label="Create Bill"
          title="Create Bill"
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary-hover active:scale-95 text-white flex items-center justify-center transition-all duration-150 shadow-md"
          style={{ boxShadow: '0 4px 14px rgba(229,57,53,0.45)' }}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
        <span className="text-[10px] font-semibold text-primary mt-0.5 tracking-tight">Create Bill</span>
      </div>

      {/* Right slots */}
      {rightSlots.map((slot) => (
        <NavSlotLink key={slot.key} slot={slot} />
      ))}
    </nav>
  );
};
