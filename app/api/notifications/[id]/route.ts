import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { success, error } from "@/lib/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = req.headers.get("authorization");
    if (!auth) return error("Unauthorized", 401);
    const user = verifyToken(auth.replace("Bearer ", ""));
    if (!user) return error("Unauthorized", 401);

    await prisma.$queryRawUnsafe(
      `UPDATE notifications SET is_read = true WHERE id = $1::uuid AND user_id = $2::uuid`,
      id, user.id
    );

    return success({ marked: true });
  } catch (err) {
    console.error("Notification update error:", err);
    return error("Failed to update notification", 500);
  }
}