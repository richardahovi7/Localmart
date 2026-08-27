import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const reference = event.data.reference;

    await prisma.$queryRawUnsafe(
      `UPDATE payments SET status = 'paid', paid_at = NOW() WHERE provider_ref = $1`,
      reference
    );
    await prisma.$queryRawUnsafe(
      `UPDATE orders SET status = 'CONFIRMED' WHERE id IN (SELECT order_id FROM payments WHERE provider_ref = $1)`,
      reference
    );
  }

  return NextResponse.json({ received: true });
}