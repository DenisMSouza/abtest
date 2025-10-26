'use client';

import { useState } from 'react';
import { AIExperimentForm } from '@/components/AIExperimentForm';
import { AIExperimentSuggestion } from '@/lib/ai-service';

export default function TestAIPage() {
  const [suggestion, setSuggestion] = useState<AIExperimentSuggestion | null>(null);

  const handleExperimentGenerated = (suggestion: AIExperimentSuggestion) => {
    setSuggestion(suggestion);
    console.log('AI Generated Experiment:', suggestion);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Experiment Generator Test</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Configuration Required</h2>
          <p className="text-yellow-700">
            To test the AI integration, you need to:
          </p>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-yellow-700">
            <li>Get an API key from <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter</a></li>
            <li>Add it to your environment variables: <code className="bg-yellow-100 px-1 rounded">OPENROUTER_API_KEY=your_key_here</code></li>
            <li>Restart your development server</li>
          </ol>
        </div>

        <AIExperimentForm
          open={true}
          onOpenChange={() => { }}
          onSubmit={handleExperimentGenerated}
        />

        {suggestion && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Experiment</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(suggestion, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
