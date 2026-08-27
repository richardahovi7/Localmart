import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get("reference");
    if (!reference) {
      return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await verifyRes.json();

    if (!data.status || data.data.status !== "success") {
      await prisma.$queryRawUnsafe(
        `UPDATE payments SET status = 'FAILED' WHERE provider_ref = $1`,
        reference
      );
      return NextResponse.json({ success: false });
    }

    await prisma.$queryRawUnsafe(
      `UPDATE payments SET status = 'COMPLETED', paid_at = NOW() WHERE provider_ref = $1`,
      reference
    );
    await prisma.$queryRawUnsafe(
      `UPDATE orders SET status = 'CONFIRMED' WHERE id IN (SELECT order_id FROM payments WHERE provider_ref = $1)`,
      reference
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}