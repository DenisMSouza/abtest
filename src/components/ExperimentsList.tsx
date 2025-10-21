'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineCopyButton } from '@/components/InlineCopyButton';
import { CreateExperimentForm } from '@/components/CreateExperimentForm';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Experiment, StatusFilter, ExperimentFormData } from '@/types/experiment';

interface ExperimentsListProps {
  experiments: Experiment[];
  selectedExperiment: Experiment | null;
  onExperimentSelect: (experiment: Experiment) => void;
  onCreateExperiment: (data: ExperimentFormData) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  experimentsPerPage: number;
}

export function ExperimentsList({
  experiments,
  selectedExperiment,
  onExperimentSelect,
  onCreateExperiment,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  onPageChange,
  experimentsPerPage,
}: ExperimentsListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filter experiments
  const filteredExperiments = experiments.filter(experiment => {
    const matchesSearch = experiment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      experiment.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && experiment.isActive) ||
      (statusFilter === 'inactive' && !experiment.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredExperiments.length / experimentsPerPage);
  const startIndex = (currentPage - 1) * experimentsPerPage;
  const endIndex = startIndex + experimentsPerPage;
  const paginatedExperiments = filteredExperiments.slice(startIndex, endIndex);

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Experiments</h2>
              <CreateExperimentForm
                open={showCreateForm}
                onOpenChange={setShowCreateForm}
                onSubmit={onCreateExperiment}
              />
            </div>

            {/* Search and Filter Controls */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search experiments..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8"
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onStatusFilterChange('all')}
                >
                  All ({experiments.length})
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onStatusFilterChange('active')}
                >
                  Active ({experiments.filter(e => e.isActive).length})
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onStatusFilterChange('inactive')}
                >
                  Inactive ({experiments.filter(e => !e.isActive).length})
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6">
          {filteredExperiments.length === 0 ? (
            <p className="text-gray-500">
              {experiments.length === 0
                ? 'No experiments yet'
                : 'No experiments match your search criteria'
              }
            </p>
          ) : (
            <div className="space-y-3">
              {paginatedExperiments.map((experiment) => (
                <div
                  key={experiment.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedExperiment?.id === experiment.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => onExperimentSelect(experiment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{experiment.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{experiment.description}</p>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full ${experiment.isActive
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                          }`}
                        title={experiment.isActive ? 'Active' : 'Inactive'}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {experiment.variations?.length || 0} variations
                    </span>
                    <div className="flex items-center space-x-2">
                      <InlineCopyButton text={experiment.id} />
                      <span className={`text-xs font-medium ${experiment.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {experiment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredExperiments.length > experimentsPerPage && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          onPageChange(currentPage - 1);
                        }
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === pageNumber}
                          onClick={(e) => {
                            e.preventDefault();
                            onPageChange(pageNumber);
                          }}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          onPageChange(currentPage + 1);
                        }
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Results Summary */}
          {filteredExperiments.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredExperiments.length)} of {filteredExperiments.length} experiments
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
