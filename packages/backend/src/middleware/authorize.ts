import { Request, Response, NextFunction } from "express";
import { Role } from "../schemas/userSchema";

export function authorize(allowedRoles: Role[]) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const userRole: Role = res.locals.user?.role;

    if (!userRole) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const isAllowed = allowedRoles.includes(userRole);

    if (isAllowed) {
      next();
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  };
}