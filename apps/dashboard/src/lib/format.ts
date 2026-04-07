const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return relativeFormatter.format(diffDays, 'day');
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function truncateUrl(value: string, maxLength = 48) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

export function maskApiKey(value: string) {
  if (value.length <= 8) {
    return value;
  }

  return `${value.slice(0, 4)}....${value.slice(-4)}`;
}

export function formatBugStatus(status: string) {
  return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
