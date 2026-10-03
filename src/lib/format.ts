import { format, differenceInHours, parseISO, isToday } from 'date-fns';

export const formatMoney = (n: number): string => {
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);

  return n < 0 ? `−₹${formatted}` : `₹${formatted}`;
};

export const formatDate = (iso: string): string => {
  try {
    const date = parseISO(iso);
    const now = new Date();
    const diffHours = Math.abs(differenceInHours(now, date));

    if (diffHours < 48) {
      if (isToday(date)) {
        return `Today ${format(date, 'h:mm a')}`;
      }
      return format(date, 'dd MMM h:mm a');
    }

    return format(date, 'dd MMM yyyy');
  } catch {
    return iso;
  }
};

export const formatDateTime = (iso: string): string => {
  try {
    const date = parseISO(iso);
    return format(date, 'dd MMM yyyy, h:mm a');
  } catch {
    return iso;
  }
};

export const formatDateShort = (iso: string): string => {
  try {
    const date = parseISO(iso);
    return format(date, 'dd/MM/yyyy');
  } catch {
    return iso;
  }
};

export const formatPhone = (phone?: string | null): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};
