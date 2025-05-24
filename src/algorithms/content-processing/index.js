/**
 * Content Processing Algorithms Module
 */

/**
 * Scores term frequency in content
 * @param {string} content - Content to analyze
 * @param {string[]} terms - Terms to look for
 * @returns {Object} Term frequency scores
 */
export function scoreTermFrequency(content, terms) {
  const scores = {};
  const normalizedContent = content.toLowerCase();
  
  terms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'g');
    const matches = normalizedContent.match(regex);
    scores[term] = matches ? matches.length : 0;
  });
  
  return scores;
}

/**
 * Finds exact phrase matches in content
 * @param {string} content - Content to search in
 * @param {string} phrase - Phrase to match
 * @returns {Array} Array of matches with their positions
 */
export function findExactPhraseMatches(content, phrase) {
  const matches = [];
  let pos = content.toLowerCase().indexOf(phrase.toLowerCase());
  
  while (pos !== -1) {
    matches.push({
      position: pos,
      context: content.substr(Math.max(0, pos - 50), 100)
    });
    pos = content.toLowerCase().indexOf(phrase.toLowerCase(), pos + 1);
  }
  
  return matches;
}

/**
 * Ranks content relevance based on multiple factors
 * @param {string} content - Content to analyze
 * @param {Object} criteria - Ranking criteria
 * @returns {number} Relevance score
 */
export function rankContentRelevance(content, criteria) {
  let relevanceScore = 0;
  
  // Score exact phrase matches
  if (criteria.phrase) {
    const exactMatches = findExactPhraseMatches(content, criteria.phrase);
    relevanceScore += exactMatches.length * 15;
  }
  
  // Score keyword matches
  if (criteria.keywords) {
    const termScores = scoreTermFrequency(content, criteria.keywords);
    relevanceScore += Object.values(termScores).reduce((a, b) => a + b, 0) * 2;
  }
  
  return Math.min(relevanceScore, 100);
}

/**
 * Analyzes content-to-question ratio
 * @param {string} content - Content to analyze
 * @param {number} questionCount - Number of questions
 * @returns {Object} Analysis results
 */
export function analyzeContentQuestionRatio(content, questionCount) {
  const contentLength = content.length;
  const averageContentPerQuestion = 500; // baseline characters per question
  const expectedQuestions = Math.ceil(contentLength / averageContentPerQuestion);
  
  return {
    contentLength,
    expectedQuestions,
    actualQuestions: questionCount,
    ratio: questionCount / expectedQuestions,
    isAdequate: questionCount <= expectedQuestions
  };
}

/**
 * Estimates content coverage
 * @param {string} content - Content to analyze
 * @param {Array} questions - Array of questions
 * @returns {Object} Coverage analysis
 */
export function estimateContentCoverage(content, questions) {
  const contentParagraphs = content.split(/\n\s*\n/);
  const coveredParagraphs = new Set();
  
  questions.forEach(question => {
    contentParagraphs.forEach((paragraph, index) => {
      if (paragraph.toLowerCase().includes(question.text.toLowerCase())) {
        coveredParagraphs.add(index);
      }
    });
  });
  
  return {
    totalParagraphs: contentParagraphs.length,
    coveredParagraphs: coveredParagraphs.size,
    coveragePercentage: (coveredParagraphs.size / contentParagraphs.length) * 100
  };
} 