import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createNotification({
  userId,
  type,
  title,
  body,
  data = {},
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    await prisma.$queryRawUnsafe(
      `INSERT INTO notifications (user_id, type, title, body, data, is_read)
       VALUES ($1::uuid, $2, $3, $4, $5::jsonb, false)`,
      userId, type, title, body, JSON.stringify(data)
    );
    // Later: add email/SMS sending here, e.g.
    // await sendEmail(userId, title, body)
  } catch (err) {
    console.error("Failed to create notification:", err);
    // Don't throw — a notification failure shouldn't break the main action
  }
}