import type { AuthUser, LoginPayload } from "@/features/auth/types/auth.types";
import type {
  ChatNode,
  ChatNodeChild,
} from "@/features/chatbot/types/chatbot.types";
import type { QuestionResponseDTO } from "@/features/secretary/types/questions.types";
import type { PaginatedResponse } from "@/types/api.types";
import type { InquiryStatus, Role, Satisfaction } from "@/types/common.types";

interface MockNodeRecord {
  id: number;
  title: string;
  slug: string;
  prompt: string | null;
  answer_summary: string | null;
  evidence_excerpt: string | null;
  evidence_source: string | null;
  parent_id: number | null;
  display_order: number;
  is_active: boolean;
}

interface MockNodeListItem {
  id: number;
  title: string;
  slug: string;
  parent_id: number | null;
  display_order: number;
  is_active: boolean;
  childrenCount: number;
}

interface MockAdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

interface MockSessionLog {
  id: number;
  navigation_flow: string[];
  flag: Satisfaction;
  created_at: string;
}

const MOCK_DELAY_MS = 120;

const wait = async (ms = MOCK_DELAY_MS): Promise<void> =>
  new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });

const compareByOrderAndTitle = (
  left: { display_order: number; title: string },
  right: { display_order: number; title: string },
): number => {
  if (left.display_order !== right.display_order) {
    return left.display_order - right.display_order;
  }

  return left.title.localeCompare(right.title, "pt-BR");
};

const paginate = <T>(
  items: T[],
  page = 1,
  limit = 20,
): PaginatedResponse<T> => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const start = (safePage - 1) * safeLimit;

  return {
    success: true,
    data: items.slice(start, start + safeLimit),
    meta: {
      total: items.length,
      page: safePage,
      limit: safeLimit,
    },
  };
};

let nodeIdSequence = 20;
let userIdSequence = 4;

