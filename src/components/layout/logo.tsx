import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center justify-center h-20", className)}>
             <Image
                src="/logo.png"
                alt="Logo"
                width={60}
                height={60}
                className="h-full w-auto"
                priority
                data-ai-hint="logo"
            />
        </div>
    )
}
