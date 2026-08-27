import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { success, error } from "@/lib/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) return error("Unauthorized", 401);
    const user = verifyToken(auth.replace("Bearer ", ""));
    if (!user || user.role !== "ADMIN") return error("Unauthorized", 401);

    const { businessId, orderIds, amountCents, payoutMethod, payoutReference } = await req.json();

    if (!businessId || !orderIds?.length || !amountCents) {
      return error("businessId, orderIds, and amountCents are required", 400);
    }

    await prisma.$queryRawUnsafe(
      `INSERT INTO payouts (business_id, amount_cents, order_ids, status, payout_method, payout_reference, paid_at)
       VALUES ($1::uuid, $2, $3::uuid[], 'PAID', $4, $5, NOW())`,
      businessId, amountCents, orderIds, payoutMethod || null, payoutReference || null
    );

    return success({ recorded: true });
  } catch (err) {
    console.error("Payout record error:", err);
    return error("Failed to record payout", 500);
  }
}