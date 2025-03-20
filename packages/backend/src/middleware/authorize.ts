import { Request, Response, NextFunction } from "express";
import { Role, roles } from "../schemas/userSchema";

export function authorize(allowedRoles: Role[]) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const userRole = res.locals.user?.role;

    if (!userRole) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const userRoleIndex = roles.indexOf(userRole);
    const isAllowed = allowedRoles.some(role => roles.indexOf(role) <= userRoleIndex);

    if (isAllowed) {
      next();
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  };
}