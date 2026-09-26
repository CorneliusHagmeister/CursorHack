import { NextResponse } from "next/server";
import { runAssist } from "@/lib/assist";
import type { AssistRequest } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as AssistRequest;
  if (!body.message || typeof body.message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  const result = runAssist(body);
  return NextResponse.json(result);
}
