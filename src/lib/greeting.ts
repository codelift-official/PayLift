/**
 * Generates a time-aware greeting message based on the current local hour.
 *
 * - 04:00 - 11:59: Good morning
 * - 12:00 - 16:59: Good afternoon
 * - 17:00 - 03:59: Good evening
 *
 * @param name User name, email, or fallback to 'Rishabh'
 * @returns e.g. "Good morning, Rishabh" or "Good afternoon, Rishabh" or "Good evening, Rishabh"
 */
export function getTimeGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';

  if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hour >= 17 || hour < 4) {
    timeGreeting = 'Good evening';
  }

  // Format display name or default to 'Rishabh'
  let displayName = 'Rishabh';
  if (name && name.trim().length > 0) {
    const trimmed = name.trim();
    // If it's an email, extract clean name
    if (trimmed.includes('@')) {
      const part = trimmed.split('@')[0];
      displayName = part.charAt(0).toUpperCase() + part.slice(1);
    } else {
      displayName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }
  }

  return `${timeGreeting}, ${displayName}!`;
}
