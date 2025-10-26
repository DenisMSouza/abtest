import OpenAI from "openai";

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "A/B Testing Platform",
  },
});

export abstract class AIBaseService {
  // Smart model selection based on environment
  protected static getModel(): string {
    const model = process.env.OPENROUTER_MODEL;

    if (model) {
      return model; // Use custom model if specified
    }

    // Default to cost-effective model for development
    if (process.env.NODE_ENV === "development") {
      return "microsoft/phi-3-mini-128k-instruct"; // $0.20/1M tokens
    }

    // Production: use balanced model
    return "anthropic/claude-3.5-haiku"; // $1.00/1M tokens
  }

  // Extract JSON from AI response, handling both raw JSON and markdown code blocks
  protected static extractJsonFromResponse(response: string): string {
    // Check if response looks corrupted (too many repeated characters)
    const uniqueChars = new Set(response).size;
    const totalChars = response.length;
    if (totalChars > 200 && uniqueChars < 5) {
      throw new Error(
        "AI returned corrupted response. Please try again or check your API key."
      );
    }

    // Check if response is wrapped in markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    // Try to find a complete JSON object by looking for proper structure
    const jsonStart = response.indexOf("{");
    if (jsonStart === -1) {
      return response;
    }

    // Look for a complete JSON object by counting braces
    let braceCount = 0;
    let jsonEnd = -1;

    for (let i = jsonStart; i < response.length; i++) {
      if (response[i] === "{") {
        braceCount++;
      } else if (response[i] === "}") {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
    }

    if (jsonEnd !== -1) {
      return response.substring(jsonStart, jsonEnd + 1);
    }

    // Fallback: try to find any valid JSON-like structure
    const fallbackMatch = response.match(/\{[^{}]*\}/);
    if (fallbackMatch) {
      return fallbackMatch[0];
    }

    return response;
  }

  // Common error handling for AI API calls
  protected static handleAIError(error: unknown, context: string): never {
    console.error(`AI ${context} error:`, error);

    if (error instanceof Error) {
      // Check for specific error types in order of specificity
      if (error.message.includes("corrupted response")) {
        throw new Error(
          "AI returned corrupted response. Please try again or check your API key."
        );
      }
      if (
        error.message.includes("API key") &&
        !error.message.includes("corrupted")
      ) {
        throw new Error(
          "Invalid API key. Please check your OPENROUTER_API_KEY in .env.local"
        );
      }
      if (error.message.includes("quota") || error.message.includes("credit")) {
        throw new Error(
          "API quota exceeded. Please check your OpenRouter credits."
        );
      }
      if (error.message.includes("model")) {
        throw new Error(
          "Invalid model specified. Please check your OPENROUTER_MODEL setting."
        );
      }
    }

    throw new Error(
      `Failed to ${context}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  // Common method to make AI API calls
  protected static async makeAICall(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: this.getModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from AI service");
    }

    return response;
  }

  // Common method to parse AI response as JSON
  protected static parseAIResponse<T>(response: string): T {
    const jsonString = this.extractJsonFromResponse(response);
    return JSON.parse(jsonString);
  }
}