let mockNodes: MockNodeRecord[] = [
  {
    id: 1,
    title: "O que voce deseja?",
    slug: "root",
    prompt: "O que voce deseja?",
    answer_summary: null,
    evidence_excerpt: null,
    evidence_source: null,
    parent_id: null,
    display_order: 1,
    is_active: true,
  },
  {
    id: 2,
    title: "Ainda nao sou aluno",
    slug: "ainda-nao-sou-aluno",
    prompt: "Qual informacao voce procura antes de ingressar?",
    answer_summary: null,
    evidence_excerpt: null,
    evidence_source: null,
    parent_id: 1,
    display_order: 1,
    is_active: true,
  },
  {
    id: 3,
    title: "Ja sou aluno",
    slug: "ja-sou-aluno",
    prompt: "Qual tema academico voce deseja consultar?",
    answer_summary: null,
    evidence_excerpt: null,
    evidence_source: null,
    parent_id: 1,
    display_order: 2,
    is_active: true,
  },
  {
    id: 4,
    title: "Cursos",
    slug: "cursos",
    prompt: "Escolha um curso para continuar a navegacao.",
    answer_summary: null,
    evidence_excerpt: null,
    evidence_source: null,
    parent_id: 1,
    display_order: 3,
    is_active: true,
  },
  {
    id: 5,
    title: "Bolsas e auxilios",
    slug: "bolsas-e-auxilios",
    prompt: "Veja as principais orientacoes sobre apoio estudantil.",
    answer_summary:
      "A Fatec divulga editais especificos para bolsa permanencia e monitoria ao longo do semestre.",
    evidence_excerpt:
      "Os programas de apoio ao estudante dependem de edital proprio e cronograma institucional.",
    evidence_source: "manual-do-estudante.pdf",
    parent_id: 1,
    display_order: 4,
    is_active: true,
  },
  {
    id: 6,
    title: "Vestibular",
    slug: "vestibular",
    prompt: "Veja detalhes sobre o processo seletivo.",
    answer_summary:
      "As inscricoes do vestibular seguem o calendario oficial divulgado pelo Centro Paula Souza.",
    evidence_excerpt:
      "O cronograma do vestibular e publicado em edital com datas de inscricao, prova e matricula.",
    evidence_source: "edital-vestibular-fatec.pdf",
    parent_id: 1,
    display_order: 5,
    is_active: false,
  },
  {
    id: 7,
    title: "Informacoes sobre como ingressar",
    slug: "como-ingressar",
    prompt: null,
    answer_summary:
      "Voce pode ingressar por vestibular, vagas remanescentes ou transferencia, conforme edital vigente.",
    evidence_excerpt:
      "As formas de ingresso dependem de edital especifico e de disponibilidade de vagas por curso.",
    evidence_source: "portal-institucional-ingresso.pdf",
    parent_id: 2,
    display_order: 1,
    is_active: true,
  },
  {
    id: 8,
    title: "Documentos para matricula",
    slug: "documentos-matricula",
    prompt: null,
    answer_summary:
      "RG, CPF, historico escolar e comprovante de conclusao sao os documentos normalmente exigidos.",
    evidence_excerpt:
      "A matricula requer documentacao civil e comprovacao de escolaridade conforme edital.",
    evidence_source: "edital-matricula-fatec.pdf",
    parent_id: 2,
    display_order: 2,
    is_active: true,
  },
  {
    id: 9,
    title: "Prazos importantes",
    slug: "prazos-importantes",
    prompt: null,
    answer_summary:
      "Os principais prazos sao divulgados no calendario academico e no edital do processo seletivo.",
    evidence_excerpt:
      "Todos os prazos de ingresso e matricula devem ser consultados em calendario e edital oficiais.",
    evidence_source: "calendario-academico-e-edital.pdf",
    parent_id: 2,
    display_order: 3,
    is_active: true,
  },
  {
    id: 10,
    title: "AACC",
    slug: "aacc",
    prompt: null,
    answer_summary:
      "As atividades academico-cientifico-culturais possuem carga horaria minima definida no PPC do curso.",
    evidence_excerpt:
      "A integralizacao das AACC depende da validacao pela coordenacao e das regras do curso.",
    evidence_source: "ppc-do-curso.pdf",
    parent_id: 3,
    display_order: 1,
    is_active: true,
  },
  {
    id: 11,
    title: "Estagio",
    slug: "estagio",
    prompt: "Que informacao de estagio voce precisa?",
    answer_summary: null,
    evidence_excerpt: null,
    evidence_source: null,
    parent_id: 3,
    display_order: 2,
    is_active: true,
  },
  {
    id: 12,
    title: "Horario de aulas",
    slug: "horario-aulas",
    prompt: null,
    answer_summary:
      "Os horarios ficam disponiveis no sistema institucional e podem sofrer ajustes no inicio do semestre.",
    evidence_excerpt:
      "A organizacao das turmas e horarios segue publicacao da unidade em cada semestre letivo.",
    evidence_source: "comunicado-interno-da-unidade.pdf",
    parent_id: 3,
    display_order: 3,
    is_active: true,
  },
  {
    id: 13,
    title: "Duracao minima",
    slug: "duracao-minima-estagio",
    prompt: null,
    answer_summary:
      "A carga de estagio obrigatorio varia conforme o curso e deve seguir o regulamento institucional.",
    evidence_excerpt:
      "O estagio curricular deve respeitar carga horaria e documentacao previstas no regulamento.",
    evidence_source: "manual-de-estagio-fatec.pdf",
    parent_id: 11,
    display_order: 1,
    is_active: true,
  },
  {
    id: 14,
    title: "Documentacao",
    slug: "documentacao-estagio",
    prompt: null,
    answer_summary:
      "Os documentos basicos costumam incluir termo de compromisso, plano de atividades e relatorios.",
    evidence_excerpt:
      "A formalizacao do estagio exige termo assinado e acompanhamento da instituicao.",
    evidence_source: "manual-de-estagio-fatec.pdf",
    parent_id: 11,
    display_order: 2,
    is_active: true,
  },
];

let mockUsers: MockAdminUser[] = [
  {
    id: 2,
    name: "Secretaria Academica 1",
    email: "secretaria1@fatec.sp.gov.br",
    role: "SECRETARIA",
    created_at: "2026-05-01T09:00:00.000Z",
  },
  {
    id: 3,
    name: "Secretaria Academica 2",
    email: "secretaria2@fatec.sp.gov.br",
    role: "SECRETARIA",
    created_at: "2026-05-10T14:15:00.000Z",
  },
  {
    id: 4,
    name: "Secretaria Academica 3",
    email: "secretaria3@fatec.sp.gov.br",
    role: "SECRETARIA",
    created_at: "2026-05-14T11:30:00.000Z",
  },
];

let mockQuestions: QuestionResponseDTO[] = [
  {
    id: 1,
    requester_name: "Aluno A",
    requester_email: "aluno.a@fatec.sp.gov.br",
    question: "Quais documentos preciso para pedir aproveitamento?",
    session_log_id: 2,
    status: "ABERTA",
    created_at: "2026-05-18T11:00:00.000Z",
    updated_at: "2026-05-18T11:00:00.000Z",
  },
  {
    id: 2,
    requester_name: "Aluno B",
    requester_email: "aluno.b@fatec.sp.gov.br",
    question: "Como validar minhas AACC?",
    session_log_id: 5,
    status: "ABERTA",
    created_at: "2026-05-17T15:40:00.000Z",
    updated_at: "2026-05-17T15:40:00.000Z",
  },
  {
    id: 3,
    requester_name: "Aluno C",
    requester_email: "aluno.c@fatec.sp.gov.br",
    question: "Onde encontro o calendario do semestre?",
    session_log_id: 7,
    status: "RESPONDIDA",
    created_at: "2026-05-15T10:15:00.000Z",
    updated_at: "2026-05-16T08:30:00.000Z",
  },
];

