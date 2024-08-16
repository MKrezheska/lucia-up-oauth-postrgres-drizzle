import { lucia } from "@/app/auth/auth";
import { db } from "@/lib/database";
import { email_verification_token, user } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return Response.json(
      {
        error: "Invalid token!",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [verificationToken] = await tx
        .select()
        .from(email_verification_token)
        .where(eq(email_verification_token.token, token))
        .limit(1);

      if (!verificationToken || new Date() > verificationToken.expiresAt) {
        throw Error("Invalid or expired verification token.");
      }

      await tx
        .update(user)
        .set({ emailVerified: true })
        .where(eq(user.id, verificationToken.userId));

      await tx
        .delete(email_verification_token)
        .where(eq(email_verification_token.token, token));

      return { userId: verificationToken.userId };
    });

    if (!result.userId) {
      throw new Error("Verification failed.");
    }

    // Set session after successful verification
    const session = await lucia.createSession(result.userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return Response.redirect(new URL(process.env.NEXT_PUBLIC_APP_URL!), 302);
  } catch (error: any) {
    return Response.json(
      {
        error: error.message,
      },
      {
        status: 400,
      }
    );
  }
};
