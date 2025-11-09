import { cn } from "@/lib/utils";
import Image from "next/image";

export default function Logo({ className, ...props }: { className?: string }) {
  return (
    <Image
      src="/backgrounds/Kairu_Logo1.png"
      alt="App Logo"
      width={312}
      height={112}
      className={cn("w-auto", className)}
      priority
      {...props}
    />
  );
}
