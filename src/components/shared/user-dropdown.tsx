"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export function UserDropdown({
  name,
  role,
  profileImage,
}: {
  name?: string;
  role?: string;
  profileImage?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = name?.trim() ? name.trim()[0].toUpperCase() : "U";
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#EEF2FF] text-sm font-bold text-[#1B3C87] hover:ring-2 hover:ring-[#1B3C87]/20 transition-all"
        title={name || "내 계정"}
      >
        {profileImage ? (
          <Image
            src={profileImage}
            alt={name || "프로필"}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="border-b border-[#E8ECF0] px-4 pb-3 pt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#EEF2FF] text-sm font-bold text-[#1B3C87] shrink-0">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={name || "프로필"}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <p className="text-sm font-semibold truncate">{name || "내 계정"}</p>
          </div>

          <div className="py-1">
            {[
              { href: "/profile", label: "프로필" },
              { href: "/games/my-games", label: "내 경기" },
              { href: "/tournament-admin", label: "대회 관리" },
              ...(isSuperAdmin ? [{ href: "/admin", label: "관리자" }] : []),
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#111827]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#E8ECF0] pt-1">
            <a
              href="/api/auth/logout"
              className="block w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]"
            >
              로그아웃
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
