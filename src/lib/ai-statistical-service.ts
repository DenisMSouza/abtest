import { AIBaseService } from "./ai-base-service";

export interface StatisticalData {
  experimentId: string;
  experimentName: string;
  totalUsers: number;
  duration: string;
  variations: {
    name: string;
    users: number;
    conversions: number;
    conversionRate: number;
    isBaseline: boolean;
  }[];
  statisticalSignificance: {
    pValue: number;
    confidenceLevel: number;
    isSignificant: boolean;
  };
  relativeUplift: {
    variation: string;
    uplift: number;
  }[];
  recommendations?: string[];
}

export interface AIStatisticalAnalysis {
  summary: string;
  confidence: {
    level: string;
    interpretation: string;
    recommendation: string;
  };
  performance: {
    winner: string | null;
    loser: string | null;
    analysis: string;
  };
  recommendations: {
    action: "continue" | "stop" | "adjust_weights" | "extend";
    reason: string;
    details: string;
    suggestedWeights?: { [variationName: string]: number };
  };
  insights: string[];
  nextSteps: string[];
}

export class AIStatisticalService extends AIBaseService {
  static async analyzeExperiment(
    data: StatisticalData
  ): Promise<AIStatisticalAnalysis> {
    const systemPrompt =
      "You are an expert A/B testing statistician and data scientist. Analyze the provided experiment data and provide actionable insights and recommendations.\n\n" +
      "CRITICAL: You MUST return ONLY a valid JSON object. Do NOT use markdown code blocks, do NOT add explanations, do NOT wrap the JSON in any formatting. Return ONLY the raw JSON starting with { and ending with }.\n\n" +
      "Return a JSON object with the following structure:\n" +
      "{\n" +
      '  "summary": "Brief 2-3 sentence summary of the experiment performance",\n' +
      '  "confidence": {\n' +
      '    "level": "High/Medium/Low",\n' +
      '    "interpretation": "What the confidence level means for decision making",\n' +
      '    "recommendation": "Specific recommendation based on confidence"\n' +
      "  },\n" +
      '  "performance": {\n' +
      '    "winner": "variation_name_or_null",\n' +
      '    "loser": "variation_name_or_null",\n' +
      '    "analysis": "Detailed analysis of performance differences"\n' +
      "  },\n" +
      '  "recommendations": {\n' +
      '    "action": "continue/stop/adjust_weights/extend",\n' +
      '    "reason": "Why this action is recommended",\n' +
      '    "details": "Specific details about the recommendation",\n' +
      '    "suggestedWeights": {"variation_name": 0.5, "other_variation": 0.5}\n' +
      "  },\n" +
      '  "insights": ["insight1", "insight2", "insight3"],\n' +
      '  "nextSteps": ["step1", "step2", "step3"]\n' +
      "}\n\n" +
      "ANALYSIS GUIDELINES:\n" +
      "- If p-value < 0.05 and confidence > 95%, recommend stopping with clear winner\n" +
      "- If p-value > 0.05 but sample size is large (>1000 users), consider extending\n" +
      "- If one variation is clearly underperforming (<50% of baseline), consider stopping\n" +
      "- If results are inconclusive but promising, suggest weight adjustments\n" +
      "- Always consider statistical significance, sample size, and practical significance\n" +
      "- Provide specific, actionable recommendations\n" +
      "- Be conservative with stopping recommendations unless very clear results\n" +
      "- Consider business impact and risk tolerance";

    try {
      const userPrompt = `Analyze this A/B test experiment data:\n\n${JSON.stringify(
        data,
        null,
        2
      )}`;

      const response = await this.makeAICall(systemPrompt, userPrompt, 0.3);
      const parsed = this.parseAIResponse<AIStatisticalAnalysis>(response);

      // Validate the response structure
      if (
        !parsed.summary ||
        !parsed.confidence ||
        !parsed.performance ||
        !parsed.recommendations ||
        !Array.isArray(parsed.insights) ||
        !Array.isArray(parsed.nextSteps)
      ) {
        throw new Error("Invalid AI response structure");
      }

      return parsed as AIStatisticalAnalysis;
    } catch (error) {
      this.handleAIError(error, "analyze experiment");
    }
  }
}
