/**
 * Main Algorithms Export Module
 */

export * as textAnalysis from './text-analysis';
export * as questionManagement from './question-management';
export * as contentProcessing from './content-processing';
export * as scoring from './scoring';
export * as diversity from './diversity';
export * as contentCoverage from './content-coverage';

// Convenience exports for commonly used functions
export {
  analyzeTextComplexity,
  normalizeText
} from './text-analysis';

export {
  shuffleQuestions,
  distributeByDifficulty
} from './question-management';

export {
  rankContentRelevance,
  estimateContentCoverage
} from './content-processing';

export {
  calculateWeightedScore,
  predictPerformance
} from './scoring';

export {
  calculateDiversityScore,
  analyzeTopicDistribution
} from './diversity';

export {
  balanceQuestionDistribution,
  analyzeContentLength
} from './content-coverage'; 