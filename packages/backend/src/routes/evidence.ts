import { Router, Request, Response, NextFunction } from "express";
import { pgQuery } from "../services/pgClient";
import { evidenceSchema } from "../schemas/evidenceSchema";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.get('/:caseId/evidence', authenticate, authorize(["officer", "admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { id: userId, role } = res.locals.user;

    if (role === "officer") {
      const isAssigned = await pgQuery('case_assignments')
        .where({ case_id: caseId, user_id: userId })
        .first();

      if (!isAssigned) {
        res.status(403).json({ message: "You are not assigned to this case." });
        return;
      }
    }

    const evidence = await pgQuery('evidence')
      .where({ case_id: caseId, deleted: false })
      .select('*');

    const processedEvidence = evidence.map((item) => {
      if (item.type === "text") {
        item.content = item.content.toString(); // Ensure content is returned as plain text
      }
      return item;
    });

    res.status(200).json(processedEvidence);
  } catch (error) {
    next(error);
  }
});

router.post('/:caseId/evidence', authenticate, authorize(["officer", "admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { id: userId, role } = res.locals.user;

    if (role === "officer") {
      const isAssigned = await pgQuery('case_assignments')
        .where({ case_id: caseId, user_id: userId })
        .first();

      if (!isAssigned) {
        res.status(403).json({ message: "You are not assigned to this case." });
        return;
      }
    }

    const evidenceData = evidenceSchema.parse(req.body);

    const [createdEvidence] = await pgQuery('evidence')
      .insert({ ...evidenceData, case_id: parseInt(caseId, 10) })
      .returning('*');

    res.status(201).json(createdEvidence);
  } catch (error) {
    next(error);
  }
});

router.get('/evidence/:evidenceId', authenticate, authorize(["officer", "admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { evidenceId } = req.params;
    const { id: userId, role } = res.locals.user;

    if (role === "officer") {
      const isAssigned = await pgQuery('case_assignments')
        .join('evidence', 'case_assignments.case_id', 'evidence.case_id')
        .where({ 'evidence.id': evidenceId, 'case_assignments.user_id': userId })
        .first();

      if (!isAssigned) {
        res.status(403).json({ message: "You are not assigned to this case." });
        return;
      }
    }

    const evidence = await pgQuery('evidence')
      .where({ id: evidenceId, deleted: false })
      .first();

    if (!evidence) {
      res.status(404).json({ message: "Evidence not found." });
      return;
    }

    if (evidence.type === "text") {
      evidence.content = evidence.content.toString(); // Ensure content is returned as plain text
    }

    res.status(200).json(evidence);
  } catch (error) {
    next(error);
  }
});

router.patch('/evidence/:evidenceId/update', authenticate, authorize(["officer", "admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { evidenceId } = req.params;
    const { id: userId, role } = res.locals.user;

    if (role === "officer") {
      const isAssigned = await pgQuery('case_assignments')
        .join('evidence', 'case_assignments.case_id', 'evidence.case_id')
        .where({ 'evidence.id': evidenceId, 'case_assignments.user_id': userId })
        .first();

      if (!isAssigned) {
        res.status(403).json({ message: "You are not assigned to this case." });
        return;
      }
    }

    const { content, remarks } = req.body;

    if (!content && !remarks) {
      res.status(400).json({ message: "At least one of 'content' or 'remarks' must be provided." });
      return;
    }

    const evidence = await pgQuery('evidence')
      .where({ id: evidenceId, deleted: false })
      .first();

    if (!evidence) {
      res.status(404).json({ message: "Evidence not found." });
      return;
    }

    if (content) {
      if (evidence.type === "image") {
        // Validate the image content using the Zod schema
        evidenceSchema.parse({ type: "image", content });
      }
    }

    const updatedFields: { content?: string; remarks?: string } = {};
    if (content) updatedFields.content = content;
    if (remarks) updatedFields.remarks = remarks;

    const updatedEvidence = await pgQuery('evidence')
      .where({ id: evidenceId, deleted: false })
      .update(updatedFields)
      .returning('*');

    res.status(200).json({ message: "Evidence updated successfully.", evidence: updatedEvidence[0] });
  } catch (error) {
    next(error);
  }
});

router.patch('/evidence/:evidenceId/soft-delete', authenticate, authorize(["officer", "admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { evidenceId } = req.params;
    const { id: userId, role } = res.locals.user;

    if (role === "officer") {
      const isAssigned = await pgQuery('case_assignments')
        .join('evidence', 'case_assignments.case_id', 'evidence.case_id')
        .where({ 'evidence.id': evidenceId, 'case_assignments.user_id': userId })
        .first();

      if (!isAssigned) {
        res.status(403).json({ message: "You are not assigned to this case." });
        return;
      }
    }

    const softDeletedEvidence = await pgQuery('evidence')
      .where({ id: evidenceId, deleted: false })
      .update({ deleted: true })
      .returning('*');

    if (!softDeletedEvidence.length) {
      res.status(404).json({ message: "Evidence not found or already deleted." });
      return;
    }

    res.status(200).json({ message: "Evidence soft-deleted successfully.", evidence: softDeletedEvidence[0] });
  } catch (error) {
    next(error);
  }
});

export default router;