'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw, CheckCircle } from 'lucide-react';
import { AIExperimentSuggestion } from '@/lib/ai-service';

interface AIExperimentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (suggestion: AIExperimentSuggestion) => void;
}

export function AIExperimentForm({ open, onOpenChange, onSubmit }: AIExperimentFormProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AIExperimentSuggestion | null>(null);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-experiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate suggestion');
      }

      setSuggestion(data.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refinePrompt.trim() || !suggestion) return;

    setIsRefining(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-experiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: refinePrompt,
          refine: true,
          originalSuggestion: suggestion
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refine suggestion');
      }

      setSuggestion(data.suggestion);
      setRefinePrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRefining(false);
    }
  };

  const handleUseSuggestion = () => {
    if (suggestion) {
      onSubmit(suggestion);
      handleClose();
    }
  };

  const handleClose = () => {
    setSuggestion(null);
    setPrompt('');
    setRefinePrompt('');
    setError(null);
    onOpenChange(false);
  };

  const handleReset = () => {
    setSuggestion(null);
    setPrompt('');
    setRefinePrompt('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          ✨ AI Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Experiment Generator
          </DialogTitle>
          <DialogDescription>
            Describe what you want to test and we'll create a complete experiment plan for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!suggestion ? (
            <Card>
              <CardHeader>
                <CardTitle>Describe Your Experiment</CardTitle>
                <CardDescription>
                  Tell us what you want to test and we'll create a complete experiment plan for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt">What do you want to test?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., I want to test if changing the button color from blue to green will increase sign-ups on my landing page. I'm thinking of testing this on our main CTA button on the homepage, and I want to measure conversion rate as the success metric. The test should run for 2 weeks and target all new visitors."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-1 min-h-[120px] resize-none"
                    rows={5}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Experiment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Generated Experiment
                      </CardTitle>
                      <CardDescription>
                        Review and refine the AI-generated experiment
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{suggestion.name}</h3>
                    <p className="text-gray-600 mt-1">{suggestion.description}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Variations</h4>
                    <div className="space-y-2">
                      {suggestion.variations.map((variation, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{variation.name}</span>
                              {variation.isBaseline && (
                                <Badge variant="secondary">Baseline</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{variation.description}</p>
                          </div>
                          <Badge variant="outline">{Math.round(variation.weight * 100)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Success Metric</h4>
                      <p className="text-sm text-gray-600">{suggestion.successMetric}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Duration</h4>
                      <p className="text-sm text-gray-600">{suggestion.estimatedDuration}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Target Audience</h4>
                      <p className="text-sm text-gray-600">{suggestion.targetAudience}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Hypothesis</h4>
                      <p className="text-sm text-gray-600">{suggestion.hypothesis}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label htmlFor="refine">Want to refine this experiment?</Label>
                    <div className="space-y-2 mt-2">
                      <Textarea
                        id="refine"
                        placeholder="e.g., Change the green button to red instead, or add a third variation with a different color. Also, I want to test this on mobile users only and extend the duration to 3 weeks."
                        value={refinePrompt}
                        onChange={(e) => setRefinePrompt(e.target.value)}
                        className="min-h-[80px] resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleRefine}
                          disabled={!refinePrompt.trim() || isRefining}
                          variant="outline"
                          size="sm"
                        >
                          {isRefining ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Refining...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refine
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {suggestion ? (
            <>
              <Button onClick={handleUseSuggestion} className="flex-1">
                Use This Experiment
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
