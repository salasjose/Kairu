import { cn } from "@/lib/utils";
import Image from "next/image";

export default function Logo({ className, ...props }: { className?: string }) {
  return (
    <Image
      src="/backgrounds/LogoAppKairu.png"
      alt="Kairu Logo"
      width={312}
      height={112}
      className={cn("w-auto", className)}
      {...props}
    />
  );
}
