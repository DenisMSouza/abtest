'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getExperiments, createExperiment, getExperimentStats, updateExperiment } from '../services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Experiment {
  id: string;
  name: string;
  description?: string;
  version?: string;
  isActive: boolean;
  variations: Variation[];
}

interface Variation {
  id: string;
  name: string;
  weight: number;
  isBaseline: boolean;
}

interface ExperimentStats {
  experiment: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
  };
  variations: {
    id: string;
    name: string;
    weight: number;
    isBaseline: boolean;
    userCount: number;
    percentage: number;
  }[];
  totalUsers: number;
}

// Zod schema for form validation
const experimentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  version: z.string().min(1, 'Version is required').max(20, 'Version must be less than 20 characters'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  variations: z.array(
    z.object({
      name: z.string().min(1, 'Variation name is required').max(50, 'Variation name must be less than 50 characters'),
      weight: z.number().min(0, 'Weight must be at least 0').max(1, 'Weight must be at most 1'),
      isBaseline: z.boolean(),
    })
  ).min(1, 'At least one variation is required')
    .refine((variations) => {
      const totalWeight = variations.reduce((sum, v) => sum + v.weight, 0);
      // Use rounding to handle floating-point precision issues
      const roundedTotal = Math.round(totalWeight * 100) / 100;
      return Math.abs(roundedTotal - 1.0) <= 0.01; // Allow 1% tolerance for rounding
    }, {
      message: 'Variation weights must sum to 100% (1.0)',
      path: ['variations'],
    }),
});

