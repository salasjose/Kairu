import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/app/components/Logo";
import { Button } from "@/components/ui/button";

export default function StationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <nav className="container flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-bold font-headline text-xl hidden sm:inline">EcoQuest Explorers</span>
          </Link>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Map
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-grow container py-8">
        {children}
      </main>
    </div>
  );
}
