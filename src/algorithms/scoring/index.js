/**
 * Scoring Algorithms Module
 */

/**
 * Calculates weighted average score
 * @param {Object} scores - Object containing different scores
 * @param {Object} weights - Weight for each score type
 * @returns {number} Final weighted score
 */
export function calculateWeightedScore(scores, weights) {
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.keys(weights).forEach(key => {
    if (scores[key] !== undefined) {
      totalScore += scores[key] * weights[key];
      totalWeight += weights[key];
    }
  });
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Performs multi-factor analysis for prediction
 * @param {Object} factors - Different factors to analyze
 * @returns {Object} Analysis results
 */
export function analyzeMultipleFactors(factors) {
  const analysis = {
    contentCoverage: factors.contentCoverage || 0,
    complexity: factors.complexity || 0,
    diversity: factors.diversity || 0,
    overallScore: 0,
    confidence: 0
  };
  
  // Calculate overall score
  analysis.overallScore = calculateWeightedScore(factors, {
    contentCoverage: 0.4,
    complexity: 0.3,
    diversity: 0.3
  });
  
  // Calculate confidence based on data completeness
  const availableFactors = Object.keys(factors).filter(key => factors[key] !== undefined).length;
  analysis.confidence = (availableFactors / Object.keys(factors).length) * 100;
  
  return analysis;
}

/**
 * Normalizes scores to a specific range
 * @param {number} score - Raw score
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Normalized score
 */
export function normalizeScore(score, min = 0, max = 100) {
  return Math.max(min, Math.min(max, score));
}

/**
 * Predicts performance based on various metrics
 * @param {Object} metrics - Performance metrics
 * @returns {Object} Performance prediction
 */
export function predictPerformance(metrics) {
  const weights = {
    contentComplexity: 0.3,
    questionDifficulty: 0.3,
    contentCoverage: 0.2,
    topicDiversity: 0.2
  };
  
  const baseScore = calculateWeightedScore(metrics, weights);
  
  // Apply confidence adjustment
  const confidence = calculateConfidence(metrics);
  const adjustedScore = baseScore * (confidence / 100);
  
  return {
    predictedScore: normalizeScore(adjustedScore),
    confidence,
    factors: {
      contentComplexity: metrics.contentComplexity || 0,
      questionDifficulty: metrics.questionDifficulty || 0,
      contentCoverage: metrics.contentCoverage || 0,
      topicDiversity: metrics.topicDiversity || 0
    }
  };
}

/**
 * Calculates confidence level for predictions
 * @param {Object} metrics - Metrics used for prediction
 * @returns {number} Confidence percentage
 */
function calculateConfidence(metrics) {
  const requiredMetrics = ['contentComplexity', 'questionDifficulty', 'contentCoverage', 'topicDiversity'];
  const availableMetrics = requiredMetrics.filter(metric => metrics[metric] !== undefined);
  
  return (availableMetrics.length / requiredMetrics.length) * 100;
} 