type ExperimentFormData = z.infer<typeof experimentSchema>;

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [stats, setStats] = useState<ExperimentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [experimentToStop, setExperimentToStop] = useState<string | null>(null);

  // React Hook Form setup
  const form = useForm<ExperimentFormData>({
    resolver: zodResolver(experimentSchema),
    defaultValues: {
      name: '',
      description: '',
      version: '1.0.0',
      startDate: '',
      endDate: '',
      variations: [
        { name: 'baseline', weight: 0.5, isBaseline: true },
        { name: 'variant', weight: 0.5, isBaseline: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variations',
  });

  useEffect(() => {
    loadExperiments();
  }, []);

  useEffect(() => {
    const experimentId = searchParams.get('experiment');
    if (experimentId && experiments.length > 0) {
      const experiment = experiments.find(exp => exp.id === experimentId);
      if (experiment) {
        setSelectedExperiment(experiment);
        loadStats(experimentId);
      }
    }
  }, [searchParams, experiments]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await getExperiments();
      setExperiments(data);
    } catch (error) {
      console.error('Error loading experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (experimentId: string) => {
    try {
      const data = await getExperimentStats(experimentId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onSubmit = async (data: ExperimentFormData) => {
    try {
      await createExperiment(data);
      setShowCreateForm(false);
      form.reset();
      loadExperiments();
    } catch (error) {
      console.error('Error creating experiment:', error);
      if (error instanceof Error && error.message.includes('weights must sum to 100%')) {
        form.setError('variations', {
          type: 'manual',
          message: 'Error: ' + error.message,
        });
      }
    }
  };

  const addVariation = () => {
    append({ name: '', weight: 0.5, isBaseline: false });

    // Auto-balance weights after adding a new variation
    setTimeout(() => {
      autoBalanceWeights();
    }, 0);
  };

  const removeVariation = (index: number) => {
    remove(index);

    // Auto-balance weights after removing a variation
    setTimeout(() => {
      autoBalanceWeights();
    }, 0);
  };

  const autoBalanceWeights = () => {
    const currentVariations = form.getValues('variations');
    if (currentVariations.length === 0) return;

    // Calculate equal weight for all variations, using rounding for clean values
    const equalWeight = Math.round((1.0 / currentVariations.length) * 100) / 100; // Round to 2 decimal places (percentage)

    // Calculate the last weight to ensure total is exactly 1.0
    const lastWeight = 1.0 - (equalWeight * (currentVariations.length - 1));

    // Update all variations with balanced weights
    currentVariations.forEach((variation, index) => {
      const weight = index === currentVariations.length - 1 ? lastWeight : equalWeight;
      form.setValue(`variations.${index}.weight`, weight, {
        shouldValidate: true,
        shouldDirty: true
      });
    });
  };

  const getMaxAllowedWeight = (currentIndex: number) => {
    const variations = form.watch('variations') || [];
    const currentTotal = variations.reduce((sum, v, index) => {
      return index === currentIndex ? sum : sum + (v.weight || 0);
    }, 0);

    const maxAllowed = Math.max(0, 1.0 - currentTotal);
    return Math.round(maxAllowed * 100);
  };

  const handleWeightChange = (index: number, value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    const maxAllowed = getMaxAllowedWeight(index);
    const clampedValue = Math.min(numericValue, maxAllowed);

    form.setValue(`variations.${index}.weight`, clampedValue / 100, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const confirmStopExperiment = (experimentId: string) => {
    setExperimentToStop(experimentId);
    setShowStopConfirm(true);
  };

  const stopExperiment = async () => {
    if (!experimentToStop) return;

    try {
      const now = new Date().toISOString();
      await updateExperiment(experimentToStop, { endDate: now });
      loadExperiments();
      if (selectedExperiment?.id === experimentToStop) {
        loadStats(experimentToStop);
      }
      setShowStopConfirm(false);
      setExperimentToStop(null);
    } catch (error) {
      console.error('Error stopping experiment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading experiments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">A/B Testing Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your experiments and view results</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/">
                ← Back to Overview
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Experiments List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Experiments</h2>
                  <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                    <DialogTrigger asChild>
                      <Button>New Experiment</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New Experiment</DialogTitle>
                        <DialogDescription>
                          Create a new A/B test experiment with multiple variations and weights.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            type="text"
                            {...form.register('name')}
                          />
                          {form.formState.errors.name && (
                            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <textarea
                            id="description"
                            {...form.register('description')}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            rows={3}
                          />
                          {form.formState.errors.description && (
                            <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="version">Version</Label>
                          <Input
                            id="version"
                            type="text"
                            {...form.register('version')}
                          />
                          {form.formState.errors.version && (
                            <p className="text-sm text-destructive">{form.formState.errors.version.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Variations</Label>
                            <div className="flex space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={autoBalanceWeights}
                              >
                                Balance Weights
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addVariation}
                              >
                                + Add Variation
                              </Button>
                            </div>
                          </div>
                          {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center space-x-2">
                              <Input
                                type="text"
                                placeholder="Variation name"
                                {...form.register(`variations.${index}.name`)}
                                className="flex-1"
                              />
                              <div className="flex items-center space-x-1">
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  max={getMaxAllowedWeight(index)}
                                  value={Math.round((form.watch(`variations.${index}.weight`) || 0) * 100)}
                                  onChange={(e) => handleWeightChange(index, e.target.value)}
                                  className="w-16"
                                  placeholder="50"
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                              </div>
                              <Label className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  {...form.register(`variations.${index}.isBaseline`)}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm">Baseline</span>
                              </Label>
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeVariation(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ×
                                </Button>
                              )}
                            </div>
                          ))}
                          <p className="text-sm text-muted-foreground">
                            Total: {Math.round((form.watch('variations')?.reduce((sum, v) => sum + (v.weight || 0), 0) * 100 || 0) * 10) / 10}%
                            {Math.abs(Math.round((form.watch('variations')?.reduce((sum, v) => sum + (v.weight || 0), 0) || 0) * 100) / 100 - 1.0) <= 0.01 && (
                              <span className="text-green-600 ml-2">✓ Complete</span>
                            )}
                          </p>
                          {form.formState.errors.variations && (
                            <p className="text-sm text-destructive">{form.formState.errors.variations.message}</p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => {
                            setShowCreateForm(false);
                            form.reset();
                          }}>
                            Cancel
                          </Button>
                          <div className="flex flex-col space-y-2">
                            <Button
                              type="submit"
                              disabled={!form.formState.isValid || form.formState.isSubmitting}
                            >
                              {form.formState.isSubmitting ? 'Creating...' : 'Create'}
                            </Button>
                          </div>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="p-6">
                {experiments.length === 0 ? (
                  <p className="text-gray-500">No experiments yet</p>
                ) : (
                  <div className="space-y-3">
                    {experiments.map((experiment) => (
                      <div
                        key={experiment.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedExperiment?.id === experiment.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => {
                          setSelectedExperiment(experiment);
                          loadStats(experiment.id);
                        }}
                      >
                        <h3 className="font-medium text-gray-900">{experiment.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{experiment.description}</p>
                        <div className="flex items-center mt-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${experiment.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {experiment.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {experiment.variations.length} variations
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Experiment Details & Stats */}
          <div className="lg:col-span-2">
            {selectedExperiment ? (
              <div className="space-y-6">
                {/* Experiment Info */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedExperiment.name}
                    </h2>
                    {selectedExperiment.isActive && (
                      <Button
                        variant="destructive"
                        onClick={() => confirmStopExperiment(selectedExperiment.id)}
                      >
                        Stop Experiment
                      </Button>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{selectedExperiment.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Version:</span>
                      <p className="text-gray-900">{selectedExperiment.version}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${selectedExperiment.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {selectedExperiment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variations */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Variations</h3>
                  <div className="space-y-3">
                    {selectedExperiment.variations.map((variation) => (
                      <div key={variation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{variation.name}</span>
                          {variation.isBaseline && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Baseline
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{Math.round(variation.weight * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                {stats && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-500">Total Users:</span>
                      <span className="ml-2 text-lg font-semibold text-gray-900">{stats.totalUsers}</span>
                    </div>
                    <div className="space-y-3">
                      {stats.variations.map((variation) => (
                        <div key={variation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">{variation.name}</span>
                            {variation.isBaseline && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Baseline
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{variation.userCount} users</div>
                            <div className="text-xs text-gray-600">{Math.round(variation.percentage)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Experiment</h3>
                <p className="text-gray-600">Choose an experiment from the list to view details and statistics</p>
              </div>
            )}
          </div>
        </div>


        {/* Stop Experiment Confirmation Dialog */}
        <Dialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Stop Experiment</DialogTitle>
              <DialogDescription>
                Are you sure you want to stop this experiment? This will set the end date to now and
                all new users will see the baseline variation. Existing data will be preserved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowStopConfirm(false);
                  setExperimentToStop(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={stopExperiment}>
                Stop Experiment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
