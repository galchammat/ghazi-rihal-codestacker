import { Router, Request, Response, NextFunction } from 'express';
import { pgQuery } from "../services/pgClient";
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { User, userSchema } from '../schemas/userSchema';
import bcrypt from 'bcrypt';

const router = Router();

router.get("/", authenticate, authorize(["admin", "investigator"]), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users: User[] = await pgQuery<User>("users").select("*");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, authorize(["admin"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedUser = userSchema.omit({ id: true }).parse(req.body);
    const hashedPassword = await bcrypt.hash(parsedUser.password, 10);
    const newUser = { ...parsedUser, password: hashedPassword };

    const [createdUser] = await pgQuery<User>("users").insert(newUser).returning("*");
    res.status(201).json(createdUser);
  } catch (error) {
    next(error);
  }
});

router.put("/:userId", authenticate, authorize(["admin"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const parsedUser = userSchema.omit({ id: true }).partial().parse(req.body);

    if (parsedUser.password) {
      parsedUser.password = await bcrypt.hash(parsedUser.password, 10);
    }

    const [updatedUser] = await pgQuery<User>("users")
      .where({ id: userId })
      .update(parsedUser)
      .returning("*");

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

export default router;