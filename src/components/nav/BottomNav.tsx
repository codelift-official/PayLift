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

  // Role-filtered nav items (mobile: split around FAB)
  const allItems = navItemsForRole(user?.role);

  // Split: left side gets items before FAB slot, right side after
  // FAB is always centered — we place 2 on each side (or 1+1 for Staff's 4 items)
  const half = Math.floor(allItems.length / 2);
  const leftSlots = allItems.slice(0, half);
  const rightSlots = allItems.slice(half);

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

      {/* Center FAB slot — always present regardless of role */}
      <div className="flex flex-col items-center justify-center flex-1 relative">
        <button
          type="button"
          id="mobile-fab-new-bill"
          onClick={() => navigate('/bills/new')}
          aria-label="New Bill"
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary-hover active:scale-95 text-white flex items-center justify-center transition-all duration-150 -translate-y-5"
          style={{ boxShadow: '0 4px 12px rgba(229,57,53,0.4)' }}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Right slots */}
      {rightSlots.map((slot) => (
        <NavSlotLink key={slot.key} slot={slot} />
      ))}
    </nav>
  );
};
