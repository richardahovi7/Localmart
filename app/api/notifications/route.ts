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

    const notifications = await prisma.$queryRawUnsafe(
      `SELECT * FROM notifications WHERE user_id = $1::uuid ORDER BY created_at DESC LIMIT 50`,
      user.id
    );

    return success(notifications);
  } catch (err) {
    console.error("Notifications fetch error:", err);
    return error("Failed to fetch notifications", 500);
  }
}