import { db } from "@/lib/database";
import React from "react";
import { validateRequest } from "@/app/auth/auth";
import Logout from "../../components/logout";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const users = await db.query.user.findMany();
  const { user, session } = await validateRequest();
  console.log("===========");
  console.log(user, session);
  if (!user || !session) {
    redirect('/');
  }
  return (
    <div className="p-10 flex flex-col gap-4 h-[100vh] overflow-hidden">
      <div className="flex gap-4">
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex bg-gray-50 border rounded-md border-neutral-900 px-12 py-4 h-[80px] justify-between">
            <div className="flex gap-2 items-center">
              <div className="text-lg font-bold">Logged user:</div>
              <div className="text-lg font-bold text-blue-700">
                {user?.email ?? "None"}
              </div>
              <div className="text-lg text-neutral-900">
                {session?.expiresAt &&
                  " - Session expires at: " +
                    new Date(session.expiresAt).toLocaleString()}
              </div>
            </div>
            {user && <Logout />}
          </div>
          <div className="flex flex-col bg-gray-50 flex-1 border rounded-md border-neutral-900 px-12 py-6">
            <div className="mb-3 text-lg font-bold">User list:</div>
            <div className="h-[500px] overflow-auto text-black">
              <div className="grid grid-cols-3 gap-4 overflow-auto">
                <div className="mb-3 text-lg font-bold">ID</div>
                <div className="mb-3 text-lg font-bold">Username</div>
                <div className="mb-3 text-lg font-bold">Email</div>
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <p>{user.id}</p>
                    <p>{user.username}</p>
                    <p>{user.email}</p>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
