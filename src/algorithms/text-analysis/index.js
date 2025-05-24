/**
 * Text Analysis Algorithms Module
 */

/**
 * Analyzes text complexity based on academic terms and patterns
 * @param {string} content - The content to analyze
 * @returns {number} Complexity score (0-100)
 */
export function analyzeTextComplexity(content) {
  const complexityIndicators = [
    'analyze', 'compare', 'contrast', 'evaluate', 'explain',
    'describe', 'discuss', 'examine', 'interpret', 'justify',
    'therefore', 'however', 'although', 'furthermore', 'consequently'
  ];
  
  let complexityScore = 0;
  const normalizedContent = content.toLowerCase();
  
  complexityIndicators.forEach(indicator => {
    const regex = new RegExp(indicator, 'g');
    const matches = normalizedContent.match(regex);
    if (matches) {
      complexityScore += matches.length;
    }
  });
  
  return Math.min(complexityScore * 5, 100);
}

/**
 * Analyzes keyword frequency in content
 * @param {string} content - The content to analyze
 * @param {string[]} keywords - Keywords to look for
 * @returns {Object} Frequency analysis results
 */
export function analyzeKeywordFrequency(content, keywords) {
  const frequencies = {};
  const normalizedContent = content.toLowerCase();
  
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'g');
    const matches = normalizedContent.match(regex);
    frequencies[keyword] = matches ? matches.length : 0;
  });
  
  return frequencies;
}

/**
 * Normalizes text for consistent comparison
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[.,?!]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds pattern matches in content
 * @param {string} content - Content to search in
 * @param {string} pattern - Pattern to match
 * @returns {Array} Array of matches
 */
export function findPatternMatches(content, pattern) {
  const regex = new RegExp(pattern, 'gi');
  return content.match(regex) || [];
} 