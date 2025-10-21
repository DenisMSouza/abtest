'use client';

import { CopyButton } from './ui/copy-button';

interface ExperimentIdSectionProps {
  experimentId: string;
  onCopy?: () => void;
}

export function ExperimentIdSection({ experimentId, onCopy }: ExperimentIdSectionProps) {
  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900 mb-1">Experiment ID</h3>
          <p className="text-xs text-blue-700 mb-2">Copy this ID to use in your frontend code</p>
          <div className="flex items-center space-x-2">
            <code className="text-sm bg-white px-2 py-1 rounded border text-gray-800 font-mono">
              {experimentId}
            </code>
            <CopyButton
              text={experimentId}
              onCopy={onCopy}
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
