import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import type { InquiryStatus } from "@/types/common.types";

export interface QuestionStatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement> {
  status: InquiryStatus;
}

const STATUS_COPY: Record<InquiryStatus, string> = {
  ABERTA: "Aberta",
  RESPONDIDA: "Respondida",
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  ABERTA: "border-[#E5B35A] bg-[#FFF5DE] text-[#8A5A08]",
  RESPONDIDA: "border-[#9FC4A7] bg-[#EAF7ED] text-[#2E6A4F]",
};

const QuestionStatusBadge = ({
  status,
  className,
  ...props
}: QuestionStatusBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.02em]",
        STATUS_STYLES[status],
        className,
      )}
      {...props}
    >
      {STATUS_COPY[status]}
    </span>
  );
};

export default QuestionStatusBadge;
