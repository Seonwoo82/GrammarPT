import { NextResponse } from "next/server";
import {
  issueSessionToken,
  revokeSessionToken,
  validateSessionToken,
  verifyAccessCode,
} from "@/lib/auth/validateAccessCode";

const SESSION_COOKIE = "backoffice_session";
const SESSION_MAX_AGE = 60 * 60 * 12; // 12시간

const unauthorizedResponse = () =>
  NextResponse.json({ error: "접근 코드가 올바르지 않습니다." }, { status: 401 });

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await validateSessionToken(token);
  return NextResponse.json({ authorized: Boolean(session) });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const codeId = await verifyAccessCode(body?.code);
    if (!codeId) {
      return unauthorizedResponse();
    }

    const { token, expiresAt } = await issueSessionToken(codeId);
    const response = NextResponse.json({ authorized: true, expiresAt });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  await revokeSessionToken(token);
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });
  return response;
}