const mockLogs: MockSessionLog[] = [
  {
    id: 1,
    navigation_flow: ["root", "ja-sou-aluno", "aacc"],
    flag: "ATENDEU",
    created_at: "2026-05-19T10:30:00.000Z",
  },
  {
    id: 2,
    navigation_flow: ["root", "ja-sou-aluno", "estagio", "documentacao-estagio"],
    flag: "NAO_ATENDEU",
    created_at: "2026-05-19T09:45:00.000Z",
  },
  {
    id: 3,
    navigation_flow: ["root", "ainda-nao-sou-aluno", "como-ingressar"],
    flag: "ATENDEU",
    created_at: "2026-05-18T17:05:00.000Z",
  },
  {
    id: 4,
    navigation_flow: ["root", "ja-sou-aluno", "estagio", "duracao-minima-estagio"],
    flag: "ATENDEU",
    created_at: "2026-05-18T13:20:00.000Z",
  },
  {
    id: 5,
    navigation_flow: ["root", "ainda-nao-sou-aluno", "documentos-matricula"],
    flag: "ATENDEU",
    created_at: "2026-05-17T15:40:00.000Z",
  },
  {
    id: 6,
    navigation_flow: ["root", "ja-sou-aluno", "horario-aulas"],
    flag: "ATENDEU",
    created_at: "2026-05-16T08:00:00.000Z",
  },
  {
    id: 7,
    navigation_flow: ["root", "ainda-nao-sou-aluno", "prazos-importantes"],
    flag: "NAO_ATENDEU",
    created_at: "2026-05-14T18:10:00.000Z",
  },
  {
    id: 8,
    navigation_flow: ["root", "bolsas-e-auxilios"],
    flag: "ATENDEU",
    created_at: "2026-05-10T12:10:00.000Z",
  },
];

const mockAdminUser: AuthUser = {
  id: 1,
  name: "Admin Mock",
  email: "admin@fatec.sp.gov.br",
  role: "ADMIN",
};

const mockSecretaryUser: AuthUser = {
  id: 99,
  name: "Secretaria Mock",
  email: "secretaria@fatec.sp.gov.br",
  role: "SECRETARIA",
};

const toNodeChildren = (parentId: number): ChatNodeChild[] =>
  mockNodes
    .filter(node => node.parent_id === parentId && node.is_active)
    .slice()
    .sort(compareByOrderAndTitle)
    .map(node => ({
      id: node.id,
      title: node.title,
      slug: node.slug,
      display_order: node.display_order,
    }));

const toNodeListItem = (node: MockNodeRecord): MockNodeListItem => ({
  id: node.id,
  title: node.title,
  slug: node.slug,
  parent_id: node.parent_id,
  display_order: node.display_order,
  is_active: node.is_active,
  childrenCount: mockNodes.filter(child => child.parent_id === node.id).length,
});

const toChatNode = (node: MockNodeRecord): ChatNode => ({
  id: node.id,
  title: node.title,
  slug: node.slug,
  prompt: node.prompt,
  answer_summary: node.answer_summary,
  evidence_excerpt: node.evidence_excerpt,
  evidence_source: node.evidence_source,
  parent_id: node.parent_id,
  display_order: node.display_order,
  is_active: node.is_active,
  children: toNodeChildren(node.id),
});

const findNodeById = (id: number): MockNodeRecord => {
  const node = mockNodes.find(item => item.id === id);

  if (!node) {
    throw new Error("No nao encontrado.");
  }

  return node;
};

const isDateInRange = (value: string, from?: string, to?: string): boolean => {
  const target = new Date(value);

  if (from) {
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    if (target < fromDate) {
      return false;
    }
  }

  if (to) {
    const toDate = new Date(`${to}T23:59:59.999Z`);
    if (target > toDate) {
      return false;
    }
  }

  return true;
};

const buildMockToken = (role: Role): string =>
  `mock-${role.toLowerCase()}-${Date.now()}`;

