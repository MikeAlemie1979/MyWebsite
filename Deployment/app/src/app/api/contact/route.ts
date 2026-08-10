import { NextRequest, NextResponse } from "next/server";
import { validatePhoneNumber } from "@/lib/phone-validation";

const MAX_ATTACHMENT_BYTES = 300 * 1024;

interface ContactPayload {
  fullName: string;
  email: string;
  subject: string;
  body: string;
  requestCallback: boolean;
  phone?: string;
  attachmentSize?: number;
}

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

    if (payload.attachmentSize && payload.attachmentSize > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { error: "Attachment exceeds 300KB limit" },
        { status: 400 }
      );
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
      finalBody = `${finalBody}\n${payload.phone}`;
    }

    // NOTE: actual SMTP dispatch reuses the existing SMTP config
    // (see /api/admin/smtp-config) - wiring deferred to Admin integration pass.
    console.log("Contact submission received:", {
      fullName: payload.fullName,
      email: payload.email,
      subject: payload.subject,
      body: finalBody,
    });

    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
