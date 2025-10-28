import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { prompt, refine, originalSuggestion } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Check if we have the OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    let suggestion;

    if (refine && originalSuggestion) {
      // Refine existing suggestion
      suggestion = await AIService.refineExperimentSuggestion(
        originalSuggestion,
        prompt
      );
    } else {
      // Generate new suggestion
      suggestion = await AIService.generateExperimentSuggestion(prompt);
    }

    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error) {
    console.error("AI experiment generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate experiment suggestion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