export const mockBackend = {
  auth: {
    async login(
      payload: LoginPayload,
    ): Promise<{ token: string; user: AuthUser }> {
      await wait();

      const normalizedEmail = payload.email.trim().toLowerCase();
      const user =
        normalizedEmail.includes("secretaria")
          ? mockSecretaryUser
          : mockAdminUser;

      return {
        token: buildMockToken(user.role),
        user,
      };
    },
  },

  nodes: {
    async list(): Promise<{ success: true; data: MockNodeListItem[] }> {
      await wait();

      return {
        success: true,
        data: mockNodes.slice().sort(compareByOrderAndTitle).map(toNodeListItem),
      };
    },

    async getById(id: number): Promise<{ success: true; data: ChatNode }> {
      await wait();

      return {
        success: true,
        data: toChatNode(findNodeById(id)),
      };
    },

    async create(payload: {
      title: string;
      slug: string;
      prompt: string | null;
      answer_summary: string | null;
      evidence_excerpt: string | null;
      evidence_source: string | null;
      parent_id: number | null;
      display_order: number;
      is_active?: boolean;
    }): Promise<{ success: true; data: MockNodeListItem }> {
      await wait();

      const newNode: MockNodeRecord = {
        id: ++nodeIdSequence,
        title: payload.title,
        slug: payload.slug,
        prompt: payload.prompt,
        answer_summary: payload.answer_summary,
        evidence_excerpt: payload.evidence_excerpt,
        evidence_source: payload.evidence_source,
        parent_id: payload.parent_id,
        display_order: payload.display_order,
        is_active: payload.is_active ?? true,
      };

      mockNodes = [...mockNodes, newNode];

      return {
        success: true,
        data: toNodeListItem(newNode),
      };
    },

    async update(
      id: number,
      payload: Partial<MockNodeRecord>,
    ): Promise<{ success: true; data: MockNodeListItem }> {
      await wait();

      const current = findNodeById(id);
      const next: MockNodeRecord = {
        ...current,
        ...payload,
        id: current.id,
        parent_id: current.parent_id,
      };

      mockNodes = mockNodes.map(node => (node.id === id ? next : node));

      return {
        success: true,
        data: toNodeListItem(next),
      };
    },

    async remove(id: number): Promise<void> {
      await wait();

      if (mockNodes.some(node => node.parent_id === id)) {
        throw new Error("Remova os filhos antes de excluir este no.");
      }

      mockNodes = mockNodes.filter(node => node.id !== id);
    },
  },

  users: {
    async list(params: { page?: number; limit?: number } = {}) {
      await wait();

      const ordered = mockUsers
        .slice()
        .sort((left, right) => right.created_at.localeCompare(left.created_at));

      return paginate(ordered, params.page, params.limit);
    },

    async create(payload: {
      name: string;
      email: string;
      role: "SECRETARIA";
    }): Promise<{ success: true; data: MockAdminUser }> {
      await wait();

      const createdUser: MockAdminUser = {
        id: ++userIdSequence,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        created_at: new Date().toISOString(),
      };

      mockUsers = [createdUser, ...mockUsers];

      return {
        success: true,
        data: createdUser,
      };
    },

    async remove(id: number): Promise<void> {
      await wait();
      mockUsers = mockUsers.filter(user => user.id !== id);
    },
  },

  questions: {
    async list(params: {
      status?: InquiryStatus;
      page?: number;
      limit?: number;
    } = {}): Promise<PaginatedResponse<QuestionResponseDTO>> {
      await wait();

      const filtered = mockQuestions
        .filter(question =>
          params.status ? question.status === params.status : true,
        )
        .slice()
        .sort((left, right) => right.created_at.localeCompare(left.created_at));

      return paginate(filtered, params.page, params.limit);
    },

    async updateStatus(
      id: number,
      status: InquiryStatus,
    ): Promise<QuestionResponseDTO> {
      await wait();

      const current = mockQuestions.find(question => question.id === id);

      if (!current) {
        throw new Error("Pergunta nao encontrada.");
      }

      const updatedQuestion = {
        ...current,
        status,
        updated_at: new Date().toISOString(),
      };

      mockQuestions = mockQuestions.map(question =>
        question.id === id ? updatedQuestion : question,
      );

      return updatedQuestion;
    },
  },

  logs: {
    async list(params: {
      flag?: Satisfaction;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    } = {}): Promise<PaginatedResponse<MockSessionLog>> {
      await wait();

      const filtered = mockLogs
        .filter(log => (params.flag ? log.flag === params.flag : true))
        .filter(log => isDateInRange(log.created_at, params.from, params.to))
        .slice()
        .sort((left, right) => right.created_at.localeCompare(left.created_at));

      return paginate(filtered, params.page, params.limit);
    },
  },
};
