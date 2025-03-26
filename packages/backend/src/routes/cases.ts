import { Router, Request, Response, NextFunction } from 'express';
import { pgQuery } from '../services/pgClient';
import { caseSchema, Case, caseStatusOptions } from '../schemas/caseSchema';
import { reportIdsSchema, ReportIds } from '../schemas/reportSchema';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.post('/', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const caseDataBody = caseSchema.omit({ id: true, created_by: true, created_at: true, updated_at: true }).parse(req.body);
    const caseData: Case = { ...caseDataBody, created_by: res.locals.user.id };

    // Validate and extract reportIds if provided
    const reportIds: ReportIds = req.body.reportIds ? reportIdsSchema.parse(req.body.reportIds) : [];

    const [createdCase] = await pgQuery('cases').insert(caseData).returning('*');

    // If reportIds are provided, update the reports table to associate them with the new case
    if (reportIds.length > 0) {
      await pgQuery('reports')
        .whereIn('id', reportIds)
        .update({ case_id: createdCase.id });
    }

    res.status(201).json(createdCase);
    return;
  } catch (error) {
    next(error);
  }
});

router.put('/:caseId', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const caseUpdateData = caseSchema.partial().omit({ id: true, created_at: true, updated_at: true }).parse(req.body);
    const reportIds: ReportIds = req.body.reportIds ? reportIdsSchema.parse(req.body.reportIds) : [];

    if (Object.keys(caseUpdateData).length > 0) {
      await pgQuery('cases').where({ id: caseId }).update(caseUpdateData);
    }

    if (reportIds.length > 0) {
      await pgQuery('reports').whereIn('id', reportIds).update({ case_id: caseId });
    }

    const updatedCase = await pgQuery('cases').where({ id: caseId }).first();

    if (!updatedCase) {
      res.status(404).json({ message: 'Case not found' });
      return;
    }

    res.status(200).json(updatedCase);
  } catch (error) {
    next(error);
  }
});

router.patch('/:caseId/status', authenticate, authorize(["officer", "admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;
    const { id: officerId, role } = res.locals.user;

    // validate request body
    if (!caseStatusOptions.includes(status)) {
      res.status(400).json({ message: `Invalid status. Allowed values are: ${caseStatusOptions.join(", ")}` });
      return;
    }
    if (role === "officer") {
      const isAssigned = await pgQuery('case_assignments')
        .where({ case_id: caseId, user_id: officerId })
        .first();

      if (!isAssigned) {
        res.status(403).json({ message: "You are not assigned to this case." });
        return;
      }
    }

    await pgQuery('cases').where({ id: caseId }).update({ status });

    res.status(200).json({ message: "Case status updated successfully." });
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticate, authorize(["admin", "investigator"]), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cases = await pgQuery('cases').select('*');

    // Truncate descriptions to 100 characters or less
    const formattedCases = cases.map((c) => {
      const truncatedDescription =
        c.description.length > 100
          ? c.description.slice(0, c.description.lastIndexOf(' ', 100)) + ' ...'
          : c.description;

      return { ...c, description: truncatedDescription };
    });

    res.status(200).json(formattedCases);
  } catch (error) {
    next(error);
  }
});

router.get('/search', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ message: 'Query parameter is required and must be a string' });
      return;
    }

    const cases = await pgQuery('cases')
      .whereILike('case_name', `%${query}%`)
      .orWhereILike('description', `%${query}%`)
      .select('*');

    res.status(200).json(cases);
  } catch (error) {
    next(error);
  }
});

router.get('/:caseId', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;

    const caseDetails = await pgQuery('cases')
      .where({ id: caseId })
      .select(
        'id as case_number',
        'case_name',
        'description',
        'area',
        'city',
        'created_by',
        'created_at',
        'type as case_type',
        'clearance as authorization_level',
        'status'
      )
      .first();

    if (!caseDetails) {
      res.status(404).json({ message: 'Case not found' });
      return;
    }

    const reports = await pgQuery('reports').where({ case_id: caseId }).select('id', 'name', 'description');
    const numberOfAssignees = await pgQuery('case_assignments').where({ case_id: caseId }).count('id as count').first();
    const numberOfEvidences = await pgQuery('evidence').where({ case_id: caseId }).count('id as count').first();
    // ToDo optimization: combine the three queries below into one, and split the results by role
    const numberOfSuspects = await pgQuery('persons').where({ case_id: caseId, role: 'suspect' }).count('id as count').first();
    const numberOfVictims = await pgQuery('persons').where({ case_id: caseId, role: 'victim' }).count('id as count').first();
    const numberOfWitnesses = await pgQuery('persons').where({ case_id: caseId, role: 'witness' }).count('id as count').first();

    // Combine all data into a single response
    const fullCaseDetails = {
      ...caseDetails,
      reports,
      number_of_assignees: numberOfAssignees?.count || 0,
      number_of_evidences: numberOfEvidences?.count || 0,
      number_of_suspects: numberOfSuspects?.count || 0,
      number_of_victims: numberOfVictims?.count || 0,
      number_of_witnesses: numberOfWitnesses?.count || 0,
    };

    res.status(200).json(fullCaseDetails);
  } catch (error) {
    next(error);
  }
});


export default router;