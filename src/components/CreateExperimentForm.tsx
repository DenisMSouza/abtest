'use client';

import { Button } from '@/components/ui/button';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentFormData } from '@/types/experiment';

interface CreateExperimentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExperimentFormData) => Promise<void>;
}

export function CreateExperimentForm({ open, onOpenChange, onSubmit }: CreateExperimentFormProps) {
  return (
    <ExperimentForm
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      trigger={
        <Button size="sm">New Experiment</Button>
      }
      title="Create New Experiment"
      description="Create a new A/B test experiment with multiple variations and weights."
      submitButtonText="Create Experiment"
    />
  );
}