'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExperimentIdSection } from '@/components/ExperimentIdSection';
import { StatisticalAnalysis } from '@/components/StatisticalAnalysis';
import { EditExperimentForm } from '@/components/EditExperimentForm';
import { Experiment, ExperimentStats } from '@/types/experiment';
import { updateExperiment } from '@/app/services/api';

interface ExperimentDetailsProps {
  experiment: Experiment | null;
  stats: ExperimentStats | null;
  onStopExperiment: (experimentId: string) => void;
  onExperimentUpdate?: () => void;
}

export function ExperimentDetails({ experiment, stats, onStopExperiment, onExperimentUpdate }: ExperimentDetailsProps) {
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const confirmStopExperiment = () => {
    setShowStopConfirm(true);
  };

  const handleStopExperiment = () => {
    if (experiment) {
      onStopExperiment(experiment.id);
      setShowStopConfirm(false);
    }
  };

  const handleUpdateExperiment = async (data: any) => {
    if (!experiment || !data.id) return;

    try {
      await updateExperiment(data.id, data);
      setShowEditForm(false);
      // Refresh the experiment data
      if (onExperimentUpdate) {
        onExperimentUpdate();
      }
    } catch (error) {
      console.error('Error updating experiment:', error);
      throw error; // Re-throw to let the form handle the error
    }
  };

  // Wrapper for AI modal that expects (experimentId, data) signature
  const handleAIUpdateExperiment = async (experimentId: string, data: any) => {
    try {
      await updateExperiment(experimentId, data);
      // Refresh the experiment data
      if (onExperimentUpdate) {
        onExperimentUpdate();
      }
    } catch (error) {
      console.error('Error updating experiment:', error);
      throw error;
    }
  };

  return (
    <div className="lg:col-span-2">
      {experiment ? (
        <div className="space-y-6">
          {/* Experiment Info */}
          <div className="bg-white rounded-lg shadow p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {experiment.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Version:</span>
                    <span className="text-gray-900">{experiment.version}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Status:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${experiment.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {experiment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              {experiment.isActive && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <EditExperimentForm
                    open={showEditForm}
                    onOpenChange={setShowEditForm}
                    experiment={experiment}
                    onSubmit={handleUpdateExperiment}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmStopExperiment}
                    className="w-full sm:w-auto"
                  >
                    Stop Experiment
                  </Button>
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-4">{experiment.description}</p>

            {/* Experiment ID Copy Section */}
            <ExperimentIdSection experimentId={experiment.id} />

            {/* Variations and Statistics - Modern Card Layout */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Variations Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-blue-900">Variations</h3>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  {experiment.variations?.sort((a, b) => {
                    if (a.isBaseline && !b.isBaseline) return -1;
                    if (!a.isBaseline && b.isBaseline) return 1;
                    return 0;
                  }).map((variation) => (
                    <div key={variation.id} className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-200/50">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${variation.isBaseline ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <span className="font-medium text-gray-900">{variation.name}</span>
                        {variation.isBaseline && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Baseline
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-900">{Math.round(variation.weight * 100)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics Card */}
              {stats && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-green-900">Performance</h3>
                    <div className="text-xs text-green-600 font-medium">{stats.totalUsers} users</div>
                  </div>
                  <div className="space-y-3">
                    {stats.variations?.sort((a, b) => {
                      if (a.isBaseline && !b.isBaseline) return -1;
                      if (!a.isBaseline && b.isBaseline) return 1;
                      return 0;
                    }).map((variation) => (
                      <div key={variation.id} className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-200/50">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${variation.isBaseline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="font-medium text-gray-900">{variation.name}</span>
                          {variation.isBaseline && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Baseline
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-900">{variation.userCount}</div>
                          <div className="text-xs text-green-600">{Math.round(variation.percentage)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistical Analysis */}
          {stats && stats.variations && stats.variations.length >= 2 && (
            <StatisticalAnalysis
              experimentId={experiment.id}
              experimentName={experiment.name}
              experiment={experiment}
              stats={stats}
              variations={stats.variations}
              onStopExperiment={onStopExperiment}
              onUpdateExperiment={handleAIUpdateExperiment}
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Experiment</h3>
          <p className="text-gray-600">Choose an experiment from the list to view details and statistics</p>
        </div>
      )}

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
              onClick={() => setShowStopConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleStopExperiment}>
              Stop Experiment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
