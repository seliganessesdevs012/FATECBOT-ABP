import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface PanelCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function PanelSectionCard({
  className,
  children,
  ...props
}: PanelCardProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-[#E3D8CA] bg-white p-5 shadow-[0_18px_40px_rgba(92,53,12,0.06)]",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function PanelStatCard({
  className,
  label,
  value,
  supportingText,
}: {
  className?: string;
  label: string;
  value: ReactNode;
  supportingText?: ReactNode;
}) {
  return (
    <div className={cn("rounded-[22px] bg-[#FCF8F2] px-4 py-3", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
        {label}
      </p>
      <div className="mt-2 text-2xl font-black text-[#1C262E]">{value}</div>
      {supportingText ? (
        <p className="mt-1 text-xs text-[#6E6252]">{supportingText}</p>
      ) : null}
    </div>
  );
}

export function PanelPageIntro({
  icon: Icon,
  badge,
  title,
  description,
  aside,
  className,
}: {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <PanelSectionCard className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F6EFE4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6548]">
            <Icon className="size-3.5" aria-hidden="true" />
            {badge}
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#1C262E]">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6E6252]">
              {description}
            </p>
          </div>
        </div>

        {aside ? <div className="grid gap-3 sm:grid-cols-2">{aside}</div> : null}
      </div>
    </PanelSectionCard>
  );
}

export function PanelEmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-dashed border-[#D8C9B3] bg-[#FFFDF9] px-6 py-12 text-center shadow-[0_18px_40px_rgba(92,53,12,0.04)]",
        className,
      )}
    >
      <p className="text-lg font-semibold text-[#1C262E]">{title}</p>
      <p className="mt-2 text-sm text-[#6E6252]">{description}</p>
    </div>
  );
}

export function PanelTableCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[28px] border border-[#E3D8CA] bg-white shadow-[0_18px_40px_rgba(92,53,12,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelFooterBar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <footer
      className={cn(
        "flex flex-col gap-3 rounded-[24px] border border-[#E3D8CA] bg-[#F8F3EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {children}
    </footer>
  );
}
