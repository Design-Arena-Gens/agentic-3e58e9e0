import { NextResponse } from "next/server";
import { buildAnswer, retrieveLegalKnowledge } from "@/lib/legalSearch";

type QueryPayload = {
  question?: string;
};

export async function POST(request: Request) {
  let payload: QueryPayload = {};

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON payload",
      },
      { status: 400 },
    );
  }

  const question = payload.question?.trim();

  if (!question) {
    return NextResponse.json(
      {
        error: "Question is required",
      },
      { status: 400 },
    );
  }

  const results = retrieveLegalKnowledge(question, 5);
  const { answer, followUps } = buildAnswer(question, results);

  return NextResponse.json({
    answer,
    results: results.map((result) => ({
      id: result.id,
      title: result.title,
      summary: result.summary,
      excerpt: result.excerpt,
      citations: result.citations,
      sources: result.sources,
      score: result.score,
      highlights: result.highlights,
      region: result.region,
      era: result.era,
      type: result.type,
    })),
    followUps,
    timestamp: new Date().toISOString(),
  });
}
