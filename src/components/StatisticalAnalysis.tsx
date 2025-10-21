'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateStatisticalSignificance, VariationStats } from '@/app/utils/statistics';

interface StatisticalAnalysisProps {
  variations: Array<{
    id: string;
    name: string;
    userCount: number;
    successCount: number;
    successRate: number;
    [key: string]: any; // Allow additional properties
  }>;
}

export function StatisticalAnalysis({ variations }: StatisticalAnalysisProps) {
  // We need at least 2 variations to compare
  if (variations.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistical Analysis</CardTitle>
          <CardDescription>
            Need at least 2 variations to perform statistical analysis
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // For now, compare the first two variations (baseline vs first variation)
  const baseline = variations.find(v => v.isBaseline) || variations[0];
  const testVariation = variations.find(v => !v.isBaseline) || variations[1];

  const variationA: VariationStats = {
    name: baseline.name,
    visitors: baseline.userCount,
    conversions: baseline.successCount,
    conversionRate: baseline.successRate / 100 // Convert percentage to decimal
  };

  const variationB: VariationStats = {
    name: testVariation.name,
    visitors: testVariation.userCount,
    conversions: testVariation.successCount,
    conversionRate: testVariation.successRate / 100 // Convert percentage to decimal
  };

  const result = calculateStatisticalSignificance(variationA, variationB);

  // Handle NaN values
  const safePValue = isNaN(result.pValue) ? 1.0 : result.pValue;
  const safeZScore = isNaN(result.zScore) ? 0 : result.zScore;
  const safeRelativeUplift = isNaN(result.relativeUplift) ? 0 : result.relativeUplift;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Statistical Analysis
            <Badge variant={result.isSignificant ? "default" : "secondary"}>
              {result.isSignificant ? "Significant" : "Not Significant"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Statistical significance test at 95% confidence level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Result Message */}
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm font-medium mb-2">Test Result:</p>
            <p className="text-sm text-muted-foreground">
              {result.isSignificant ? (
                <span className="text-green-600 font-medium">
                  The test result is significant!
                </span>
              ) : (
                <span className="text-orange-600 font-medium">
                  The test result is not significant.
                </span>
              )}
            </p>
          </div>

          {/* Conversion Rates Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm font-medium text-muted-foreground">{variationA.name}</p>
              <p className="text-2xl font-bold text-blue-600">
                {(variationA.conversionRate * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {variationA.conversions}/{variationA.visitors} conversions
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-sm font-medium text-muted-foreground">{variationB.name}</p>
              <p className="text-2xl font-bold text-green-600">
                {(variationB.conversionRate * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {variationB.conversions}/{variationB.visitors} conversions
              </p>
            </div>
          </div>

          {/* Statistical Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Statistical Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help flex items-center gap-1">
                      P-value:
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Probability that the observed difference occurred by chance.
                      Lower values (≤0.05) indicate statistical significance.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="ml-2 font-mono">
                  {safePValue.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help flex items-center gap-1">
                      Z-score:
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Standard score indicating how many standard deviations
                      the result is from the expected value. Higher absolute values indicate stronger evidence.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="ml-2 font-mono">
                  {safeZScore.toFixed(3)}
                </span>
              </div>
              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help flex items-center gap-1">
                      Relative Uplift:
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Percentage improvement of the test variation compared to baseline.
                      Positive values indicate improvement, negative values indicate decline.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className={`ml-2 font-mono ${safeRelativeUplift >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {safeRelativeUplift >= 0 ? '+' : ''}{safeRelativeUplift.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground cursor-help flex items-center gap-1">
                      Confidence:
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Confidence level for the statistical test. 95% means we can be 95% confident
                      that the observed difference is real and not due to random chance.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="ml-2 font-mono">
                  {result.confidenceLevel}%
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Message */}
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-2">
              {result.message}
            </p>
            <p className="text-sm font-medium">
              {result.recommendation}
            </p>
          </div>

          {/* Sample Size Warning */}
          {variationA.visitors < 100 || variationB.visitors < 100 ? (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Small sample size warning:</strong> Results may not be reliable with fewer than 100 visitors per variation. Consider collecting more data.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
