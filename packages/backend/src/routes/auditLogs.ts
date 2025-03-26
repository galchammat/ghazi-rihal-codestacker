import { Router, Request, Response, NextFunction } from "express";
import { pgQuery } from "../services/pgClient";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.get('/:caseId/audit-logs', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;

    const auditLogs = await pgQuery('audit_logs')
      .join('evidence', 'audit_logs.evidence_id', 'evidence.id')
      .where({ 'evidence.case_id': caseId })
      .select(
        'audit_logs.id as log_id',
        'audit_logs.evidence_id',
        'audit_logs.user_id',
        'audit_logs.action',
        'audit_logs.timestamp',
      )
      .orderBy('audit_logs.timestamp', 'asc');

    res.status(200).json(auditLogs);
  } catch (error) {
    next(error);
  }
});

export default router;