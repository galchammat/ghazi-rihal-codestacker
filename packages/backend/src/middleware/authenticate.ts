// filepath: /home/user/code/ghazi-rihal-codestacker/packages/backend/src/middleware/basicAuth.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { pgQuery } from "../services/pgClient";
import { User } from "../schemas/userSchema";


export async function authenticateBasic(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.sendStatus(401);
    return;
  }

  // extract email and password from base64 encoded credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [email, password] = credentials.split(':');

  const user: User | undefined = await pgQuery<User>("users").where({ email }).first();
  if (!user) {
    res.status(401).send(`Cannot find user with email: ${email}`);
    return;
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    res.status(401).send("Invalid password");
    return;
  }

  res.locals.user = user;
  next();
}