import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const REQUIRED_FIELDS = ["title", "name", "contact", "message"];

function validate(body) {
  const errors = [];
  const data = {};
  REQUIRED_FIELDS.forEach((field) => {
    const value = (body?.[field] || "").toString().trim();
    if (!value) {
      errors.push(`${field} is required`);
    } else {
      data[field] = value;
    }
  });
  return { data, errors };
}

function getMailer() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!host || !user || !pass) {
    throw new Error("Email environment variables are missing (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, errors } = validate(body);
    if (errors.length) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    const to = process.env.EMAIL_TO || "coretoefl@gmail.com";
    const transporter = getMailer();

    const text = [
      `제목: ${data.title}`,
      `이름/소속: ${data.name}`,
      `연락처: ${data.contact}`,
      "",
      "문의 사항:",
      data.message,
    ].join("\n");

    await transporter.sendMail({
      from: `"GrammarPT 문의" <${process.env.EMAIL_FROM || to}>`,
      to,
      subject: `[GrammarPT 도입 문의] ${data.title}`,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] send error", error);
    return NextResponse.json(
      { error: error?.message || "문의 메일 전송에 실패했습니다." },
      { status: 500 }
    );
  }
}
