import { Router, Request, Response, NextFunction } from 'express';
import { Knex } from 'knex';
import { clearanceLevels } from '../schemas/userSchema';
import { assignmentRequestSchema } from '../schemas/assignmentSchema';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.post('/:caseId/assign', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate and extract params and body
    const { params, body } = assignmentRequestSchema.parse({
      params: req.params,
      body: req.body,
    });

    const { caseId } = params;
    const { userId } = body;

    const knex: Knex = req.app.get('knex');

    const user = await knex('users').where({ id: userId }).first();
    if (!user) {
      res.status(404).json({ message: `User with id ${userId} not found` });
      return;
    }
    const caseData = await knex('cases').where({ id: caseId }).first();
    if (!caseData) {
      res.status(404).json({ message: `Case with id ${caseId} not found` });
      return;
    }

    // Check if the user to be assigned is an officer or auditor
    if (user.role !== 'officer' && user.role !== 'auditor') {
      res.status(403).json({ message: `Only officers and auditors can be assigned to cases. Users with the role ${user.role} cannot be assigned to a case.` });
      return;
    }

    // Check clearance levels if the user is an officer
    if (user.role === 'officer') {
      const userClearanceIndex = clearanceLevels.indexOf(user.clearance);
      const caseClearanceIndex = clearanceLevels.indexOf(caseData.clearance);

      if (userClearanceIndex < caseClearanceIndex) {
        res.status(403).json({ message: 'Officer does not have sufficient clearance to be assigned to this case' });
        return;
      }
    }

    // Check if the assignment already exists
    const existingAssignment = await knex('case_assignments')
      .where({ case_id: caseId, user_id: userId })
      .first();

    if (existingAssignment) {
      res.status(409).json({ message: 'Assignment already exists' });
      return;
    }

    await knex('case_assignments').insert({
      case_id: caseId,
      user_id: userId
    });

    res.status(201).json({ message: 'User assigned to case successfully' });
    return;
  } catch (error) {
    next(error);
  }
});

router.delete('/:caseId/unassign', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate and extract params and body
    const { params, body } = assignmentRequestSchema.parse({
      params: req.params,
      body: req.body,
    });

    const { caseId } = params;
    const { userId } = body;

    const knex: Knex = req.app.get('knex');

    const assignment = await knex('case_assignments')
      .where({ case_id: caseId, user_id: userId })
      .first();

    if (!assignment) {
      res.status(404).json({ message: 'Assignment not found' });
      return;
    }

    await knex('case_assignments')
      .where({ case_id: caseId, user_id: userId })
      .del();

    res.status(200).json({ message: 'User unassigned from case successfully' });
    return;
  } catch (error) {
    next(error);
  }
});

export default router;