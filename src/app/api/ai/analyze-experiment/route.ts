import { NextRequest, NextResponse } from "next/server";
import {
  AIStatisticalService,
  StatisticalData,
} from "@/lib/ai-statistical-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json(
        { error: "Missing experiment data" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.experimentId || !data.experimentName || !data.variations) {
      return NextResponse.json(
        { error: "Invalid experiment data structure" },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "AI analysis not configured. Please set OPENROUTER_API_KEY." },
        { status: 500 }
      );
    }

    // Analyze the experiment data
    const analysis = await AIStatisticalService.analyzeExperiment(
      data as StatisticalData
    );

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("AI analysis error:", error);

    return NextResponse.json(
      {
        error: "Failed to analyze experiment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
