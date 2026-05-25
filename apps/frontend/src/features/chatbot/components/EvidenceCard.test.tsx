import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { EvidenceCard } from "./EvidenceCard";

expect.extend(matchers);

vi.mock("../api/chatbot.api", () => ({
  chatbotApi: {
    getEvidenceUrl: vi.fn(() => "http://localhost:3000/api/v1/nodes/13/evidence"),
  },
}));

describe("EvidenceCard", () => {
  it("preserves line breaks from plain text evidence excerpts", () => {
    const excerpt =
      "Horario do 1o semestre:\r\n\r\nSegunda-feira\r\n- Engenharia de Software I: 18:45 as 22:15\r\n- Sistemas Operacionais e Redes de Computadores: 22:15 as 23:05";

    const { container } = render(
      <EvidenceCard nodeId={13} excerpt={excerpt} source="horario.pdf" />
    );

    const excerptElement = container.querySelector("p");

    expect(excerptElement).toHaveClass("whitespace-pre-wrap");
    expect(excerptElement?.textContent).toBe(excerpt);
  });
});
