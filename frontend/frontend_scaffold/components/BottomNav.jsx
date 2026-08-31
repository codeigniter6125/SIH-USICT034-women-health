"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: "home" },
    { name: "Cycle", href: "/cycle", icon: "cached" },
    { name: "Reports", href: "/reports", icon: "description" },
    { name: "Chat", href: "/chat", icon: "chat_bubble" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-outline rounded-t-xl shrink-0 shadow-lg">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center p-1.5 transition-all active:scale-90 rounded-xl ${
              isActive
                ? "bg-primary-container text-primary font-bold px-4 py-1.5 shadow-2xs"
                : "text-on-surface-variant hover:bg-surface-container-low px-3 py-1"
            }`}
          >
            <span
              className="material-symbols-outlined text-xl mb-0.5"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className="font-label-caps text-[11px]">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
