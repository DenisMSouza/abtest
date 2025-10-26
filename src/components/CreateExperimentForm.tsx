'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExperimentFormData } from '@/types/experiment';

// Zod schema for form validation
const experimentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  version: z.string().min(1, 'Version is required').max(20, 'Version must be less than 20 characters'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  successMetric: z.object({
    type: z.enum(['click', 'conversion', 'custom']),
    target: z.string().optional(),
    value: z.number().optional(),
  }).optional(),
  variations: z.array(
    z.object({
      name: z.string().min(1, 'Variation name is required').max(50, 'Variation name must be less than 50 characters'),
      weight: z.number().min(0, 'Weight must be at least 0').max(1, 'Weight must be at most 1'),
      isBaseline: z.boolean(),
    })
  ).min(1, 'At least one variation is required')
    .refine((variations) => {
      const totalWeight = variations.reduce((sum, v) => sum + v.weight, 0);
      const roundedTotal = Math.round(totalWeight * 100) / 100;
      return Math.abs(roundedTotal - 1.0) <= 0.01;
    }, {
      message: 'Variation weights must sum to 100% (1.0)',
      path: ['variations'],
    })
    .refine((variations) => {
      const baselineCount = variations.filter(v => v.isBaseline).length;
      return baselineCount === 1;
    }, {
      message: 'Exactly one variation must be set as baseline',
      path: ['variations'],
    }),
});

interface CreateExperimentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExperimentFormData) => Promise<void>;
}

export function CreateExperimentForm({ open, onOpenChange, onSubmit }: CreateExperimentFormProps) {
  const form = useForm<ExperimentFormData>({
    resolver: zodResolver(experimentSchema),
    defaultValues: {
      name: '',
      description: '',
      version: '1.0.0',
      startDate: '',
      endDate: '',
      successMetric: {
        type: 'click',
        target: '',
        value: undefined,
      },
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

  const handleSubmit = async (data: ExperimentFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
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
    setTimeout(() => {
      autoBalanceWeights();
    }, 0);
  };

  const removeVariation = (index: number) => {
    const variations = form.getValues('variations');
    const isRemovingBaseline = variations[index]?.isBaseline;

    remove(index);

    if (isRemovingBaseline && variations.length > 1) {
      setTimeout(() => {
        const remainingVariations = form.getValues('variations');
        if (remainingVariations.length > 0) {
          form.setValue(`variations.0.isBaseline`, true, {
            shouldValidate: true,
            shouldDirty: true
          });
        }
      }, 0);
    }

    setTimeout(() => {
      autoBalanceWeights();
    }, 0);
  };

  const autoBalanceWeights = () => {
    const currentVariations = form.getValues('variations');
    if (currentVariations.length === 0) return;

    const equalWeight = Math.round((1.0 / currentVariations.length) * 100) / 100;
    const lastWeight = 1.0 - (equalWeight * (currentVariations.length - 1));

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

  const handleBaselineChange = (index: number, isChecked: boolean) => {
    if (isChecked) {
      const variations = form.getValues('variations');
      variations.forEach((_, i) => {
        if (i !== index) {
          form.setValue(`variations.${i}.isBaseline`, false, {
            shouldValidate: true,
            shouldDirty: true
          });
        }
      });
    }

    form.setValue(`variations.${index}.isBaseline`, isChecked, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">New Experiment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Experiment</DialogTitle>
          <DialogDescription>
            Create a new A/B test experiment with multiple variations and weights.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

          {/* Success Metric Configuration */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="successMetric.type">Success Metric Type</Label>
              <select
                id="successMetric.type"
                {...form.register('successMetric.type')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="click">Button Click</option>
                <option value="conversion">Page Conversion</option>
                <option value="custom">Custom Event</option>
              </select>
              {form.formState.errors.successMetric?.type && (
                <p className="text-sm text-destructive">{form.formState.errors.successMetric.type.message}</p>
              )}
            </div>

            {form.watch('successMetric.type') === 'click' && (
              <div className="space-y-2">
                <Label htmlFor="successMetric.target">Button ID or Selector</Label>
                <Input
                  id="successMetric.target"
                  type="text"
                  placeholder="e.g., #cta-button, .purchase-btn"
                  {...form.register('successMetric.target')}
                />
                {form.formState.errors.successMetric?.target && (
                  <p className="text-sm text-destructive">{form.formState.errors.successMetric.target.message}</p>
                )}
              </div>
            )}

            {form.watch('successMetric.type') === 'conversion' && (
              <div className="space-y-2">
                <Label htmlFor="successMetric.target">Conversion URL</Label>
                <Input
                  id="successMetric.target"
                  type="text"
                  placeholder="e.g., /thank-you, /checkout/success"
                  {...form.register('successMetric.target')}
                />
                {form.formState.errors.successMetric?.target && (
                  <p className="text-sm text-destructive">{form.formState.errors.successMetric.target.message}</p>
                )}
              </div>
            )}

            {form.watch('successMetric.type') === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="successMetric.target">Custom Event Name</Label>
                <Input
                  id="successMetric.target"
                  type="text"
                  placeholder="e.g., purchase_completed, user_signup"
                  {...form.register('successMetric.target')}
                />
                {form.formState.errors.successMetric?.target && (
                  <p className="text-sm text-destructive">{form.formState.errors.successMetric.target.message}</p>
                )}
              </div>
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
                    checked={form.watch(`variations.${index}.isBaseline`)}
                    onChange={(e) => handleBaselineChange(index, e.target.checked)}
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
              onOpenChange(false);
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
  );
}
