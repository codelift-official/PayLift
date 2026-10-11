import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, ChevronRight, X, UserPlus, AlertCircle, User, Check } from 'lucide-react';
import { phase11Api, Customer } from '../../api/phase11';

export interface CustomerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: { id?: string; name: string; phone: string }) => void;
  onSkip: () => void;
  customerMandatory?: boolean;
  customerRecommendEnabled?: boolean;
  currentCustomer?: { id?: string; name?: string; phone?: string } | null;
}

export const CustomerPopup: React.FC<CustomerPopupProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onSkip,
  customerMandatory = false,
  customerRecommendEnabled = true,
  currentCustomer,
}) => {
  const [mobileQuery, setMobileQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(!customerRecommendEnabled);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualError, setManualError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setMobileQuery(currentCustomer?.phone || '');
      setManualName(currentCustomer?.name || '');
      setManualPhone(currentCustomer?.phone || '');
      setShowManualForm(!customerRecommendEnabled);
      setManualError('');
      // Delay slightly for smooth modal entrance animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentCustomer, customerRecommendEnabled]);

  // Debounced customer search (300ms)
  useEffect(() => {
    if (!customerRecommendEnabled || showManualForm) {
      setSuggestions([]);
      return;
    }

    const trimmed = mobileQuery.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await phase11Api.getCustomers({ search: trimmed, limit: 5 });
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [mobileQuery, customerRecommendEnabled, showManualForm]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !customerMandatory) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, customerMandatory, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !customerMandatory) {
      onClose();
    }
  };

  const handleSelect = (c: Customer | { id?: string; name: string; phone: string }) => {
    onSelectCustomer({
      id: c.id,
      name: c.name,
      phone: c.phone,
    });
    onClose();
  };

  const handleSaveManual = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualName.trim() && !manualPhone.trim()) {
      setManualError('Enter at least a name or phone number');
      return;
    }
    handleSelect({
      name: manualName.trim(),
      phone: manualPhone.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4"
      onClick={handleBackdropClick}
      data-testid="customer-popup-backdrop"
      id="customer-popup-modal"
    >
      <div
        className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-3 pb-4 sm:pt-6 sm:pb-3 flex items-center justify-between border-b border-border/40">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
              <span className="sm:hidden">Who's this bill for?</span>
              <span className="hidden sm:inline">Add Customer</span>
            </h2>
            {customerMandatory && (
              <p className="text-xs text-danger font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                This shop requires customer info
              </p>
            )}
          </div>
          {!customerMandatory && (
            <button
              type="button"
              onClick={onClose}
              id="customer-popup-close-btn"
              className="hidden sm:flex p-1.5 text-text-muted hover:text-text-primary hover:bg-secondary/40 rounded-full transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!showManualForm ? (
            <>
              {/* Mobile Input Field */}
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Mobile number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                    <Smartphone className="w-5 h-5 text-text-muted" />
                  </div>
                  <input
                    ref={inputRef}
                    type="tel"
                    id="customer-autocomplete-input"
                    data-testid="customer-autocomplete-input"
                    value={mobileQuery}
                    onChange={(e) => setMobileQuery(e.target.value)}
                    placeholder="Mobile number"
                    className="w-full pl-11 pr-4 py-3 text-base sm:text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    autoComplete="off"
                  />
                  {mobileQuery && (
                    <button
                      type="button"
                      onClick={() => setMobileQuery('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestions dropdown */}
              {mobileQuery.trim().length >= 3 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <span>
                      {suggestions.length > 0
                        ? 'Matching customers'
                        : isLoading
                        ? 'Searching...'
                        : 'No matching customers'}
                    </span>
                    {isLoading && (
                      <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {suggestions.length > 0 && (
                    <div
                      id="customer-suggestions-dropdown"
                      data-testid="customer-suggestions-dropdown"
                      className="divide-y divide-border/60 border border-border/80 rounded-xl overflow-hidden bg-background shadow-sm"
                    >
                      {suggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelect(c)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/25 transition-colors text-left group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors">
                                {c.name}
                              </span>
                              <span className="text-text-muted text-xs">·</span>
                              <span className="text-text-muted text-sm font-mono">{c.phone}</span>
                            </div>
                            {c.totalBills !== undefined && c.totalBills > 0 && (
                              <p className="text-xs text-text-muted mt-0.5">
                                {c.totalBills} previous {c.totalBills === 1 ? 'bill' : 'bills'}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add New Customer Link */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualForm(true);
                    setManualPhone(mobileQuery);
                  }}
                  id="add-new-customer-trigger-btn"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 py-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Not found? Add new customer
                </button>
              </div>
            </>
          ) : (
            /* Manual Name + Phone Form */
            <form onSubmit={handleSaveManual} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Customer Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="customer-manual-name-input"
                    value={manualName}
                    onChange={(e) => {
                      setManualName(e.target.value);
                      setManualError('');
                    }}
                    placeholder="Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    id="customer-manual-phone-input"
                    value={manualPhone}
                    onChange={(e) => {
                      setManualPhone(e.target.value);
                      setManualError('');
                    }}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                  />
                </div>
              </div>

              {manualError && (
                <p className="text-xs text-danger font-medium">{manualError}</p>
              )}

              <div className="flex items-center gap-2 pt-2">
                {customerRecommendEnabled && (
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="flex-1 py-2.5 text-xs font-semibold text-text-muted hover:text-text-primary border border-border rounded-xl transition-colors"
                  >
                    Back to search
                  </button>
                )}
                <button
                  type="submit"
                  id="save-manual-customer-btn"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save & Select
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="border-t border-border/80 pt-2" />

          {/* Action Buttons (Skip / Walk-in) */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:justify-end">
            {!customerMandatory && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden sm:inline-flex px-4 py-2.5 text-xs font-semibold text-text-muted hover:text-text-primary rounded-xl hover:bg-secondary/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSkip();
                    onClose();
                  }}
                  id="skip-customer-btn"
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-secondary/30 hover:bg-secondary/50 text-text-primary font-semibold text-sm sm:text-xs rounded-xl border border-border transition-colors text-center"
                >
                  Skip — Walk-in customer
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
