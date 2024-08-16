'use client';

import { registerAction } from "@/actions/auth-action";
import React from "react";
import { useFormState, useFormStatus } from "react-dom";

export default function RegisterForm() {
  const [state, action] = useFormState(registerAction, undefined);

  return (
    <form
      className="flex flex-col gap-2 border border-neutral-900 max-w-[500px] rounded-md py-6 px-12 bg-slate-50"
      action={action}
    >
      <h1 className="mb-3 text-lg font-bold text-gray-900">Register</h1>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Username
        </label>
        <input
          type="text"
          name="username"
          id="username"
          placeholder="John Doe"
          autoComplete="off"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        {state?.errors?.username && (
          <p className="text-sm text-red-500">{state.errors.username}</p>
        )}
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Email
        </label>
        <input
          type="text"
          name="email"
          id="email"
          placeholder="jon@example.com"
          autoComplete="email"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        {state?.errors?.email && (
          <p className="text-sm text-red-500">{state.errors.email}</p>
        )}
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900">
          Password
        </label>
        <input
          placeholder="********"
          name="password"
          type="password"
          id="password"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        {state?.errors?.password && (
          <div className="text-sm text-red-500">
            <p>Password must:</p>
            <ul>
              {state.errors.password.map((error: any) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <SignupButton />
    </form>
  );
};

export function SignupButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      type="submit"
      className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
    >
      {pending ? 'Submitting...' : 'Sign up'}
    </button>
  );
}