import { Request, Response, NextFunction } from "express";
import { ApiKeyService } from "../services/apiKeyService";

export async function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      error: "Missing Authorization header",
      message: "Please provide an API key in the Authorization header",
    });
  }

  const apiKey = authHeader.replace("Bearer ", "");

  try {
    const isValid = await ApiKeyService.validateApiKey(apiKey);

    if (!isValid) {
      console.log(`API key validation failed: ${apiKey.substring(0, 10)}...`);
      return res.status(401).json({
        error: "Invalid API key",
        message: "The provided API key is not valid",
      });
    }

    console.log(`API key validation passed`);
    next();
  } catch (error) {
    console.error("Error validating API key:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to validate API key",
    });
  }
}

export function createApiKeyResponse(message: string, status: number = 401) {
  return { error: message, status };
}
