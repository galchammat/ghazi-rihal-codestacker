import { Router, Request, Response, NextFunction } from "express";
import { pgQuery } from "../services/pgClient";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

// step 1: initialization
router.post(
  '/evidence/:evidenceId/initiate-hard-delete',
  authenticate,
  authorize(["admin"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { evidenceId } = req.params;
      const { id: userId } = res.locals.user;

      const evidence = await pgQuery('evidence').where({ id: evidenceId }).first();
      if (!evidence) {
        res.status(404).json({ message: `Evidence ID: ${evidenceId} not found.` });
        return;
      }

      const deletionRequest = await pgQuery('deletion_requests')
        .where({ evidence_id: evidenceId, user_id: userId })
        .first();

      if (!deletionRequest || deletionRequest.status === 'initiated') {
        if (!deletionRequest) {
          await pgQuery('deletion_requests').insert({
            evidence_id: evidenceId,
            user_id: userId,
            status: 'initiated',
          });
        }
        res.status(200).json({
          message: `Are you sure you want to permanently delete Evidence ID: ${evidenceId} (yes/no)? POST /cases/evidence/${evidenceId}?query=yes to confirm. Any value other than yes, including a missing query, will cancel the deletion.`,
        });
        return;
      } else if (deletionRequest.status === 'confirmed') {
        res.status(200).json({
          message: `Deletion of Evidence ID: ${evidenceId} has already been confirmed. To finalize the deletion, send DELETE cases/evidence/${evidenceId}.`,
        });
        return;
      }

      res.status(500).json({
        message: `Unexpected status for deletion request: ${deletionRequest.status}.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// step 2: confirmation
router.post(
  '/evidence/:evidenceId/confirm-hard-delete',
  authenticate,
  authorize(["admin"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { evidenceId } = req.params;
      const { id: userId } = res.locals.user;
      const { query } = req.query;

      const evidence = await pgQuery('evidence').where({ id: evidenceId }).first();
      if (!evidence) {
        res.status(404).json({ message: `Evidence ID: ${evidenceId} not found.` });
        return;
      }

      const deletionRequest = await pgQuery('deletion_requests')
        .where({ evidence_id: evidenceId, user_id: userId })
        .first();

      if (!deletionRequest) {
        res.status(404).json({
          message: `Deletion request for Evidence ID: ${evidenceId} not found. Please initiate the deletion first by sending POST /cases/evidence/:evidenceId/initiate-hard-delete.`,
        });
        return;
      } else if (deletionRequest.status === 'confirmed') {
        res.status(200).json({
          message: `Deletion of Evidence ID: ${evidenceId} has already been confirmed. To finalize the deletion, send DELETE cases/evidence/${evidenceId}.`,
        });
        return;
      } else if (deletionRequest.status === 'initiated') {
        if (!query || query !== 'yes') {
          await pgQuery('deletion_requests')
            .where({ evidence_id: evidenceId, user_id: userId })
            .update({ status: 'failed' });

          res.status(400).json({
            message: `The deletion was canceled because the query value received was "${query}". Only "yes" is accepted to confirm the deletion.`,
          });
          return;
        } else {
          await pgQuery('deletion_requests')
            .where({ evidence_id: evidenceId, user_id: userId })
            .update({ status: 'confirmed' });

          res.status(200).json({
            message: `Confirmation received. To finalize, send a DELETE request to /cases/evidence/${evidenceId}?.`,
          });
          return;
        }
      }

      res.status(500).json({
        message: `Unexpected status for deletion request: ${deletionRequest.status}.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/evidence/:evidenceId',
  authenticate,
  authorize(["admin"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { evidenceId } = req.params;
      const { id: userId } = res.locals.user;
      const { query } = req.query;

      const evidence = await pgQuery('evidence').where({ id: evidenceId }).first();
      if (!evidence) {
        res.status(404).json({ message: `Evidence ID: ${evidenceId} not found.` });
        return;
      }

      const deletionRequest = await pgQuery('deletion_requests')
        .where({ evidence_id: evidenceId, user_id: userId })
        .first();

      if (!deletionRequest) {
        res.status(404).json({
          message: `Deletion request for Evidence ID: ${evidenceId} not found. Please initiate the deletion first and follow the confirmation steps. Initiate by sending POST /cases/evidence/:evidenceId/initiate-hard-delete.`,
        });
        return;
      } else if (deletionRequest.status === 'initiated') {
        res.status(400).json({
          message: `Deletion request for Evidence ID: ${evidenceId} has not been confirmed yet. Please confirm the deletion first by sending POST /cases/evidence/${evidenceId}/confirm-hard-delete.`,
        });
      } else if (deletionRequest.status === 'confirmed') {
        await pgQuery('evidence').where({ id: evidenceId }).del();

        await pgQuery('audit_logs').insert({
          evidence_id: evidenceId,
          user_id: userId,
          action: 'hard-delete',
        });

        await pgQuery('deletion_requests')
          .where({ evidence_id: evidenceId, user_id: userId })
          .del();

        res.status(200).json({
          message: `Evidence ID: ${evidenceId} has been permanently deleted.`,
        });
        return;
      }

      res.status(500).json({
        message: `Unexpected status for deletion request: ${deletionRequest.status}.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/evidence/:evidenceId/deletion-status',
  authenticate,
  authorize(["admin"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { evidenceId } = req.params;

      const checkStatus = async () => {
        const evidence = await pgQuery('evidence').where({ id: evidenceId }).first();

        if (!evidence) {
          const auditLog = await pgQuery('audit_logs')
            .where({ evidence_id: evidenceId, action: 'hard-delete' })
            .first();

          if (auditLog) {
            res.status(200).json({
              status: 'completed',
              message: `Evidence ID: ${evidenceId} has been permanently deleted.`,
            });
          } else {
            res.status(500).json({
              status: 'failed',
              message: `Evidence ID: ${evidenceId} deletion failed.`,
            });
          }
          return;
        }

        setTimeout(checkStatus, 1000);
      };

      checkStatus();
    } catch (error) {
      next(error);
    }
  }
);

export default router;