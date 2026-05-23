import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { MessageBubble } from "./MessageBubble";

expect.extend(matchers);

describe("MessageBubble", () => {
  it("preserves plain text line breaks and list formatting", () => {
    const messageText =
      "Horario do 1o semestre:\r\n\r\nSegunda-feira\r\n- Engenharia de Software I: 18:45 as 22:15\r\n- Sistemas Operacionais e Redes de Computadores: 22:15 as 23:05\r\n\r\nTerca-feira\r\n- Modelagem de BD: 18:45 as 21:15";

    const { container } = render(
      <MessageBubble
        message={{
          id: "msg-1",
          sender: "bot",
          text: messageText,
        }}
      />
    );

    const bubble = container.firstElementChild;

    expect(bubble).toHaveClass("whitespace-pre-wrap");
    expect(bubble?.textContent).toBe(
      "Horario do 1o semestre:\n\nSegunda-feira\n- Engenharia de Software I: 18:45 as 22:15\n- Sistemas Operacionais e Redes de Computadores: 22:15 as 23:05\n\nTerca-feira\n- Modelagem de BD: 18:45 as 21:15"
    );
    expect(bubble?.textContent).toContain("Segunda-feira");
    expect(bubble?.textContent).toContain(
      "- Engenharia de Software I: 18:45 as 22:15"
    );
  });

  it("still normalizes simple html line breaks without requiring html knowledge", () => {
    const { container } = render(
      <MessageBubble
        message={{
          id: "msg-2",
          sender: "bot",
          text: "Titulo<br><br>Item 1<li>Subitem</li>",
        }}
      />
    );

    expect(container.firstElementChild?.textContent).toBe(
      "Titulo\n\nItem 1\n- Subitem"
    );
  });
});
