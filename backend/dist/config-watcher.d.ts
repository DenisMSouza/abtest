/**
 * Watch for API key configuration changes and restart the server
 */
export declare class ConfigWatcher {
    private static instance;
    private isWatching;
    private configPath;
    private constructor();
    static getInstance(): ConfigWatcher;
    /**
     * Start watching for configuration changes
     */
    startWatching(): void;
    /**
     * Handle configuration changes
     */
    private handleConfigChange;
    /**
     * Stop watching for changes
     */
    stopWatching(): void;
}
//# sourceMappingURL=config-watcher.d.ts.map