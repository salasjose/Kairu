import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export default function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-primary", props.className)}
      {...props}
    >
      <path d="M12 22c-5.523 0-10-4.477-10-10 0-5.522 4.477-10 10-10 5.522 0 10 4.478 10 10 0 5.523-4.478 10-10 10z" />
      <path d="M12 2a10 10 0 0 0-2 19.83V12h-3v-2h3V8.5C10 5.57 11.57 4 14.5 4c.83 0 1.5.07 1.5.07v2.03h-1.2c-1.01 0-1.3.48-1.3 1.25V10h2.5l-.33 2H13v7.83A10 10 0 0 0 12 2z" />
    </svg>
  );
}
