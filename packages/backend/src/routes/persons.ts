import { Router, Request, Response, NextFunction } from "express";
import { pgQuery } from "../services/pgClient";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { personSchema, personUpdateSchema } from "../schemas/personSchema";

const router = Router();

router.get('/:caseId/persons', authenticate, authorize(["officer", "admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { id: userId, role } = res.locals.user;
    const { type } = req.query; // Optional query parameter for filtering by type

    if (role === "officer") {
      const isAssigned = await pgQuery('case_assignments')
        .where({ case_id: caseId, user_id: userId })
        .first();

      if (!isAssigned) {
        res.status(403).json({ message: "You are not assigned to this case." });
        return;
      }
    }

    // Build the query
    const query = pgQuery('persons').where({ case_id: caseId });
    if (type) {
      query.andWhere({ type }); // Filter by type if provided
    }

    const persons = await query.select('*');

    res.status(200).json(persons);
  } catch (error) {
    next(error);
  }
});

// Officers can submit information about persons
router.post('/:caseId/persons', authenticate, authorize(["officer", "admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
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

    const personData = personSchema.parse(req.body);

    const [createdPerson] = await pgQuery('persons')
      .insert({ ...personData, case_id: parseInt(caseId, 10) })
      .returning('*');

    res.status(201).json(createdPerson);
  } catch (error) {
    next(error);
  }
});

// Admins and investigators can update any information about persons
router.put('/persons/:personId', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personId } = req.params;

    const personData = personUpdateSchema.parse(req.body);

    const updatedPerson = await pgQuery('persons')
      .where({ id: personId })
      .update(personData)
      .returning('*');

    if (!updatedPerson.length) {
      res.status(404).json({ message: "Person not found." });
      return;
    }

    res.status(200).json(updatedPerson[0]);
  } catch (error) {
    next(error);
  }
});

export default router;