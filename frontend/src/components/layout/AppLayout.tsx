"use client";

import { ReactNode } from "react";
import MobileNavigation from "./MobileNavigation";

interface AppLayoutProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly showMobileNav?: boolean;
}

export default function AppLayout({
  children,
  className,
  showMobileNav = true,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main
        className={`min-h-screen ${showMobileNav ? "pb-16 lg:pb-0" : ""} ${
          className || ""
        }`}
      >
        {children}
      </main>

      {showMobileNav && <MobileNavigation />}
    </div>
  );
}
