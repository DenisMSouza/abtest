/**
 * Statistical analysis utilities for A/B testing
 * Based on ABTestGuide.com calculator methodology
 */

export interface VariationStats {
  name: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

export interface StatisticalResult {
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number;
  zScore: number;
  relativeUplift: number;
  message: string;
  recommendation: string;
}

/**
 * Calculate statistical significance between two variations
 */
export function calculateStatisticalSignificance(
  variationA: VariationStats,
  variationB: VariationStats,
  confidenceLevel: number = 95
): StatisticalResult {
  const { visitors: nA, conversions: xA } = variationA;
  const { visitors: nB, conversions: xB } = variationB;

  // Handle edge cases
  if (nA === 0 || nB === 0) {
    return {
      isSignificant: false,
      confidenceLevel,
      pValue: 1.0,
      zScore: 0,
      relativeUplift: 0,
      message:
        "Cannot calculate statistical significance with zero visitors in one or both variations.",
      recommendation:
        "Ensure both variations have visitors before analyzing results.",
    };
  }

  // Conversion rates
  const pA = xA / nA;
  const pB = xB / nB;

  // Handle edge cases for 100% or 0% conversion rates
  if ((pA === 1.0 && pB === 1.0) || (pA === 0.0 && pB === 0.0)) {
    return {
      isSignificant: false,
      confidenceLevel,
      pValue: 1.0,
      zScore: 0,
      relativeUplift: 0,
      message:
        "Both variations have identical conversion rates. No statistical difference can be detected.",
      recommendation:
        "Continue running the test to collect more data and observe potential differences.",
    };
  }

  // For edge cases with 100% or 0% rates, use continuity correction
  let adjustedXA = xA;
  let adjustedXB = xB;
  let adjustedNA = nA;
  let adjustedNB = nB;

  // Apply continuity correction for extreme values
  if (pA === 1.0) {
    adjustedXA = xA - 0.5;
    adjustedNA = nA + 0.5;
  } else if (pA === 0.0) {
    adjustedXA = xA + 0.5;
    adjustedNA = nA + 0.5;
  }

  if (pB === 1.0) {
    adjustedXB = xB - 0.5;
    adjustedNB = nB + 0.5;
  } else if (pB === 0.0) {
    adjustedXB = xB + 0.5;
    adjustedNB = nB + 0.5;
  }

  // Recalculate rates with continuity correction
  const adjustedPA = adjustedXA / adjustedNA;
  const adjustedPB = adjustedXB / adjustedNB;

  // Pooled proportion
  const pPooled = (adjustedXA + adjustedXB) / (adjustedNA + adjustedNB);

  // Standard errors with continuity correction
  const seA = Math.sqrt((adjustedPA * (1 - adjustedPA)) / adjustedNA);
  const seB = Math.sqrt((adjustedPB * (1 - adjustedPB)) / adjustedNB);
  const seDifference = Math.sqrt(
    (adjustedPA * (1 - adjustedPA)) / adjustedNA +
      (adjustedPB * (1 - adjustedPB)) / adjustedNB
  );

  // Handle case where standard error is zero
  if (seDifference === 0) {
    return {
      isSignificant: false,
      confidenceLevel,
      pValue: 1.0,
      zScore: 0,
      relativeUplift: 0,
      message:
        "Cannot calculate statistical significance due to identical performance metrics.",
      recommendation:
        "Continue running the test to collect more data and observe potential differences.",
    };
  }

  // Z-score
  const zScore = (adjustedPB - adjustedPA) / seDifference;

  // P-value (two-tailed test)
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  // Relative uplift (use original rates for display)
  const relativeUplift = pA > 0 ? ((pB - pA) / pA) * 100 : 0;

  // Determine significance
  const alpha = (100 - confidenceLevel) / 100;
  const isSignificant = pValue < alpha;

  // Generate message and recommendation
  const { message, recommendation } = generateResultMessage(
    isSignificant,
    pValue,
    relativeUplift,
    variationA.name,
    variationB.name,
    pA,
    pB
  );

  return {
    isSignificant,
    confidenceLevel,
    pValue,
    zScore,
    relativeUplift,
    message,
    recommendation,
  };
}

/**
 * Generate result message based on statistical analysis
 */
function generateResultMessage(
  isSignificant: boolean,
  pValue: number,
  relativeUplift: number,
  nameA: string,
  nameB: string,
  rateA: number,
  rateB: number
): { message: string; recommendation: string } {
  const rateAPercent = (rateA * 100).toFixed(2);
  const rateBPercent = (rateB * 100).toFixed(2);
  const upliftPercent = Math.abs(relativeUplift).toFixed(2);

  if (isSignificant) {
    const winner = rateB > rateA ? nameB : nameA;
    const loser = rateB > rateA ? nameA : nameB;

    return {
      message: `The test result is significant! ${winner}'s observed conversion rate (${
        rateB > rateA ? rateBPercent : rateAPercent
      }%) was higher than ${loser}'s conversion rate (${
        rateB > rateA ? rateAPercent : rateBPercent
      }%). You can be 95% confident that this result is a consequence of the changes you made and not a result of random chance.`,
      recommendation: `Declare ${winner} as the winner and consider implementing this variation.`,
    };
  } else {
    return {
      message: `The observed difference in conversion rate (${upliftPercent}%) isn't big enough to declare a significant winner. There is no real difference in performance between ${nameA} and ${nameB} or you need to collect more data.`,
      recommendation:
        pValue > 0.1
          ? "Continue running the test to collect more data, or consider stopping if you've reached your target sample size."
          : "The results are close to significance. Consider running the test longer or increasing the sample size.",
    };
  }
}

/**
 * Approximate normal CDF using the error function
 * This is a simplified approximation for the standard normal distribution
 */
function normalCDF(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1 / (1 + p * x);
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1 + sign * y);
}

/**
 * Calculate confidence intervals for conversion rates
 */
export function calculateConfidenceInterval(
  conversions: number,
  visitors: number,
  confidenceLevel: number = 95
): { lower: number; upper: number } {
  const p = conversions / visitors;
  const n = visitors;
  const alpha = (100 - confidenceLevel) / 100;
  const z = getZScore(alpha / 2);

  const margin = z * Math.sqrt((p * (1 - p)) / n);

  return {
    lower: Math.max(0, p - margin),
    upper: Math.min(1, p + margin),
  };
}

/**
 * Get Z-score for given alpha level
 */
function getZScore(alpha: number): number {
  // Common Z-scores for different confidence levels
  const zScores: { [key: number]: number } = {
    0.005: 2.576, // 99%
    0.01: 2.326, // 98%
    0.025: 1.96, // 95%
    0.05: 1.645, // 90%
    0.1: 1.282, // 80%
  };

  return zScores[alpha] || 1.96; // Default to 95% confidence
}
