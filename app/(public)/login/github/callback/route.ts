import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { github, lucia } from "@/app/auth/auth";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import { insertUserSchema, NewUser, user } from "@/lib/database/schema";

export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies().get("github_oauth_state")?.value ?? null;
	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await github.validateAuthorizationCode(code);
		const githubUserResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});

		const githubUser: GitHubUser = await githubUserResponse.json();
		console.log("++++++++++");
		console.log(githubUser);
		console.log("++++++++++");
		// Replace this with your own DB client.
        const existingUser = await db.query.user.findFirst({
            where: eq(user.githubId, githubUser.id),
          });

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			return new Response(null, {
				status: 302,
				headers: {
					Location: "/"
				}
			});
		}

        const newUser = insertUserSchema.parse({
		  githubId: githubUser.id.toString(),
          username: githubUser.login,
        });

		console.log(githubUser.id);
		console.log(newUser);
      
        const results: NewUser[] = await db.insert(user).values(newUser).returning();
      
        if (!results[0].id) {
          throw new Error("User could not be created");
        }

		const session = await lucia.createSession(results[0].id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}

interface GitHubUser {
	id: string;
	login: string;
}