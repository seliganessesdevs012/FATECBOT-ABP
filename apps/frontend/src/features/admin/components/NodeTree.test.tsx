import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NodeTree from "@/features/admin/components/NodeTree";
import { useNodes, type UseNodesResult } from "@/features/admin/hooks/useNodes";

vi.mock("@/features/admin/hooks/useNodes", () => ({
  useNodes: vi.fn(),
}));

const createUseNodesResult = (
  overrides: Partial<UseNodesResult> = {},
): UseNodesResult => ({
  nodes: [],
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn().mockResolvedValue(undefined),
  createNode: vi.fn().mockResolvedValue(undefined),
  updateNode: vi.fn().mockResolvedValue(undefined),
  deleteNode: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const sampleNodes = [
  {
    id: 1,
    title: "Nao sou aluno",
    slug: "nao-sou-aluno",
    parent_id: null,
    display_order: 1,
    is_active: true,
    childrenCount: 2,
  },
  {
    id: 2,
    title: "DSM",
    slug: "dsm",
    parent_id: null,
    display_order: 2,
    is_active: true,
    childrenCount: 1,
  },
  {
    id: 3,
    title: "Informacoes sobre como ingressar",
    slug: "nao-aluno-ingresso",
    parent_id: 1,
    display_order: 1,
    is_active: true,
    childrenCount: 1,
  },
  {
    id: 4,
    title: "Como realizar a matricula?",
    slug: "nao-aluno-matricula",
    parent_id: 1,
    display_order: 2,
    is_active: true,
    childrenCount: 0,
  },
  {
    id: 5,
    title: "Vestibular e prazos",
    slug: "nao-aluno-vestibular",
    parent_id: 3,
    display_order: 1,
    is_active: true,
    childrenCount: 0,
  },
] as const;

describe("NodeTree", () => {
  beforeEach(() => {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("comeca mostrando apenas os nos raiz sem selecionar nada automaticamente", () => {
    const onSelectNode = vi.fn();

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        nodes: [...sampleNodes],
      }),
    );

    render(<NodeTree onSelectNode={onSelectNode} />);

    expect(screen.getByText("Nivel 1")).not.toBeNull();
    expect(screen.getByText("Nao sou aluno")).not.toBeNull();
    expect(screen.getByText("DSM")).not.toBeNull();
    expect(screen.queryByText("Nivel 2")).toBeNull();
    expect(onSelectNode).not.toHaveBeenCalled();
  });

  it("abre o proximo nivel quando o usuario seleciona um no raiz", async () => {
    const user = userEvent.setup();
    const onSelectNode = vi.fn();

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        nodes: [...sampleNodes],
      }),
    );

    render(<NodeTree onSelectNode={onSelectNode} />);

    await user.click(screen.getByRole("button", { name: /nao sou aluno/i }));

    expect(onSelectNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title: "Nao sou aluno" }),
    );
  });

  it("mostra os filhos do caminho selecionado em niveis sucessivos", () => {
    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        nodes: [...sampleNodes],
      }),
    );

    render(<NodeTree selectedNodeId={3} />);

    expect(screen.getByText("Nivel 2")).not.toBeNull();
    expect(screen.getByText("Nivel 3")).not.toBeNull();
    expect(screen.getAllByText("Informacoes sobre como ingressar").length).toBeGreaterThan(0);
    expect(screen.getByText("Vestibular e prazos")).not.toBeNull();
  });

  it("permite buscar um no globalmente e selecionar o resultado", async () => {
    const user = userEvent.setup();
    const onSelectNode = vi.fn();

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        nodes: [...sampleNodes],
      }),
    );

    render(<NodeTree onSelectNode={onSelectNode} />);

    await user.type(
      screen.getByPlaceholderText(/buscar no por titulo ou slug/i),
      "matricula",
    );
    await user.click(
      screen.getByRole("button", { name: /como realizar a matricula/i }),
    );

    expect(onSelectNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: 4, title: "Como realizar a matricula?" }),
    );
  });

  it("exibe erro da consulta com acao para tentar novamente", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useNodes).mockReturnValue(
      createUseNodesResult({
        isError: true,
        error: new Error("Falha ao buscar nos"),
        refetch,
      }),
    );

    render(<NodeTree />);

    expect(screen.getByText("Erro ao carregar a estrutura")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
