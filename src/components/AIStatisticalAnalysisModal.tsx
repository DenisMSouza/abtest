"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, TrendingUp, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { AIStatisticalAnalysis } from "@/lib/ai-statistical-service";

interface AIStatisticalAnalysisModalProps {
  experimentId: string;
  experimentName: string;
  experiment?: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
  };
  stats?: {
    variations: {
      id: string;
      name: string;
      weight: number;
      isBaseline: boolean;
      userCount: number;
      successCount: number;
      successRate: number;
      percentage: number;
    }[];
    totalUsers: number;
  };
  onAnalysisComplete?: (analysis: AIStatisticalAnalysis) => void;
}

export function AIStatisticalAnalysisModal({
  experimentId,
  experimentName,
  experiment,
  stats,
  onAnalysisComplete,
}: AIStatisticalAnalysisModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AIStatisticalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Reset state when opening the modal
      setAnalysis(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use real experiment data if available, otherwise fall back to basic info
      if (!experiment || !stats) {
        throw new Error("Experiment data not available. Please ensure the experiment is selected and has statistical data.");
      }

      // Transform the real data to match the AI service expected format
      const realData = {
        experimentId: experiment.id,
        experimentName: experiment.name,
        totalUsers: stats.totalUsers,
        duration: "Unknown", // We don't have duration in our current data structure
        variations: stats.variations.map(variation => ({
          name: variation.name,
          users: variation.userCount,
          conversions: variation.successCount,
          conversionRate: variation.successRate,
          isBaseline: variation.isBaseline,
        })),
        // We'll let the AI calculate statistical significance
        statisticalSignificance: {
          pValue: 0, // Will be calculated by AI
          confidenceLevel: 0, // Will be calculated by AI
          isSignificant: false, // Will be calculated by AI
        },
        relativeUplift: [], // Will be calculated by AI
      };

      const response = await fetch("/api/ai/analyze-experiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: realData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || "Failed to analyze experiment");
      }

      setAnalysis(result.analysis);
      onAnalysisComplete?.(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "stop":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "continue":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "adjust_weights":
        return <Target className="h-4 w-4 text-blue-500" />;
      case "extend":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "stop":
        return "bg-red-50 border-red-200 text-red-800";
      case "continue":
        return "bg-green-50 border-green-200 text-green-800";
      case "adjust_weights":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "extend":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Brain className="h-4 w-4" />
          AI Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Statistical Analysis
          </DialogTitle>
          <DialogDescription>
            Intelligent analysis of experiment performance with actionable recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!analysis && !isLoading && !error && (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
              <p className="text-gray-600 mb-4">
                Get AI-powered insights about your experiment performance
              </p>
              <Button onClick={handleAnalyze} className="gap-2">
                <Brain className="h-4 w-4" />
                Start Analysis
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Analyzing Experiment</h3>
              <p className="text-gray-600">
                AI is analyzing your experiment data and generating insights...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Analysis Failed</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleAnalyze} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{analysis.summary}</p>
                </CardContent>
              </Card>

              {/* Confidence Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistical Confidence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        analysis.confidence.level === "High"
                          ? "default"
                          : analysis.confidence.level === "Medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {analysis.confidence.level} Confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {analysis.confidence.interpretation}
                  </p>
                  <p className="text-sm font-medium">
                    {analysis.confidence.recommendation}
                  </p>
                </CardContent>
              </Card>

              {/* Performance Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.performance.winner && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Winner: {analysis.performance.winner}</span>
                    </div>
                  )}
                  {analysis.performance.loser && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Underperforming: {analysis.performance.loser}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    {analysis.performance.analysis}
                  </p>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-4 rounded-lg border ${getActionColor(analysis.recommendations.action)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getActionIcon(analysis.recommendations.action)}
                      <span className="font-medium capitalize">
                        {analysis.recommendations.action.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{analysis.recommendations.reason}</p>
                    <p className="text-sm">{analysis.recommendations.details}</p>
                  </div>

                  {analysis.recommendations.suggestedWeights && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Suggested Weight Adjustments:</h4>
                      <div className="space-y-1">
                        {Object.entries(analysis.recommendations.suggestedWeights).map(
                          ([variation, weight]) => (
                            <div key={variation} className="flex justify-between text-sm">
                              <span>{variation}</span>
                              <span className="font-medium">{Math.round(weight * 100)}%</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {analysis.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
