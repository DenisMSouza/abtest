import { AIBaseService } from "./ai-base-service";

export interface AIExperimentSuggestion {
  name: string;
  description: string;
  variations: {
    name: string;
    description: string;
    weight: number;
    isBaseline: boolean;
  }[];
  successMetric: string;
  estimatedDuration: string;
  targetAudience: string;
  hypothesis: string;
}

export class AIService extends AIBaseService {
  // Normalize variation names to consistent format
  private static normalizeVariationName(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters except spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Validate and normalize experiment structure
  private static validateExperiment(parsed: any): void {
    // Validate that weights sum to 1.0 (with tolerance for floating-point precision)
    const totalWeight = parsed.variations.reduce(
      (sum: number, variation: any) => sum + (variation.weight || 0),
      0
    );
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error(
        `Variation weights must sum to 1.0, but got ${totalWeight}`
      );
    }

    // Validate that exactly one variation is marked as baseline
    const baselineCount = parsed.variations.filter(
      (v: any) => v.isBaseline === true
    ).length;
    if (baselineCount === 0) {
      throw new Error(
        "At least one variation must be marked as baseline for error handling"
      );
    }
    if (baselineCount > 1) {
      throw new Error("Only one variation can be marked as baseline");
    }

    // Normalize variation names
    parsed.variations.forEach((variation: any) => {
      variation.name = this.normalizeVariationName(variation.name);
    });
  }

  static async generateExperimentSuggestion(
    userPrompt: string
  ): Promise<AIExperimentSuggestion> {
    const systemPrompt =
      "You are an expert A/B testing consultant. Based on the user's description, create a comprehensive A/B test experiment.\n\n" +
      "CRITICAL: You MUST return ONLY a valid JSON object. Do NOT use markdown code blocks, do NOT add explanations, do NOT wrap the JSON in any formatting. Return ONLY the raw JSON starting with { and ending with }.\n\n" +
      "Return a JSON object with the following structure:\n" +
      "{\n" +
      '  "name": "Clear, descriptive experiment name",\n' +
      '  "description": "Detailed description of what we\'re testing and why",\n' +
      '  "variations": [\n' +
      "    {\n" +
      '      "name": "Control",\n' +
      '      "description": "Description of the control/current version",\n' +
      '      "weight": 0.5,\n' +
      '      "isBaseline": true\n' +
      "    },\n" +
      "    {\n" +
      '      "name": "Treatment",\n' +
      '      "description": "Description of the test variation",\n' +
      '      "weight": 0.5,\n' +
      '      "isBaseline": false\n' +
      "    }\n" +
      "  ],\n" +
      "  \"successMetric\": \"Primary metric to measure (e.g., 'conversion_rate', 'click_through_rate', 'purchase_amount')\",\n" +
      "  \"estimatedDuration\": \"Recommended test duration (e.g., '2 weeks', '1 month')\",\n" +
      '  "targetAudience": "Who should be included in this test",\n' +
      '  "hypothesis": "Clear hypothesis of what we expect to happen"\n' +
      "}\n\n" +
      "CRITICAL REQUIREMENTS:\n" +
      "- Variation weights MUST be decimal values that sum to exactly 1.0 (e.g., 0.5 + 0.5 = 1.0)\n" +
      "- EXACTLY ONE variation MUST have isBaseline: true (required for error handling)\n" +
      "- Create 2-3 variations maximum\n" +
      "- Use clear, actionable metric names\n" +
      "- Make descriptions specific and measurable\n" +
      "- Variation names MUST be in Title Case (e.g., 'Control', 'Green Button', 'Annual Pricing')\n" +
      "- Avoid underscores, hyphens, or special characters in variation names\n" +
      "- Double-check that all weights add up to 1.0 before returning the JSON";

    try {
      const response = await this.makeAICall(systemPrompt, userPrompt);
      const parsed = this.parseAIResponse<AIExperimentSuggestion>(response);

      // Validate the response structure
      if (
        !parsed.name ||
        !parsed.variations ||
        !Array.isArray(parsed.variations)
      ) {
        throw new Error("Invalid AI response structure");
      }

      // Validate experiment structure and requirements
      this.validateExperiment(parsed);

      return parsed as AIExperimentSuggestion;
    } catch (error) {
      this.handleAIError(error, "generate experiment suggestion");
    }
  }

