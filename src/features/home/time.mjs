// Shared timeline and thread time labels. UTC epoch math avoids timezone-dependent cutoffs.
export function relativePostTime(value, now = Date.now()) {
  const timestamp = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(timestamp) || !Number.isFinite(now)) return 'Recently';
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (days < 28) { const weeks = Math.floor(days / 7); return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`; }
  if (days < 365) { const months = Math.min(11, Math.max(1, Math.floor(days / 30))); return `${months} ${months === 1 ? 'month' : 'months'} ago`; }
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}
export function refreshPostTimes(root, now = Date.now()) {
  for (const element of root.querySelectorAll('time[data-relative-post]')) {
    element.textContent = relativePostTime(element.dateTime || element.getAttribute('datetime'), now);
  }
}