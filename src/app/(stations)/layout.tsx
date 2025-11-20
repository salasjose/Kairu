"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/app/components/Logo";
import { Button } from "@/components/ui/button";
import PrizeCart from "@/app/components/PrizeCart";

export default function StationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-30">
        <nav className="container flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Mapa
              </Link>
            </Button>
            <PrizeCart />
          </div>
        </nav>
      </header>
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
}
