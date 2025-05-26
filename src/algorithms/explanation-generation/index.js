/**
 * Explanation Generation Module
 */

/**
 * Find and generate explanation for a question from content
 * @param {Object} question - Question object
 * @param {string} content - Source content
 */
export function findExplanationFromContent(question, content) {
  // Split content into smaller chunks (paragraphs and sentences)
  const paragraphs = content.split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  const sentences = content.split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Extract key terms from question and answer
  const questionTerms = new Set(
    question.text.toLowerCase()
      .replace(/[.,?!]/g, '')
      .split(' ')
      .filter(word => word.length > 3 && !['what', 'when', 'where', 'why', 'how', 'which', 'who', 'does', 'can', 'will', 'should', 'would', 'could', 'the', 'and', 'that'].includes(word))
  );

  const answerTerms = new Set();
  if (question.type === 'multiple-choice') {
    // Add terms from correct answer
    question.options[question.correctAnswer].toLowerCase()
      .replace(/[.,?!]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .forEach(term => answerTerms.add(term));
    
    // Add key terms from incorrect options to help identify contrasting explanations
    Object.entries(question.options)
      .filter(([key]) => key !== question.correctAnswer)
      .forEach(([, option]) => {
        option.toLowerCase()
          .replace(/[.,?!]/g, '')
          .split(' ')
          .filter(word => word.length > 3)
          .forEach(term => answerTerms.add(term));
      });
  }

  // Score each paragraph
  const scoredParagraphs = paragraphs.map(paragraph => {
    const normalizedParagraph = paragraph.toLowerCase();
    let score = 0;
    let termMatches = 0;

    // Check for exact phrase matches
    if (normalizedParagraph.includes(question.text.toLowerCase())) {
      score += 25;
    }

    // Check for answer phrase matches
    if (question.type === 'multiple-choice') {
      if (normalizedParagraph.includes(question.options[question.correctAnswer].toLowerCase())) {
        score += 20;
      }
    }

    // Score based on term density and relevance
    questionTerms.forEach(term => {
      if (normalizedParagraph.includes(term)) {
        score += 5;
        termMatches++;
      }
    });

    answerTerms.forEach(term => {
      if (normalizedParagraph.includes(term)) {
        score += 3;
        termMatches++;
      }
    });

    // Bonus for high term density
    const density = termMatches / (paragraph.split(' ').length);
    score += density * 20;

    // Penalty for very long paragraphs
    if (paragraph.length > 300) {
      score *= 0.8;
    }

    return {
      text: paragraph,
      score,
      termMatches
    };
  }).filter(p => p.score > 10) // Only keep paragraphs with meaningful scores
    .sort((a, b) => b.score - a.score);

  // Score individual sentences for potential additional context
  const scoredSentences = sentences.map(sentence => {
    const normalizedSentence = sentence.toLowerCase();
    let score = 0;
    let termMatches = 0;

    questionTerms.forEach(term => {
      if (normalizedSentence.includes(term)) {
        score += 3;
        termMatches++;
      }
    });

    answerTerms.forEach(term => {
      if (normalizedSentence.includes(term)) {
        score += 2;
        termMatches++;
      }
    });

    // Bonus for high term density in short sentences
    const density = termMatches / (sentence.split(' ').length);
    score += density * 15;

    return {
      text: sentence,
      score,
      termMatches
    };
  }).filter(s => s.score > 5)
    .sort((a, b) => b.score - a.score);

  // Construct the explanation
  let explanation = '';
  
  if (scoredParagraphs.length > 0) {
    // Use the highest scoring paragraph, but trim it if it's too long
    let mainExplanation = scoredParagraphs[0].text;
    if (mainExplanation.length > 300) {
      // Find the most relevant segment within the paragraph
      const segments = mainExplanation.split(/(?<=[.!?])\s+/);
      const relevantSegments = segments.filter(segment => {
        const normalizedSegment = segment.toLowerCase();
        return [...questionTerms, ...answerTerms].some(term => normalizedSegment.includes(term));
      });
      mainExplanation = relevantSegments.slice(0, 2).join(' ');
    }
    explanation = mainExplanation;

    // Add a highly relevant sentence if it provides additional context
    if (scoredSentences.length > 0 && 
        scoredSentences[0].score > 10 && 
        !explanation.toLowerCase().includes(scoredSentences[0].text.toLowerCase())) {
      explanation += ' ' + scoredSentences[0].text;
    }
  } else if (scoredSentences.length > 0) {
    // Use up to two most relevant sentences if no good paragraph was found
    explanation = scoredSentences.slice(0, 2)
      .map(s => s.text)
      .join(' ');
  }

  // If no good explanation was found, use a fallback
  if (!explanation || explanation.length < 20) {
    if (question.type === 'multiple-choice') {
      const correctOption = question.options[question.correctAnswer];
      explanation = `The correct answer is "${correctOption}". This can be determined from the context of the material.`;
    } else {
      explanation = `This statement is ${question.correctAnswer} based on the information provided in the material.`;
    }
  } else {
    // Add a concluding sentence for multiple choice questions
    if (question.type === 'multiple-choice') {
      const correctOption = question.options[question.correctAnswer];
      if (!explanation.includes(correctOption)) {
        explanation += ` Therefore, "${correctOption}" is the correct answer.`;
      }
    }
  }

  question.explanation = explanation;
} 