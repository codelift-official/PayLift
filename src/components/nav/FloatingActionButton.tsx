import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const FloatingActionButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/bills/new')}
      aria-label="New Bill"
      className="fixed right-6 bottom-[88px] z-50 w-16 h-16 rounded-full bg-primary hover:bg-primary-hover active:scale-95 text-white shadow-raised flex items-center justify-center transition-all duration-200"
    >
      <Plus className="w-8 h-8 stroke-[2.5]" />
    </button>
  );
};
