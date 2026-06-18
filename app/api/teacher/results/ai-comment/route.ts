// app/api/teacher/results/ai-comment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";  // ← use this
import { generateAITeacherComment } from "@/lib/aicomment";


interface ScoreInput {
  subjectName: string;
  testScore: number;
  examScore: number;
  practicalScore: number;
  hasPractical: boolean;
}

interface RequestBody {
  studentName: string;
  className: string;
  termName: string;
  scores: ScoreInput[];
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.activeRole !== "teacher") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { studentName, className, termName, scores } = body;

    if (!studentName || !className || !termName || !scores?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const comment = await generateAITeacherComment({
      studentName,
      className,
      termName,
      scores,
    });

    return NextResponse.json({ success: true, comment });
  } catch (err) {
    console.error("[AI Teacher Comment]", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate comment" },
      { status: 500 },
    );
  }
}