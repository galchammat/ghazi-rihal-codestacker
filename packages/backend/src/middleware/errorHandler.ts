// filepath: /home/user/code/ghazi-rihal-codestacker/packages/backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err); // Log the error for debugging purposes

  if (err instanceof Error) {
    res.status(500).json({
      error: `Failed to process request: ${err.message}`
    });
  } else {
    res.status(500).json({
      error: 'Failed to process request due to an unknown error'
    });
  }
}