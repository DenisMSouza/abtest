"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Trash2, Power, PowerOff, Plus, AlertTriangle } from "lucide-react";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface ApiKeyStats {
  total: number;
  active: number;
  inactive: number;
  expired: number;
}

const MAX_API_KEYS = 10; // Limit to prevent abuse

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [stats, setStats] = useState<ApiKeyStats>({ total: 0, active: 0, inactive: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [newKeyExpiresAt, setNewKeyExpiresAt] = useState("");
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  // Remove visibleKeys state - keys should never be visible after creation
  const [error, setError] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Fetch API keys and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [keysResponse, statsResponse] = await Promise.all([
        fetch("/api/settings/api-key"),
        fetch("http://localhost:3001/api/internal/api-keys/stats")
      ]);

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData.apiKeys || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create new API key
  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError("Key name is required");
      return;
    }

    if (stats.total >= MAX_API_KEYS) {
      setError(`Maximum ${MAX_API_KEYS} API keys allowed`);
      return;
    }

    try {
      const response = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          description: newKeyDescription,
          expiresAt: newKeyExpiresAt || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setNewlyCreatedKey(result.apiKey);
        setNewKeyName("");
        setNewKeyDescription("");
        setNewKeyExpiresAt("");
        setShowNewKeyDialog(false);
        await fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      setError("Failed to create API key");
    }
  };

  // Delete API key with optimistic updates
  const deleteApiKey = async () => {
    if (!keyToDelete) return;

    const keyIdToDelete = keyToDelete.id;

    // Optimistic update - remove from UI immediately
    setApiKeys(prevKeys => prevKeys.filter(key => key.id !== keyIdToDelete));
    setShowDeleteDialog(false);
    setKeyToDelete(null);
    setDeleteConfirmText("");

    try {
      const response = await fetch(`http://localhost:3001/api/internal/api-keys/${keyIdToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Revert on error - refetch data to get accurate state
        await fetchData();
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete API key");
      }
    } catch (error) {
      // Revert on error - refetch data to get accurate state
      await fetchData();
      console.error("Error deleting API key:", error);
      setError("Failed to delete API key");
    }
  };

  // Toggle key active status with optimistic updates
  const toggleKeyStatus = async (keyId: string, isActive: boolean) => {
    // Optimistic update - update UI immediately
    setApiKeys(prevKeys =>
      prevKeys.map(key =>
        key.id === keyId
          ? { ...key, isActive: !isActive }
          : key
      )
    );

    // Optimistic update for stats
    setStats(prevStats => ({
      ...prevStats,
      active: isActive ? prevStats.active - 1 : prevStats.active + 1,
      inactive: isActive ? prevStats.inactive + 1 : prevStats.inactive - 1
    }));

    try {
      const endpoint = isActive ? 'deactivate' : 'reactivate';
      const response = await fetch(`http://localhost:3001/api/internal/api-keys/${keyId}/${endpoint}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        // Revert on error
        setApiKeys(prevKeys =>
          prevKeys.map(key =>
            key.id === keyId
              ? { ...key, isActive: isActive }
              : key
          )
        );
        // Revert stats on error
        setStats(prevStats => ({
          ...prevStats,
          active: isActive ? prevStats.active + 1 : prevStats.active - 1,
          inactive: isActive ? prevStats.inactive - 1 : prevStats.inactive + 1
        }));
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${endpoint} API key`);
      }
    } catch (error) {
      // Revert on error
      setApiKeys(prevKeys =>
        prevKeys.map(key =>
          key.id === keyId
            ? { ...key, isActive: isActive }
            : key
        )
      );
      // Revert stats on error
      setStats(prevStats => ({
        ...prevStats,
        active: isActive ? prevStats.active + 1 : prevStats.active - 1,
        inactive: isActive ? prevStats.inactive - 1 : prevStats.inactive + 1
      }));
      console.error(`Error ${isActive ? 'deactivating' : 'reactivating'} API key:`, error);
      setError(`Failed to ${isActive ? 'deactivate' : 'reactivate'} API key`);
    }
  };

  // Keys should never be visible after creation for security

  // Copy key to clipboard
  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Always mask API keys for security - never show full key after creation
  const maskApiKey = (key: string) => {
    return `${key.substring(0, 8)}${"*".repeat(32)}${key.substring(key.length - 8)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if key is expired
  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">API Keys</h2>
          <p className="text-sm text-gray-600">Manage your API keys</p>
        </div>
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogTrigger asChild>
            <Button disabled={stats.total >= MAX_API_KEYS} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to access the A/B testing service. You can create up to {MAX_API_KEYS} keys.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name *</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production App, Development"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyDescription">Description</Label>
                <Input
                  id="keyDescription"
                  value={newKeyDescription}
                  onChange={(e) => setNewKeyDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyExpires">Expires At (Optional)</Label>
                <Input
                  id="keyExpires"
                  type="datetime-local"
                  value={newKeyExpiresAt}
                  onChange={(e) => setNewKeyExpiresAt(e.target.value)}
                />
              </div>
              {error && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createApiKey}>Create Key</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Compact Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>{stats.total} keys • {stats.active} active</span>
        {stats.total >= MAX_API_KEYS * 0.8 && (
          <span className="text-yellow-600">⚠️ Approaching limit</span>
        )}
      </div>

      {/* Newly Created Key Dialog */}
      {newlyCreatedKey && (
        <Dialog open={!!newlyCreatedKey} onOpenChange={() => setNewlyCreatedKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Created Successfully</DialogTitle>
              <DialogDescription>
                Your new API key has been created. Copy it now - you won't be able to see it again!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <code className="text-sm font-mono break-all">{newlyCreatedKey}</code>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Key
                </Button>
                <Button onClick={() => setNewlyCreatedKey(null)}>
                  I've Copied It
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* API Keys List - Mobile Optimized */}
      <div className="space-y-2">
        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="font-medium">No API Keys</p>
            <p className="text-sm">Create your first API key to get started</p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {/* Mobile-first layout */}
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-sm">{key.name}</h3>
                    <Badge
                      variant={key.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {key.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {isExpired(key.expiresAt) && (
                      <Badge variant="destructive" className="text-xs">Expired</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyStatus(key.id, key.isActive)}
                      title={key.isActive ? "Deactivate" : "Activate"}
                      className="h-8 w-8 p-0"
                    >
                      {key.isActive ? (
                        <PowerOff className="w-3 h-3" />
                      ) : (
                        <Power className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setKeyToDelete(key);
                        setShowDeleteDialog(true);
                      }}
                      title="Delete"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                {key.description && (
                  <p className="text-xs text-gray-600">{key.description}</p>
                )}

                {/* Key display */}
                <div className="flex items-center space-x-2">
                  <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                    {maskApiKey(key.key)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(key.key)}
                    title="Copy"
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>

                {/* Metadata - Mobile optimized */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Created: {formatDate(key.createdAt)}</div>
                  {key.lastUsedAt && (
                    <div>Last used: {formatDate(key.lastUsedAt)}</div>
                  )}
                  {key.expiresAt && (
                    <div>Expires: {formatDate(key.expiresAt)}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>


      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete API Key</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Deleting this API key will immediately break any applications using it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-900">Warning</h4>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Any applications using this key will immediately stop working</li>
                <li>• You'll need to update your application configuration</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="deleteConfirm">
                Type <strong>DELETE</strong> to confirm deletion of key "{keyToDelete?.name}":
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-1"
              />
            </div>
            {error && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setKeyToDelete(null);
                  setDeleteConfirmText("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteApiKey}
                disabled={deleteConfirmText !== "DELETE"}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete API Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}