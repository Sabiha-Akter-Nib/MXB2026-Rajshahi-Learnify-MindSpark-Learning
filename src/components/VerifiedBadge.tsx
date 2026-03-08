import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const VERIFIED_EMAIL = "sabihaakternib@gmail.com";

export const isVerifiedEmail = (email: string | null | undefined): boolean => {
  return email?.toLowerCase() === VERIFIED_EMAIL;
};

interface VerifiedBadgeProps {
  className?: string;
  size?: number;
}

const VerifiedBadge = ({ className, size = 16 }: VerifiedBadgeProps) => (
  <BadgeCheck
    className={cn("inline-block shrink-0", className)}
    size={size}
    style={{
      color: "#1DA1F2",
      filter: "drop-shadow(0 0 4px rgba(29,161,242,0.4))",
    }}
  />
);

export default VerifiedBadge;
