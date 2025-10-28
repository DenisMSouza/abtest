import { AIBaseService } from "./ai-base-service";

export interface StatisticalData {
  experimentId: string;
  experimentName: string;
  totalUsers: number;
  duration: string;
  endDate?: string | null;
  variations: {
    name: string;
    users: number;
    conversions: number;
    conversionRate: number;
    isBaseline: boolean;
    currentWeight: number;
  }[];
  statisticalSignificance: {
    isSignificant: boolean;
    confidenceLevel: number;
    pValue: number;
    zScore: number;
    relativeUplift: number;
    message: string;
    recommendation: string;
  };
  relativeUplift: any[];
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
    action: string;
    reason: string;
    details: string;
    suggestedWeights?: Record<string, number>;
  };
  insights: string[];
  nextSteps: string[];
}

export class AIStatisticalService extends AIBaseService {
  static async analyzeExperiment(
    data: StatisticalData
  ): Promise<AIStatisticalAnalysis> {
    const systemPrompt = `You are an A/B testing analyst. Return ONLY valid JSON with this exact structure:

{
  "summary": "Brief experiment summary",
  "confidence": {
    "level": "High|Medium|Low",
    "interpretation": "What confidence means",
    "recommendation": "Recommendation based on confidence"
  },
  "performance": {
    "winner": "variation_name_or_null",
    "loser": "variation_name_or_null",
    "analysis": "Performance analysis"
  },
  "recommendations": {
    "action": "stop|continue|extend|adjust_weights",
    "reason": "Why this action",
    "details": "Action details",
    "suggestedWeights": {"variation1": 0.3, "variation2": 0.7}
  },
  "insights": ["insight1", "insight2", "insight3"],
  "nextSteps": ["step1", "step2", "step3"]
}

REQUIRED: Always provide 3 insights and 3 nextSteps. Never leave them empty.

AVAILABLE DATA FOR ANALYSIS:
- experimentId: Unique experiment identifier
- experimentName: Name of the experiment
- totalUsers: Total number of users in the experiment
- duration: How long the experiment has been running (e.g., "5 days", "2 weeks")
- endDate: When the experiment is scheduled to end (null if indefinite)
- variations: Array of variations with:
  - name: Variation name
  - users: Number of users assigned to this variation
  - conversions: Number of successful conversions
  - conversionRate: Conversion rate as percentage
  - isBaseline: Whether this is the baseline variation
  - currentWeight: Current traffic allocation weight
- statisticalSignificance: Object with:
  - pValue: Statistical significance p-value
  - isSignificant: Whether results are statistically significant
  - confidenceLevel: Confidence level (typically 95%)
- relativeUplift: Array of uplift percentages between variations

DATA USAGE GUIDANCE:
- Use pValue to determine statistical significance (typically < 0.05)
- Compare conversionRate between variations to identify winners/losers
- Check currentWeight distribution to identify inefficient traffic allocation
- Consider duration and totalUsers to assess if more data is needed
- Use endDate to determine if experiment can be extended (null = indefinite)

ACTION GUIDELINES:

"stop" - Use when you have statistically significant results with a clear winner. The experiment has provided enough evidence to make a decision.

"adjust_weights" - Use when you have sufficient data (typically 500+ users) but the traffic allocation is inefficient. For example, when a better-performing variation is getting equal or less traffic than a worse-performing one.

"extend" - Use for short-duration experiments (typically under a week) with promising but not yet significant results, when there's a specific end date that can be extended. IMPORTANT: Only use "extend" when endDate is not null - you cannot extend an experiment without an end date.

"continue" - Use for long-running experiments or experiments without end dates that need more data to reach significance.

EXAMPLES:

Stop Example: "Monthly Pricing: 5% conversion, Annual Pricing: 8% conversion, p-value: 0.0064, clear winner" → action="stop"

Adjust Weights Example: "Monthly: 400 users, 7% conversion, 50% traffic. Annual: 600 users, 9% conversion, 50% traffic" → action="adjust_weights" with suggestedWeights: {"Monthly Pricing": 0.3, "Annual Pricing With Savings": 0.7}

Extend Example: "Duration: 4 days, 200 users, 33% uplift, p-value: 0.579, endDate exists" → action="extend"

Continue Example: "Duration: 14 days, 500 users, 7% vs 6% conversion, p-value: 0.8" → action="continue"

IMPORTANT: If you suggest extending duration in "details", the "action" must be "extend", not "continue"!

- Return ONLY JSON, no markdown, no explanations`;

    try {
      const response = await this.makeAICall(
        systemPrompt,
        JSON.stringify(data)
      );
      const parsed = this.parseAIResponse(response);

      // Validate the response structure
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !("summary" in parsed) ||
        !("confidence" in parsed) ||
        !("performance" in parsed) ||
        !("recommendations" in parsed) ||
        !("insights" in parsed) ||
        !("nextSteps" in parsed) ||
        !Array.isArray((parsed as any).insights) ||
        !Array.isArray((parsed as any).nextSteps)
      ) {
        console.error(
          "Invalid AI response structure - missing required fields"
        );
        throw new Error("Invalid AI response structure");
      }

      return parsed as AIStatisticalAnalysis;
    } catch (error) {
      return this.handleAIError(error, "analyze experiment");
    }
  }
}
