import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { success, error } from "@/lib/response";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';

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

    const orderStats = await prisma.$queryRawUnsafe<{ order_count: number; revenue_cents: number }[]>(
      `SELECT COUNT(*)::int AS order_count,
              COALESCE(SUM(grand_total_cents), 0)::int AS revenue_cents
       FROM orders
       WHERE business_id = $1::uuid`,
      businessId
    );

    const productStats = await prisma.$queryRawUnsafe<{ product_count: number }[]>(
      `SELECT COUNT(*)::int AS product_count
       FROM products
       WHERE business_id = $1::uuid`,
      businessId
    );

    return success({
      orders: orderStats[0].order_count,
      revenue: orderStats[0].revenue_cents / 100,
      products: productStats[0].product_count,
      rating: 0,
    });
  } catch (err) {
    console.error("Seller stats fetch error:", err);
    return error("Failed to fetch stats", 500);
  }
}