import { createApiClient } from "../utils";
import { ABTestConfig } from "../types";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Security Features", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("API Key Authentication", () => {
    it("should include API key in Authorization header", async () => {
      const config: ABTestConfig = {
        apiUrl: "https://api.example.com",
        apiKey: "test-api-key-123",
        debug: false,
      };

      const client = createApiClient(config);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.fetch("https://api.example.com/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key-123",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should work without API key for development", async () => {
      const config: ABTestConfig = {
        apiUrl: "https://api.example.com",
        debug: false,
      };

      const client = createApiClient(config);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.fetch("https://api.example.com/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );

      // Should not include Authorization header
      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty("Authorization");
    });
  });

  describe("Custom Headers", () => {
    it("should include custom headers", async () => {
      const config: ABTestConfig = {
        apiUrl: "https://api.example.com",
        apiKey: "test-api-key-123",
        customHeaders: {
          "X-Custom-Auth": "custom-value",
          "X-Client-Version": "1.0.0",
        },
        debug: false,
      };

      const client = createApiClient(config);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.fetch("https://api.example.com/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key-123",
            "Content-Type": "application/json",
            "X-Custom-Auth": "custom-value",
            "X-Client-Version": "1.0.0",
          }),
        })
      );
    });
  });

  describe("Request Signing", () => {
    it("should include signature headers when enabled", async () => {
      const config: ABTestConfig = {
        apiUrl: "https://api.example.com",
        apiKey: "test-api-key-123",
        enableRequestSigning: true,
        debug: false,
      };

      const client = createApiClient(config);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.fetch("https://api.example.com/test");

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toHaveProperty("X-Timestamp");
      expect(callArgs.headers).toHaveProperty("X-Nonce");
      expect(callArgs.headers).toHaveProperty("X-Signature");

      // Verify timestamp is recent
      const timestamp = parseInt(callArgs.headers["X-Timestamp"]);
      const now = Date.now();
      expect(now - timestamp).toBeLessThan(1000); // Within 1 second

      // Verify nonce is a string
      expect(typeof callArgs.headers["X-Nonce"]).toBe("string");
      expect(callArgs.headers["X-Nonce"].length).toBeGreaterThan(0);

      // Verify signature is a hex string
      expect(callArgs.headers["X-Signature"]).toMatch(/^[a-f0-9]+$/);
    });

    it("should not include signature headers when disabled", async () => {
      const config: ABTestConfig = {
        apiUrl: "https://api.example.com",
        apiKey: "test-api-key-123",
        enableRequestSigning: false,
        debug: false,
      };

      const client = createApiClient(config);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.fetch("https://api.example.com/test");

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty("X-Timestamp");
      expect(callArgs.headers).not.toHaveProperty("X-Nonce");
      expect(callArgs.headers).not.toHaveProperty("X-Signature");
    });
  });

  describe("Security Configuration Examples", () => {
    it("should work with production security config", async () => {
      const config: ABTestConfig = {
        apiUrl: "https://api.example.com",
        apiKey: "prod-api-key-123",
        enableRequestSigning: true,
        environment: "production",
        debug: false,
        timeout: 5000,
        customHeaders: {
          "X-Client-Version": "1.0.0",
          "X-Environment": "production",
        },
      };

      const client = createApiClient(config);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.fetch("https://api.example.com/test");

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toHaveProperty(
        "Authorization",
        "Bearer prod-api-key-123"
      );
      expect(callArgs.headers).toHaveProperty("X-Timestamp");
      expect(callArgs.headers).toHaveProperty("X-Nonce");
      expect(callArgs.headers).toHaveProperty("X-Signature");
      expect(callArgs.headers).toHaveProperty("X-Client-Version", "1.0.0");
      expect(callArgs.headers).toHaveProperty("X-Environment", "production");
    });

    it("should work with development config (no security)", async () => {
      const config: ABTestConfig = {
        apiUrl: "http://localhost:3001/api",
        environment: "development",
        debug: true,
      };

      const client = createApiClient(config);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.fetch("http://localhost:3001/api/test");

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty("Authorization");
      expect(callArgs.headers).not.toHaveProperty("X-Timestamp");
      expect(callArgs.headers).not.toHaveProperty("X-Nonce");
      expect(callArgs.headers).not.toHaveProperty("X-Signature");
      expect(callArgs.headers).toHaveProperty(
        "Content-Type",
        "application/json"
      );
    });
  });
});
