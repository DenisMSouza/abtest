import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// In a real application, you'd store this in a database
// For now, we'll use a simple in-memory store
let apiKeyStore: { apiKey: string; createdAt: Date } | null = null;

export async function GET() {
  try {
    // Fetch API keys from backend database
    const response = await fetch("http://localhost:3001/api/internal/api-keys");

    if (response.ok) {
      const apiKeys = await response.json();
      return NextResponse.json({ apiKeys });
    } else {
      console.error("Failed to fetch API keys from backend");
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, expiresAt } = body;

    // Create the key in the backend database
    try {
      const response = await fetch(
        "http://localhost:3001/api/internal/api-keys",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name || "Dashboard Generated Key",
            description: description || "API key generated from dashboard",
            expiresAt: expiresAt || null,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(
          `✅ API key created in backend database: ${result.key.substring(
            0,
            10
          )}...`
        );
        // Update our local store with the actual key from backend
        apiKeyStore = {
          apiKey: result.key,
          createdAt: new Date(),
        };

        return NextResponse.json({
          apiKey: result.key,
          message: "API key generated successfully",
        });
      } else {
        const errorText = await response.text();
        console.error("Failed to create API key in backend:", errorText);
        return NextResponse.json(
          { error: "Failed to create API key in backend" },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Error creating API key in backend:", error);
      return NextResponse.json(
        { error: "Failed to create API key in backend" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating API key:", error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}

export async function PUT() {
  try {
    // Create a new key in the backend database
    try {
      const response = await fetch(
        "http://localhost:3001/api/internal/api-keys",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Dashboard Regenerated Key",
            description: "API key regenerated from dashboard",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(
          `✅ New API key created in backend database: ${result.key.substring(
            0,
            10
          )}...`
        );
        // Update our local store with the actual key from backend
        apiKeyStore = {
          apiKey: result.key,
          createdAt: new Date(),
        };

        return NextResponse.json({
          apiKey: result.key,
          message: "API key regenerated successfully",
        });
      } else {
        const errorText = await response.text();
        console.error("Failed to create new API key in backend:", errorText);
        return NextResponse.json(
          { error: "Failed to create new API key in backend" },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Error creating new API key in backend:", error);
      return NextResponse.json(
        { error: "Failed to create new API key in backend" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error regenerating API key:", error);
    return NextResponse.json(
      { error: "Failed to regenerate API key" },
      { status: 500 }
    );
  }
}

function generateSecureApiKey(): string {
  // Generate a secure API key with prefix
  const randomPart = randomBytes(32).toString("hex");
  return `abtest_${randomPart}`;
}
