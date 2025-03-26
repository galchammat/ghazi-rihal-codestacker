import { Router, Request, Response, NextFunction } from "express";
import PDFDocument from "pdfkit";
import { pgQuery } from "../services/pgClient";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.get('/:caseId/pdf', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;

    const caseDetails = await pgQuery('cases')
      .where({ id: caseId })
      .first();

    if (!caseDetails) {
      res.status(404).json({ message: "Case not found." });
      return;
    }

    const evidence = await pgQuery('evidence')
      .where({ case_id: caseId, deleted: false })
      .select('*');

    const persons = await pgQuery('persons')
      .where({ case_id: caseId })
      .select('*');

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="case_${caseId}_report.pdf"`);

    doc.pipe(res);

    doc.fontSize(20).text(`Case Report: ${caseDetails.title}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Case ID: ${caseDetails.id}`);
    doc.text(`Description: ${caseDetails.description}`);
    doc.text(`Status: ${caseDetails.status}`);
    doc.text(`Created At: ${caseDetails.created_at}`);
    doc.text(`Updated At: ${caseDetails.updated_at}`);
    doc.moveDown();

    doc.fontSize(16).text("Evidence", { underline: true });
    evidence.forEach((item, index) => {
      doc.moveDown();
      doc.fontSize(12).text(`Evidence #${index + 1}`);
      doc.text(`Type: ${item.type}`);
      doc.text(`Remarks: ${item.remarks || "N/A"}`);
      if (item.type === "text") {
        doc.text(`Content: ${item.content}`);
      } else if (item.type === "image") {
        try {
          const imageBuffer = Buffer.from(item.content.split(",")[1], "base64");
          doc.image(imageBuffer, { fit: [400, 300] });
        } catch (err) {
          doc.text("Error displaying image.");
        }
      }
    });

    doc.moveDown();

    doc.fontSize(16).text("Persons", { underline: true });
    const groupedPersons = {
      suspect: persons.filter(p => p.type === "suspect"),
      victim: persons.filter(p => p.type === "victim"),
      witness: persons.filter(p => p.type === "witness"),
    };

    Object.entries(groupedPersons).forEach(([type, group]) => {
      doc.moveDown();
      doc.fontSize(14).text(`${type.charAt(0).toUpperCase() + type.slice(1)}s`, { underline: true });
      group.forEach(person => {
        doc.fontSize(12).text(`Name: ${person.name}`);
        doc.text(`Age: ${person.age}`);
        doc.text(`Gender: ${person.gender}`);
        doc.text(`Role: ${person.role}`);
        doc.moveDown();
      });
    });

    doc.end();
  } catch (error) {
    next(error);
  }
});

export default router;