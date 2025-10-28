'use client';

import { Button } from '@/components/ui/button';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentFormData } from '@/types/experiment';

interface EditExperimentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experiment: {
    id: string;
    name: string;
    description?: string;
    version?: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    variations: {
      id: string;
      name: string;
      weight: number;
      isBaseline: boolean;
    }[];
    successMetric?: {
      type: 'click' | 'conversion' | 'custom';
      target?: string;
      value?: number;
    };
  };
  onSubmit: (data: ExperimentFormData & { id?: string }) => Promise<void>;
}

export function EditExperimentForm({ open, onOpenChange, experiment, onSubmit }: EditExperimentFormProps) {
  return (
    <ExperimentForm
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      initialData={experiment}
      trigger={
        <Button variant="outline" size="sm" className="gap-2">
          Edit Experiment
        </Button>
      }
      title="Edit Experiment"
      description="Update experiment settings, weights, and duration."
      submitButtonText="Update Experiment"
    />
  );
}