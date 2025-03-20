import { Router, Request, Response, NextFunction } from 'express';
import { pgQuery } from "../services/pgClient";
import { authenticateBasic } from '../middleware/basicAuth';
import { User } from '../schemas/userSchema';

const router = Router()

router.get("/", authenticateBasic, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users: User[] = await pgQuery<User>("users").select("*");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;