import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { orderIds, email, method } = await req.json();
    // method: 'paystack' or 'cash_on_delivery'

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !email) {
      return NextResponse.json({ error: "orderIds and email are required" }, { status: 400 });
    }

    const orders = await prisma.$queryRawUnsafe<{ id: string; grand_total_cents: number; customer_id: string }[]>(
      `SELECT id, grand_total_cents, customer_id FROM orders WHERE id = ANY($1::uuid[])`,
      orderIds
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: "Orders not found" }, { status: 404 });
    }

    const totalCents = orders.reduce((sum, o) => sum + o.grand_total_cents, 0);

    // ---- CASH ON DELIVERY ----
    if (method === "cash_on_delivery") {
      for (const order of orders) {
        await prisma.$queryRawUnsafe(
          `INSERT INTO payments (order_id, customer_id, amount_cents, currency, method, provider, status)
           VALUES ($1::uuid, $2::uuid, $3, 'GHS', 'CASH_ON_DELIVERY', 'manual', 'PENDING')`,
          order.id, order.customer_id, order.grand_total_cents
        );
      }
      return NextResponse.json({ codConfirmed: true });
    }

    // ---- PAYSTACK ----
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: totalCents,
        currency: "GHS",
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/verify`,
        metadata: { orderIds },
      }),
    });

    const data = await paystackRes.json();
    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    const reference = data.data.reference;

    for (const order of orders) {
      await prisma.$queryRawUnsafe(
        `INSERT INTO payments (order_id, customer_id, amount_cents, currency, method, provider, provider_ref, status)
         VALUES ($1::uuid, $2::uuid, $3, 'GHS', 'MOBILE_MONEY', 'paystack', $4, 'PENDING')`,
        order.id, order.customer_id, order.grand_total_cents, reference
      );
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference,
    });
  } catch (err) {
    console.error("Checkout init error:", err);
    return NextResponse.json({ error: "Failed to initialize checkout" }, { status: 500 });
  }
}