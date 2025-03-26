import { Router, Request, Response, NextFunction } from "express";
import { pgQuery } from "../services/pgClient";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

const STOP_WORDS = new Set([
  "and", "the", "to", "of", "in", "a", "is", "it", "that", "on", "for", "with", "as", "was", "at", "by", "an", "be", "this", "which", "or", "from", "but", "not", "are", "have", "has", "had", "were", "they", "their", "you", "we", "he", "she", "his", "her", "its", "them", "can", "will", "would", "there", "what", "when", "where", "how", "why", "who"
]);

const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/g;

function getWordFrequencies(text: string): Record<string, number> {
  const wordCounts: Record<string, number> = {};
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "") // Remove non-alphabetic characters
    .split(/\s+/); // Split by whitespace

  for (const word of words) {
    if (!STOP_WORDS.has(word) && word) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }

  return wordCounts;
}

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? Array.from(new Set(matches)) : []; // Remove duplicates
}

router.get('/analytics/top-words', authenticate, authorize(["admin", "investigator"]), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const evidence = await pgQuery('evidence')
      .where({ type: "text", deleted: false })
      .select('content');

    const combinedText = evidence.map(e => e.content).join(" ");

    const wordFrequencies = getWordFrequencies(combinedText);

    const topWords = Object.entries(wordFrequencies)
      .sort(([, countA], [, countB]) => countB - countA) // Sort by frequency (descending)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    res.status(200).json(topWords);
  } catch (error) {
    next(error);
  }
});

router.get('/:caseId/analytics/urls', authenticate, authorize(["admin", "investigator"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;

    const evidence = await pgQuery('evidence')
      .where({ case_id: caseId, type: "text", deleted: false })
      .select('content');

    const combinedText = evidence.map(e => e.content).join(" ");

    const urls = extractUrls(combinedText);

    res.status(200).json({ urls });
  } catch (error) {
    next(error);
  }
});

export default router;