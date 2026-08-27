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
    if (!user) return error("Unauthorized", 401);

    await prisma.$queryRawUnsafe(
      `UPDATE notifications SET is_read = true WHERE user_id = $1::uuid AND is_read = false`,
      user.id
    );

    return success({ marked: true });
  } catch (err) {
    console.error("Mark all read error:", err);
    return error("Failed to mark all read", 500);
  }
}