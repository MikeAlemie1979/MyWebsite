import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { validatePhoneNumber } from "@/lib/phone-validation";
import { readDoc } from "@/lib/store";

const MAX_ATTACHMENT_BYTES = 300 * 1024;

interface Attachment {
  name: string;
  type: string;
  data: string; // base64
}

interface ContactPayload {
  fullName: string;
  email: string;
  subject: string;
  body: string;
  requestCallback: boolean;
  phone?: string;
  attachment?: Attachment | null;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
}

const EMPTY_SMTP: SMTPConfig = { host: "", port: 587, secure: false, user: "", password: "", fromEmail: "" };

export async function POST(request: NextRequest) {
  try {
    const payload: ContactPayload = await request.json();

    if (!payload.fullName || !payload.email || !payload.subject || !payload.body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(payload.email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (payload.attachment) {
      // Re-validate size server-side from the actual decoded bytes rather
      // than trusting a client-reported number — the base64 string is what
      // the client can't lie about without the request itself growing.
      const decodedSize = Math.ceil((payload.attachment.data.length * 3) / 4);
      if (decodedSize > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json({ error: "Attachment exceeds 300KB limit" }, { status: 400 });
      }
    }

    let finalBody = payload.body;

    if (payload.requestCallback) {
      if (!payload.phone) {
        return NextResponse.json(
          { error: "Phone number required for callback requests" },
          { status: 400 }
        );
      }
      const phoneCheck = validatePhoneNumber(payload.phone);
      if (!phoneCheck.valid) {
        return NextResponse.json({ error: phoneCheck.reason }, { status: 400 });
      }
      finalBody = `${finalBody}\n\nCallback requested. Phone: ${payload.phone}`;
    }

    const smtp = await readDoc<SMTPConfig>("smtp", EMPTY_SMTP);

    if (!smtp.host || !smtp.user || !smtp.password || !smtp.fromEmail) {
      // Honest failure instead of the previous console.log-and-pretend-it-
      // worked behavior: a visitor whose message silently vanished had no
      // way to know it never arrived. SMTP is configured after deploy via
      // the Admin dashboard (see DEPLOY-README §4a), so this is the expected
      // state until that happens once.
      console.error("[contact] SMTP is not configured — message was not sent:", {
        fullName: payload.fullName,
        email: payload.email,
        subject: payload.subject,
      });
      return NextResponse.json(
        { error: "This site can't send messages right now. Please try again later." },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.password },
    });

    await transporter.sendMail({
      from: smtp.fromEmail,
      to: smtp.fromEmail, // the configured address is also the inbox that receives submissions
      replyTo: payload.email,
      subject: `[Contact form] ${payload.subject}`,
      text: `From: ${payload.fullName} <${payload.email}>\n\n${finalBody}`,
      attachments: payload.attachment
        ? [
            {
              filename: payload.attachment.name,
              content: payload.attachment.data,
              encoding: "base64",
              contentType: payload.attachment.type,
            },
          ]
        : undefined,
    });

    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("[contact] Failed to send:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
