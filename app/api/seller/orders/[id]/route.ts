import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { success, error } from "@/lib/response";
import { createNotification } from "@/lib/notifications";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEQUENCE = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED: "Your order has been confirmed by the seller.",
  PREPARING: "Your order is being prepared.",
  READY: "Your order is ready.",
  OUT_FOR_DELIVERY: "Your order is out for delivery.",
  DELIVERED: "Your order has been delivered. Enjoy!",
  CANCELLED: "Your order has been cancelled by the seller.",
};

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = req.headers.get("authorization");
    if (!auth) return error("Unauthorized", 401);
    const user = verifyToken(auth.replace("Bearer ", ""));
    if (!user) return error("Unauthorized", 401);

    const { action } = await req.json();

    const businesses = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM businesses WHERE owner_id = $1::uuid LIMIT 1`,
      user.id
    );
    if (businesses.length === 0) return error("No business found", 404);
    const businessId = businesses[0].id;

    const orders = await prisma.$queryRawUnsafe<{ id: string; status: string; business_id: string; customer_id: string }[]>(
      `SELECT id, status, business_id, customer_id FROM orders WHERE id = $1::uuid`,
      id
    );
    if (orders.length === 0) return error("Order not found", 404);
    const order = orders[0];

    if (order.business_id !== businessId) return error("Unauthorized", 403);

    let newStatus: string;

    if (action === "cancel") {
      if (["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)) {
        return error("Cannot cancel an order in this state", 400);
      }
      newStatus = "CANCELLED";
    } else {
      const currentIndex = SEQUENCE.indexOf(order.status);
      if (currentIndex === -1 || currentIndex === SEQUENCE.length - 1) {
        return error("Order cannot be advanced further", 400);
      }
      newStatus = SEQUENCE[currentIndex + 1];
    }

    await prisma.$queryRawUnsafe(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2::uuid`,
      newStatus, id
    );

    await createNotification({
      userId: order.customer_id,
      type: "ORDER_STATUS_CHANGE",
      title: `Order ${newStatus.replace(/_/g, " ").toLowerCase()}`,
      body: STATUS_MESSAGES[newStatus] || `Your order status changed to ${newStatus}.`,
      data: { orderId: id, status: newStatus },
    });

    return success({ status: newStatus });
  } catch (err) {
    console.error("Order status update error:", err);
    return error("Failed to update order status", 500);
  }
}