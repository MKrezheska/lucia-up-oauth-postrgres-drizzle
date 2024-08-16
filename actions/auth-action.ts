"use server";
import { revalidatePath } from "next/cache";
import { ActionResult } from "next/dist/server/app-render/types";
import { cookies } from "next/headers";
import { Argon2id } from "oslo/password";
import { eq } from "drizzle-orm";
import {
  email_verification_token,
  insertUserSchema,
  user,
} from "@/lib/database/schema";
import { db } from "@/lib/database";
import { lucia, validateRequest } from "@/app/auth/auth";
import {
  FormState,
  LoginFormSchema,
  SignupFormSchema,
} from "@/app/auth/definitions";
import { redirect } from "next/navigation";
import { generateId } from "lucia";
import { createDate, TimeSpan } from "oslo";
import { sendVerificationEmail } from "@/lib/email-service";

// check why this import does not work
// import { generateIdFromEntropySize } from "lucia";

export async function registerAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsedData = SignupFormSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedData.success) {
    return {
      errors: parsedData.error.flatten().fieldErrors,
    };
  }

  const data = parsedData.data;

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, data.email),
  });

  if (existingUser) {
    return {
      message: "Email already exists, please use a different email or login.",
    };
  }

  const hashedPassword = await new Argon2id().hash(data.password);

  try {
    const { userId, tokenId } = await db.transaction(async (tx) => {
      const newUser = insertUserSchema.parse({
        email: data.email,
        hashedPassword,
        username: data.username,
        emailVerified: false,
      });

      const results = await tx.insert(user).values(newUser).returning();

      if (!results[0].id) {
        return {
          message: "An error occurred while creating your account.",
        };
      }

      // Insert new token into the database
      const tokenId = generateId(25); // 25 characters long

      await tx.insert(email_verification_token).values({
        token: tokenId,
        userId: results[0].id,
        expiresAt: createDate(new TimeSpan(2, "h")),
      });

      return { userId: results[0].id, tokenId };
    });

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/email-verification?token=${tokenId}`;

    // Send verification email
    await sendVerificationEmail(data.email, verificationLink);

    // Optionally set session here if you want to log the user in immediately
    // const session = await lucia.createSession(userId, {});
    // const sessionCookie = lucia.createSessionCookie(session.id);
    // cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return {
      success: true,
      message: "Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Error during signup:", error);
    return {
      success: false,
      message: "An error occurred during signup. Please try again.",
    };
  }
}

export async function loginAction(
  prevState: FormState,
  formData: FormData
): Promise<ActionResult> {
  const parsedData = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const errorMessage = { message: "Invalid login credentials." };

  if (!parsedData.success) {
    return {
      message: parsedData.error.flatten().fieldErrors,
    };
  }
  const data = parsedData.data;

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, data.email),
  });

  if (!existingUser || !existingUser?.emailVerified) {
    return errorMessage;
  }

  const validPassword = await new Argon2id().verify(
    existingUser.hashedPassword ?? "",
    data.password
  );

  if (!validPassword) {
    return errorMessage;
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  redirect("/dashboard");
}

export async function logoutAction(): Promise<ActionResult> {
  const { session } = await validateRequest();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  return revalidatePath("/");
}

export async function resendVerificationEmail(userId: string) {
  try {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!existingUser || !existingUser.email) {
      return {
        success: false,
        message: "User not found!",
      };
    }

    if (existingUser.emailVerified) {
      return {
        success: false,
        message: "User already verified!",
      };
    }

    // Insert new token into the database
    const tokenId = generateId(25); // 25 characters long

    await db
      .update(email_verification_token)
      .set({
        token: tokenId,
        expiresAt: createDate(new TimeSpan(2, "h")),
      })
      .where(eq(email_verification_token.userId, existingUser.id));

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/email-verification?token=${tokenId}`;

    // Send verification email
    await sendVerificationEmail(existingUser.email, verificationLink);
    return {
      success: true,
      message: "Please re-check your email to verify your account.",
    };
  } catch (error) {
    console.error("Error during resend verification email:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
}
