import { render, screen } from "@testing-library/react";

import QuestionStatusBadge from "@/features/secretary/components/QuestionStatusBadge";

describe("QuestionStatusBadge", () => {
  it("renderiza o texto e estilo de pergunta aberta", () => {
    render(<QuestionStatusBadge status="ABERTA" />);

    const badge = screen.getByText("Aberta");

    expect(badge.className).toContain("bg-[#FFF5DE]");
    expect(badge.className).toContain("text-[#8A5A08]");
  });

  it("renderiza o texto e estilo de pergunta respondida", () => {
    render(<QuestionStatusBadge status="RESPONDIDA" />);

    const badge = screen.getByText("Respondida");

    expect(badge.className).toContain("bg-[#EAF7ED]");
    expect(badge.className).toContain("text-[#2E6A4F]");
  });
});
