import { Router, Request, Response, NextFunction } from 'express';
import { pgQuery } from '../services/pgClient';
import { reportSchema, Report } from '../schemas/reportSchema';

const router = Router();

router.post('/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate and extract report data
    const reportData: Report = reportSchema.parse(req.body);

    // Insert the report into the database
    const [createdReport] = await pgQuery('reports').insert(reportData).returning('id');

    // Return the report ID
    res.status(201).json({ reportId: createdReport.id });
    return;
  } catch (error) {
    next(error);
  }
});

router.get('/status/:reportId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const parseReportId = parseInt(reportId, 10);

    // Retrieve the report from the database
    const report = await pgQuery('reports').where({ id: parseReportId }).first();

    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    if (report.case_id === null || report.case_id === undefined) {
      res.status(200).json({ status: 'A case has not yet been created in response to this report' });
      return;
    }

    // Retrieve the case status from the database
    const parsedCaseId = parseInt(report.case_id, 10);
    const caseData = await pgQuery('cases').where({ id: parsedCaseId }).first();

    if (!caseData) {
      res.status(404).json({ message: 'Associated case not found' });
      return;
    }

    // Return the case status
    res.status(200).json({ message: `Case ${parsedCaseId} was created in response to this report, and the case status is ${caseData.status}` });
    return;
  } catch (error) {
    next(error);
  }
});

export default router;