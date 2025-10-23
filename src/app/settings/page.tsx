'use client';

import ApiKeyManager from '@/components/ApiKeyManager';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Settings, Key, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 flex-col-reverse lg:flex-row justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Settings
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your A/B testing configuration and security settings
              </p>
            </div>
            <div className="flex w-full lg:w-auto justify-start">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Key Management */}
          <div className="lg:col-span-2">
            <ApiKeyManager />
          </div>

          {/* Security Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Security Information</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">API Key Security</h4>
                  <p className="text-sm text-blue-700">
                    Your API key is used to authenticate requests to your A/B testing server.
                    Keep it secure and never share it publicly.
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Best Practices</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Store API keys in environment variables</li>
                    <li>• Use different keys for different environments</li>
                    <li>• Rotate keys regularly for enhanced security</li>
                    <li>• Never commit keys to version control</li>
                  </ul>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Self-Hosted Security</h4>
                  <p className="text-sm text-yellow-700">
                    Since you control both the backend and frontend, basic API key authentication
                    is usually sufficient. Enhanced security features are available if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
