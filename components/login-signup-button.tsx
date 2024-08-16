"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function LoginSignButton() {
    const pathname = usePathname();

    const goTo = pathname === '/signup' ? '/login' : '/signup';
    const btnText = pathname === '/signup' ? 'Log in' : 'Sign up';

    return (<>

        <Link
            className="inline-flex h-8 items-center rounded-md border border-gray-200 bg-slate-500 px-3 text-sm font-medium"
            href={goTo}
        >
            {btnText}
        </Link>
    </>);
}