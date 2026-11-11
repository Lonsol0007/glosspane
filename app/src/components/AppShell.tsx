"use client";
import { Clock, Compass, Ellipsis, LibraryBig, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const tabs = [
  { href: "/", label: "Library", icon: LibraryBig },
  { href: "/updates", label: "New", icon: Sparkles },
  { href: "/history", label: "History", icon: Clock },
  { href: "/browse", label: "Add", icon: Compass },
  { href: "/more", label: "More", icon: Ellipsis },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto min-h-dvh max-w-[1200px] pb-16 md:pb-0 md:pl-20">
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-border bg-surface md:inset-y-0 md:right-auto md:h-auto md:w-20 md:flex-col md:justify-center md:gap-2 md:border-r md:border-t-0">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium md:flex-none md:py-3">
              <span className={`flex h-8 w-14 items-center justify-center rounded-full ${active ? "bg-accent-soft text-on-accent-soft" : "text-muted"}`}>
                <Icon size={22} aria-hidden />
              </span>
              <span className={active ? "text-text" : "text-muted"}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <main>{children}</main>
    </div>
  );
}
