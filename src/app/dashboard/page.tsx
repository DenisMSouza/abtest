'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getExperiments, createExperiment, getExperimentStats, updateExperiment } from '../services/api';
import { Button } from '@/components/ui/button';
import { ExperimentsList } from '@/components/ExperimentsList';
import { ExperimentDetails } from '@/components/ExperimentDetails';
import { Experiment, ExperimentStats, StatusFilter, ExperimentFormData } from '@/types/experiment';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [stats, setStats] = useState<ExperimentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const experimentsPerPage = 5;

  useEffect(() => {
    loadExperiments();
  }, []);

  // Handle URL-based experiment selection (from home page links)
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

  // Update selectedExperiment when experiments array changes (for internal updates)
  useEffect(() => {
    if (selectedExperiment && experiments.length > 0) {
      const updatedExperiment = experiments.find(exp => exp.id === selectedExperiment.id);
      if (updatedExperiment) {
        setSelectedExperiment(updatedExperiment);
      }
    }
  }, [experiments]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

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

  const handleCreateExperiment = async (data: ExperimentFormData) => {
    await createExperiment(data);
    loadExperiments();
  };

  const handleExperimentSelect = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    loadStats(experiment.id);
  };

  const handleStopExperiment = async (experimentId: string) => {
    try {
      const now = new Date().toISOString();
      await updateExperiment(experimentId, { endDate: now });
      loadExperiments();
      if (selectedExperiment?.id === experimentId) {
        loadStats(experimentId);
      }
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
      <div className="max-w-7xl mx-auto py-4 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 flex-col-reverse lg:flex-row justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">A/B Testing Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your experiments and view results</p>
            </div>
            <div className="flex w-full lg:w-auto justify-start gap-2">
              <Button variant="outline" asChild>
                <Link href="/settings">
                  ⚙️ Settings
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  ← Back to Overview
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ExperimentsList
            experiments={experiments}
            selectedExperiment={selectedExperiment}
            onExperimentSelect={handleExperimentSelect}
            onCreateExperiment={handleCreateExperiment}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            experimentsPerPage={experimentsPerPage}
          />

          <ExperimentDetails
            experiment={selectedExperiment}
            stats={stats}
            onStopExperiment={handleStopExperiment}
            onExperimentUpdate={loadExperiments}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}