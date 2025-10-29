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
import { Loader2, Brain, TrendingUp, AlertTriangle, CheckCircle, Target, AlertCircle } from "lucide-react";
import { AIStatisticalAnalysis } from "@/lib/ai-statistical-service";
import { calculateStatisticalSignificance } from "@/app/utils/statistics";

interface AIStatisticalAnalysisModalProps {
  experimentId: string;
  experimentName: string;
  experiment?: {
    id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
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
  onStopExperiment?: (experimentId: string) => void;
  onUpdateExperiment?: (experimentId: string, data: any) => Promise<void>;
}

export function AIStatisticalAnalysisModal({
  experimentId,
  experimentName,
  experiment,
  stats,
  onAnalysisComplete,
  onStopExperiment,
  onUpdateExperiment,
}: AIStatisticalAnalysisModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AIStatisticalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

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

  // Calculate experiment duration
  const calculateDuration = (experiment: any): string => {
    if (!experiment) return "Unknown";

    const now = new Date();
    let startDate: Date;
    let endDate: Date | null = null;

    // Use startDate if available, otherwise use createdAt
    if (experiment.startDate) {
      startDate = new Date(experiment.startDate);
    } else if (experiment.createdAt) {
      startDate = new Date(experiment.createdAt);
    } else {
      return "Unknown";
    }

    // Use endDate if available (for both active and inactive experiments)
    if (experiment.endDate) {
      endDate = new Date(experiment.endDate);
    }

    // Calculate duration
    const end = endDate || now;
    const diffMs = end.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return "Less than 1 minute";
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
        duration: calculateDuration(experiment), // Calculate actual duration
        endDate: experiment.endDate || null, // Include endDate information for AI decision making
        variations: stats.variations.map(variation => ({
          name: variation.name,
          users: variation.userCount,
          conversions: variation.successCount,
          conversionRate: variation.successRate,
          isBaseline: variation.isBaseline,
          currentWeight: variation.weight, // Include current weight distribution
        })),
        // Calculate real statistical significance
        statisticalSignificance: calculateStatisticalSignificance(
          {
            name: stats.variations[0].name,
            visitors: stats.variations[0].userCount,
            conversions: stats.variations[0].successCount,
            conversionRate: stats.variations[0].successRate,
          },
          {
            name: stats.variations[1].name,
            visitors: stats.variations[1].userCount,
            conversions: stats.variations[1].successCount,
            conversionRate: stats.variations[1].successRate,
          }
        ),
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

  // Check if suggested weights are the same as current weights
  const areWeightsSame = (suggestedWeights: Record<string, number>): boolean => {
    if (!stats || !suggestedWeights) return false;

    // Create a map of current weights by variation name
    const currentWeights = new Map<string, number>();
    stats.variations.forEach(variation => {
      currentWeights.set(variation.name, variation.weight);
    });

    // Check if all suggested weights match current weights (with small tolerance for floating point)
    for (const [variationName, suggestedWeight] of Object.entries(suggestedWeights)) {
      const currentWeight = currentWeights.get(variationName);
      if (currentWeight === undefined || Math.abs(currentWeight - suggestedWeight) > 0.01) {
        return false;
      }
    }

    return true;
  };

  // Apply AI suggestions based on the recommendation
  const handleApplySuggestions = async () => {
    if (!analysis || !experiment) return;


    setIsApplying(true);
    try {
      const { action, suggestedWeights } = analysis.recommendations;


      switch (action) {
        case "stop":
          if (onStopExperiment) {
            onStopExperiment(experimentId);
          }
          break;

        case "extend":
          if (onUpdateExperiment && experiment.endDate) {
            // Extend the experiment by 7 days from current end date
            const currentEndDate = new Date(experiment.endDate);
            const newEndDate = new Date(currentEndDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            await onUpdateExperiment(experimentId, {
              endDate: newEndDate.toISOString().split('T')[0],
            });
          }
          break;

        case "adjust_weights":
          if (onUpdateExperiment && suggestedWeights && stats) {
            // Create variations array with updated weights
            const updatedVariations = stats.variations.map(variation => ({
              name: variation.name,
              weight: suggestedWeights[variation.name] || variation.weight,
              isBaseline: variation.isBaseline,
            }));

            await onUpdateExperiment(experimentId, {
              variations: updatedVariations,
            });
          }
          break;

        case "continue":
          // Apply weight adjustments if suggested, even for "continue" action
          if (onUpdateExperiment && suggestedWeights && stats && !areWeightsSame(suggestedWeights)) {
            // Create variations array with updated weights
            const updatedVariations = stats.variations.map(variation => ({
              name: variation.name,
              weight: suggestedWeights[variation.name] || variation.weight,
              isBaseline: variation.isBaseline,
            }));

            await onUpdateExperiment(experimentId, {
              variations: updatedVariations,
            });
          }
          break;

        default:
        // Unknown action - do nothing
      }

      // Close the modal after successful application
      setIsOpen(false);
    } catch (error) {
      // Error handling - could be improved with user notification
    } finally {
      setIsApplying(false);
    }
  };

  // Check if the current action can be applied
  const canApplyAction = (): boolean => {
    if (!analysis || !experiment) return false;

    const { action, suggestedWeights } = analysis.recommendations;

    // Check for actionable suggestions regardless of action type
    const hasActionableWeights = !!suggestedWeights && !areWeightsSame(suggestedWeights);

    switch (action) {
      case "stop":
        return !!onStopExperiment && experiment.isActive;
      case "extend":
        return !!onUpdateExperiment && !!experiment.endDate;
      case "adjust_weights":
        return !!onUpdateExperiment && hasActionableWeights;
      case "continue":
        // Show button if there are actionable weight suggestions, even for "continue"
        return !!onUpdateExperiment && hasActionableWeights;
      default:
        return false;
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
                  {analysis.performance.winner && analysis.performance.winner !== "null" && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Winner: {analysis.performance.winner}</span>
                    </div>
                  )}
                  {analysis.performance.loser && analysis.performance.loser !== "null" && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Underperforming: {analysis.performance.loser}</span>
                    </div>
                  )}
                  {(!analysis.performance.winner || analysis.performance.winner === "null") &&
                    (!analysis.performance.loser || analysis.performance.loser === "null") && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-yellow-700">No clear winner identified</span>
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

                  {analysis.recommendations.suggestedWeights && !areWeightsSame(analysis.recommendations.suggestedWeights) && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Suggested Weight Adjustments:</h4>
                      {(() => {
                        const weights = Object.values(analysis.recommendations.suggestedWeights);
                        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                        const isValid = Math.abs(totalWeight - 1.0) < 0.01; // Allow small floating point errors

                        return (
                          <>
                            {!isValid && (
                              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                ⚠️ Warning: Weights sum to {(totalWeight * 100).toFixed(1)}% (should be 100%)
                              </div>
                            )}
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
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Apply Suggestions Button */}
                  {canApplyAction() && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        onClick={handleApplySuggestions}
                        disabled={isApplying}
                        className="w-full gap-2"
                        variant={analysis.recommendations.action === "stop" ? "destructive" : "default"}
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Apply Suggestions
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {analysis.recommendations.action === "stop" && "This will stop the experiment"}
                        {analysis.recommendations.action === "extend" && "This will extend the experiment by 7 days"}
                        {analysis.recommendations.action === "adjust_weights" && "This will update variation weights"}
                      </p>
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