  static async refineExperimentSuggestion(
    originalSuggestion: AIExperimentSuggestion,
    userFeedback: string
  ): Promise<AIExperimentSuggestion> {
    const systemPrompt =
      "You are an expert A/B testing consultant. The user has provided feedback on an experiment suggestion. Refine the experiment based on their feedback.\n\n" +
      "CRITICAL: You MUST return ONLY a valid JSON object. Do NOT use markdown code blocks, do NOT add explanations, do NOT wrap the JSON in any formatting. Return ONLY the raw JSON starting with { and ending with }.\n\n" +
      "CRITICAL: Variation weights MUST be decimal values that sum to exactly 1.0 (e.g., 0.5 + 0.5 = 1.0)\n" +
      "CRITICAL: EXACTLY ONE variation MUST have isBaseline: true (required for error handling)\n" +
      "CRITICAL: If the original suggestion has a baseline variation, you MUST preserve which variation is the baseline\n" +
      "CRITICAL: Do NOT change the isBaseline flags unless explicitly requested by the user\n" +
      "CRITICAL: When user asks for baseline weight (e.g., 'baseline with 70%'), assign that weight to the variation that has isBaseline: true\n" +
      "CRITICAL: When user asks for specific weights, apply them to the correct variations based on context\n\n" +
      "Return a JSON object with the same structure as before, but incorporate the user's feedback.";

    try {
      const userPrompt = `Original suggestion: ${JSON.stringify(
        originalSuggestion,
        null,
        2
      )}\n\nUser feedback: ${userFeedback}`;

      const response = await this.makeAICall(systemPrompt, userPrompt);
      const parsed = this.parseAIResponse<AIExperimentSuggestion>(response);

      // Fallback: If no baseline found during refinement, preserve the original baseline
      const baselineCount = parsed.variations.filter(
        (v: any) => v.isBaseline === true
      ).length;
      if (baselineCount === 0) {
        // Find the original baseline variation name
        const originalBaseline = originalSuggestion.variations.find(
          (v) => v.isBaseline
        );
        if (originalBaseline) {
          // Find the matching variation in the refined suggestion and mark it as baseline
          const matchingVariation = parsed.variations.find(
            (v: any) =>
              v.name.toLowerCase() === originalBaseline.name.toLowerCase()
          );
          if (matchingVariation) {
            matchingVariation.isBaseline = true;
          } else {
            // If no matching variation found, mark the first one as baseline
            parsed.variations[0].isBaseline = true;
          }
        } else {
          // If no original baseline found, mark the first variation as baseline
          parsed.variations[0].isBaseline = true;
        }
      }

      // Post-process: Fix weight assignments if user asked for baseline weight
      if (
        userFeedback.toLowerCase().includes("baseline") &&
        userFeedback.includes("%")
      ) {
        const baselineVariation = parsed.variations.find(
          (v: any) => v.isBaseline === true
        );
        const nonBaselineVariations = parsed.variations.filter(
          (v: any) => v.isBaseline !== true
        );

        if (baselineVariation && nonBaselineVariations.length > 0) {
          // Extract the percentage from user feedback
          const percentageMatch = userFeedback.match(/(\d+)%/);
          if (percentageMatch) {
            const requestedWeight = parseInt(percentageMatch[1]) / 100;
            const remainingWeight = 1.0 - requestedWeight;

            // Assign the requested weight to baseline
            baselineVariation.weight = requestedWeight;

            // Distribute remaining weight among non-baseline variations
            const weightPerVariation =
              remainingWeight / nonBaselineVariations.length;
            nonBaselineVariations.forEach((v: any) => {
              v.weight = weightPerVariation;
            });
          }
        }
      }

      // Validate experiment structure and requirements
      this.validateExperiment(parsed);

      return parsed as AIExperimentSuggestion;
    } catch (error) {
      this.handleAIError(error, "refine experiment suggestion");
    }
  }
}
