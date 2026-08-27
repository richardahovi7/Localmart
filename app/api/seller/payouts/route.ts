import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { success, error } from "@/lib/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) return error("Unauthorized", 401);
    const user = verifyToken(auth.replace("Bearer ", ""));
    if (!user) return error("Unauthorized", 401);

    const businesses = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM businesses WHERE owner_id = $1::uuid LIMIT 1`,
      user.id
    );
    if (businesses.length === 0) return error("No business found", 404);
    const businessId = businesses[0].id;

    const owedOrders = await prisma.$queryRawUnsafe<{ id: string; grand_total_cents: number }[]>(
      `SELECT o.id, o.grand_total_cents
       FROM orders o
       JOIN payments p ON p.order_id = o.id
       WHERE o.business_id = $1::uuid
         AND p.status = 'COMPLETED'
         AND o.id != ALL(
           COALESCE((SELECT array_agg(DISTINCT oid) FROM payouts, unnest(order_ids) AS oid WHERE business_id = $1::uuid), ARRAY[]::uuid[])
         )`,
      businessId
    );

    const totalOwedCents = owedOrders.reduce((sum, o) => sum + o.grand_total_cents, 0);

    const payoutHistory = await prisma.$queryRawUnsafe(
      `SELECT * FROM payouts WHERE business_id = $1::uuid ORDER BY created_at DESC`,
      businessId
    );

    return success({
      totalOwedCents,
      owedOrderIds: owedOrders.map(o => o.id),
      payoutHistory,
    });
  } catch (err) {
    console.error("Payouts fetch error:", err);
    return error("Failed to fetch payouts", 500);
  }
}