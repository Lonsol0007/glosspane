"use client";
import { ChartNoAxesColumn, ChevronRight, FolderTree, Info, Settings } from "lucide-react";
import Link from "next/link";
import { Switch, TopBar } from "@/components/ui";
import { brand } from "@/lib/brand";
import { setPrefs, usePrefs } from "@/lib/prefs";

const links = [
  { href: "/more/categories", label: "Categories", icon: FolderTree },
  { href: "/more/stats", label: "Reading stats", icon: ChartNoAxesColumn },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/welcome", label: `About ${brand.name}`, icon: Info },
];

export default function MorePage() {
  const prefs = usePrefs();
  return (
    <>
      <TopBar title="More" />
      <div className="px-4 py-8 text-center">
        <p className="text-3xl font-bold tracking-tight">{brand.name}</p>
        <p className="mt-1 text-sm text-muted">{brand.tagline}</p>
      </div>
      <div className="border-y border-border">
        <Switch label="Private reading" description="While this is on, nothing you read is added to history or progress." checked={prefs.incognito} onChange={(v) => setPrefs({ incognito: v })} />
      </div>
      <ul>
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex h-14 items-center gap-4 px-4 hover:bg-surface">
              <Icon size={22} className="text-accent" aria-hidden />
              <span className="flex-1">{label}</span>
              <ChevronRight size={20} className="text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
