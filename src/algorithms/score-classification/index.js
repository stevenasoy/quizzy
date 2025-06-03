/**
 * Score Classification Module
 */

/**
 * Get score class based on percentage
 * @param {number} score - Score percentage
 * @returns {string} Score classification
 */
export function getScoreClass(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'average';
  return 'needs-improvement';
}

/**
 * Format date relative to current time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatRelativeDate(date) {
  if (!date) return 'No date';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return 'Today, ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return d.toLocaleDateString();
  }
} 