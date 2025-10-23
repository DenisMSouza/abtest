import { NextRequest, NextResponse } from "next/server";

// In a real application, you'd get this from a database
// For now, we'll use an environment variable
const VALID_API_KEY = process.env.ABTEST_API_KEY;

export function validateApiKey(request: NextRequest): boolean {
  // Skip validation if no API key is configured
  if (!VALID_API_KEY) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  const apiKey = authHeader.replace("Bearer ", "");
  return apiKey === VALID_API_KEY;
}

export function createApiKeyResponse(message: string, status: number = 401) {
  return NextResponse.json({ error: message }, { status });
}

// Middleware function for API key validation
export function withApiKeyAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    if (!validateApiKey(request)) {
      return createApiKeyResponse("Invalid or missing API key");
    }

    return handler(request, ...args);
  };
}
