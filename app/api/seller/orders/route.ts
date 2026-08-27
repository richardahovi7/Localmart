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

    const orders = await prisma.$queryRawUnsafe<any[]>(
      `SELECT o.*, u.full_name as "customerName", u.phone as "customerPhone"
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       WHERE o.business_id = $1::uuid
       ORDER BY o.created_at DESC`,
      businessId
    );

    const orderIds = orders.map((o: any) => o.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      items = await prisma.$queryRawUnsafe(
        `SELECT oi.id, oi.order_id as "orderId", oi.quantity, oi.unit_price_cents as "unitPriceCents", p.title
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ANY($1::uuid[])`,
        orderIds
      );
    }

    const ordersWithItems = orders.map((o: any) => ({
      ...o,
      items: items.filter((i: any) => i.orderId === o.id),
    }));

    return success(ordersWithItems);
  } catch (err) {
    console.error("Seller orders fetch error:", err);
    return error("Failed to fetch orders", 500);
  }
}