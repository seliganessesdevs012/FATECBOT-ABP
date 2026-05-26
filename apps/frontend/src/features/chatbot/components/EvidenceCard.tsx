import { FileText } from "lucide-react";

import { chatbotApi } from "../api/chatbot.api";

interface EvidenceCardProps {
  nodeId?: number;
  excerpt?: string | null;
  source?: string | null;
  className?: string;
}

export function EvidenceCard({
  nodeId,
  excerpt,
  source,
  className,
}: EvidenceCardProps) {
  if (!excerpt && !source) {
    return null;
  }

  const evidenceUrl = nodeId ? chatbotApi.getEvidenceUrl(nodeId) : null;

  return (
    <div
      className={`rounded-[24px] border border-[#E1D8CC] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(92,53,12,0.08)] ${className ?? ""}`}
    >
      {excerpt ? (
        <p className="break-words whitespace-pre-wrap text-sm leading-6 text-[#1C1C1C]">
          {excerpt}
        </p>
      ) : null}

      {source ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#1D9BF0]">
          <FileText className="size-4 shrink-0" aria-hidden="true" />
          {evidenceUrl ? (
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer font-medium italic transition-opacity hover:opacity-80"
            >
              Fonte: {source}
            </a>
          ) : (
            <span className="font-medium italic">Fonte: {source}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
