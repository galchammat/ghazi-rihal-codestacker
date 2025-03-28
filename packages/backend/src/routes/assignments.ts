import { Router, Request, Response, NextFunction } from 'express';
import { pgQuery } from '../services/pgClient';
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

    const user = await pgQuery('users').where({ id: userId }).first();
    if (!user) {
      res.status(404).json({ message: `User with id ${userId} not found` });
      return;
    }
    const caseData = await pgQuery('cases').where({ id: caseId }).first();
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
        res.status(403).json({
          message: `Officer ${user.name} with clearance level (${user.clearance}) does not have sufficient clearance (${caseData.clearance}) to be assigned to this case.`
        });
        return;
      }
    }

    // Check if the assignment already exists
    const existingAssignment = await pgQuery('case_assignments')
      .where({ case_id: caseId, user_id: userId })
      .first();

    if (existingAssignment) {
      res.status(409).json({ message: 'Assignment already exists' });
      return;
    }

    await pgQuery('case_assignments').insert({
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

    const assignment = await pgQuery('case_assignments')
      .where({ case_id: caseId, user_id: userId })
      .first();

    if (!assignment) {
      res.status(404).json({ message: 'Assignment not found' });
      return;
    }

    await pgQuery('case_assignments')
      .where({ case_id: caseId, user_id: userId })
      .del();

    res.status(200).json({ message: 'User unassigned from case successfully' });
    return;
  } catch (error) {
    next(error);
  }
});

// Route to return all assignees of a case given its ID
router.get('/:caseId/assignees', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;

    const assignees = await pgQuery('case_assignments')
      .join('users', 'case_assignments.user_id', 'users.id')
      .select('users.id', 'users.name', 'users.role', 'users.clearance')
      .where({ case_id: caseId });

    res.status(200).json(assignees);
    return;
  } catch (error) {
    next(error);
  }
});

// Route for officers to list all cases they've been assigned to
router.get('/my-cases', authenticate, authorize(["officer", "auditor"]), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId } = res.locals.user;

    const cases = await pgQuery('case_assignments')
      .where({ user_id: userId })
      .join('cases', 'case_assignments.case_id', 'cases.id')
      .select('cases.id', 'cases.case_name');

    res.status(200).json(cases);
    return;
  } catch (error) {
    next(error);
  }
});
export default router;