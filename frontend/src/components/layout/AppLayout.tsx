"use client";

import { ReactNode } from "react";
import MobileNavigation from "./MobileNavigation";
import DesktopNavigation from "./DesktopNavigation";

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
      {/* Desktop Navigation - visible on lg+ screens */}
      <div className="hidden lg:block">
        <DesktopNavigation />
      </div>

      <main
        className={`min-h-screen ${showMobileNav ? "pb-16 lg:pb-0" : ""} ${
          className || ""
        }`}
      >
        {children}
      </main>

      {/* Mobile Navigation - visible on screens smaller than lg */}
      {showMobileNav && (
        <div className="lg:hidden">
          <MobileNavigation />
        </div>
      )}
    </div>
  );
}
