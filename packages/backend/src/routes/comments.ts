import { Router, Request, Response, NextFunction } from "express";
import { pgQuery } from "../services/pgClient";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { commentSchema } from "../schemas/commentSchema";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter: Max 5 comments per minute per user
const commentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each user to 5 requests per windowMs
  message: "You can only post up to 5 comments per minute.",
  keyGenerator: (req: Request) => req.res?.locals.user.id, // Use user ID as the key
});

// Add a comment to a specific case
router.post(
  '/cases/:caseId/comments',
  authenticate,
  authorize(["officer", "admin", "investigator"]),
  commentRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;
      const { id: userId, role } = res.locals.user;
      const { content } = commentSchema.parse(req.body);

      // Check if the user is assigned to the case (only for officers)
      if (role === "officer") {
        const isAssigned = await pgQuery('case_assignments')
          .where({ case_id: caseId, user_id: userId })
          .first();

        if (!isAssigned) {
          res.status(403).json({ message: "You are not assigned to this case." });
          return;
        }
      }

      // Insert the comment into the database
      const [newComment] = await pgQuery('comments')
        .insert({ case_id: caseId, user_id: userId, content })
        .returning('*');

      res.status(201).json(newComment);
    } catch (error) {
      next(error);
    }
  }
);

// Retrieve all comments for a specific case
router.get(
  '/cases/:caseId/comments',
  authenticate,
  authorize(["officer", "admin", "investigator"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;

      // Fetch all comments for the case
      const comments = await pgQuery('comments')
        .join('users', 'comments.user_id', 'users.id')
        .where({ case_id: caseId })
        .select(
          'comments.id',
          'comments.content',
          'comments.created_at',
          'users.id as user_id',
          'users.name as user_name'
        )
        .orderBy('comments.created_at', 'desc');

      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  }
);

// Delete a comment made by the user (Admins and Investigators only)
router.delete(
  '/cases/:caseId/comments/:commentId',
  authenticate,
  authorize(["admin", "investigator"]), // Officers cannot delete comments
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId, commentId } = req.params;

      // Check if the comment exists
      const comment = await pgQuery('comments')
        .where({ id: commentId, case_id: caseId })
        .first();

      if (!comment) {
        res.status(404).json({ message: "Comment not found." });
        return;
      }

      // Delete the comment
      await pgQuery('comments').where({ id: commentId }).del();

      res.status(200).json({ message: "Comment deleted successfully." });
    } catch (error) {
      next(error);
    }
  }
);

export default router;