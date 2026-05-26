import "dotenv/config";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import { Pool } from "pg";
import {
  removeNodeEvidencePdf,
  saveNodeEvidencePdf,
} from "../src/modules/nodes/nodes.evidence";

type LegacyNodeSeed = {
  parentSlug: string | null;
  title: string;
  slug: string;
  prompt: string | null;
  answerSummary: string | null;
  evidenceExcerpt: string | null;
  evidenceSource: string | null;
  displayOrder: number;
  isActive: boolean;
};

type DemoSessionSeed = {
  seedTag: string;
  navigationFlow: string[];
  flag: "ATENDEU" | "NAO_ATENDEU";
  ageInHours: number;
};

type DemoQuestionSeed = {
  requesterName: string;
  requesterEmail: string;
  question: string;
  status: "ABERTA" | "RESPONDIDA";
  ageInHours: number;
  sessionSeedTag: string | null;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL nao definida. Configure o arquivo .env antes de executar o seed.",
  );
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_SQL_SEED_PATH = path.join(
  __dirname,
  "migrations",
  "20260404001330_init",
  "02_seed.sql",
);
const SNAPSHOT_JSON_SEED_PATH = path.join(
  __dirname,
  "seed-data",
  "chat-nodes.snapshot.json",
);
const NODE_EVIDENCE_ASSET_DIR = path.join(
  __dirname,
  "seed-assets",
  "node-evidence",
);

const USER_SEEDS = [
  {
    name: "Administrador",
    email: "admin@fatec.sp.gov.br",
    password: "Admin@123",
    role: "ADMIN",
  },
  {
    name: "Secretaria Academica",
    email: "secretaria@fatec.sp.gov.br",
    password: "Secretaria@123",
    role: "SECRETARIA",
  },
] as const;

const USER_DEMO_SEEDS = [
  {
    name: "Carlos Menezes",
    email: "carlos.menezes@fatec.sp.gov.br",
    password: "Fatec@123",
    role: "ADMIN",
  },
  {
    name: "Fernanda Costa",
    email: "fernanda.costa@fatec.sp.gov.br",
    password: "Fatec@123",
    role: "ADMIN",
  },
  {
    name: "Juliana Prado",
    email: "juliana.prado@fatec.sp.gov.br",
    password: "Fatec@123",
    role: "ADMIN",
  },
  {
    name: "Marina Souza",
    email: "marina.souza@fatec.sp.gov.br",
    password: "Fatec@123",
    role: "SECRETARIA",
  },
  {
    name: "Bianca Ramos",
    email: "bianca.ramos@fatec.sp.gov.br",
    password: "Fatec@123",
    role: "SECRETARIA",
  },
  {
    name: "Paulo Nogueira",
    email: "paulo.nogueira@fatec.sp.gov.br",
    password: "Fatec@123",
    role: "SECRETARIA",
  },
] as const;

const DEMO_SESSION_SEEDS: DemoSessionSeed[] = [
  {
    seedTag: "demo-session-dsm-aacc",
    navigationFlow: ["dsm", "dsm-aacc"],
    flag: "ATENDEU",
    ageInHours: 6,
  },
  {
    seedTag: "demo-session-dsm-estagio-inicio",
    navigationFlow: ["dsm", "dsm-estagio", "dsm-estagio-inicio"],
    flag: "ATENDEU",
    ageInHours: 22,
  },
  {
    seedTag: "demo-session-dsm-estagio-comprovacao",
    navigationFlow: ["dsm", "dsm-estagio", "dsm-estagio-comprovacao"],
    flag: "NAO_ATENDEU",
    ageInHours: 34,
  },
  {
    seedTag: "demo-session-dsm-horario",
    navigationFlow: [
      "dsm",
      "dsm-horario-aulas",
      "dsm-horario-aulas-3-semestre",
    ],
    flag: "ATENDEU",
    ageInHours: 51,
  },
  {
    seedTag: "demo-session-geo-estagio",
    navigationFlow: ["geo", "geo-estagio", "geo-estagio-duracao"],
    flag: "ATENDEU",
    ageInHours: 74,
  },
  {
    seedTag: "demo-session-geo-datas",
    navigationFlow: ["geo", "geo-datas-importantes"],
    flag: "NAO_ATENDEU",
    ageInHours: 96,
  },
  {
    seedTag: "demo-session-marh-dispensa",
    navigationFlow: [
      "marh",
      "marh-dispensa",
      "marh-dispensa-proficiencia-ingles",
    ],
    flag: "ATENDEU",
    ageInHours: 118,
  },
  {
    seedTag: "demo-session-nao-aluno-ingresso",
    navigationFlow: ["nao-sou-aluno", "nao-aluno-ingresso"],
    flag: "ATENDEU",
    ageInHours: 142,
  },
  {
    seedTag: "demo-session-nao-aluno-matricula",
    navigationFlow: ["nao-sou-aluno", "nao-aluno-matricula"],
    flag: "ATENDEU",
    ageInHours: 188,
  },
  {
    seedTag: "demo-session-marh-estagio",
    navigationFlow: ["marh", "marh-estagio", "marh-estagio-equiparacao"],
    flag: "NAO_ATENDEU",
    ageInHours: 260,
  },
];

const DEMO_QUESTION_SEEDS: DemoQuestionSeed[] = [
  {
    requesterName: "Ana Paula Lima",
    requesterEmail: "demo.ana.lima@fatec.sp.gov.br",
    question:
      "Nao entendi quais documentos preciso levar para comprovar o estagio.",
    status: "ABERTA",
    ageInHours: 30,
    sessionSeedTag: "demo-session-dsm-estagio-comprovacao",
  },
  {
    requesterName: "Bruno Henrique Alves",
    requesterEmail: "demo.bruno.alves@fatec.sp.gov.br",
    question:
      "Gostaria de confirmar se a carga horaria minima do estagio pode ser cumprida em menos meses.",
    status: "RESPONDIDA",
    ageInHours: 40,
    sessionSeedTag: "demo-session-geo-estagio",
  },
  {
    requesterName: "Camila Rodrigues",
    requesterEmail: "demo.camila.rodrigues@fatec.sp.gov.br",
    question:
      "As datas importantes do semestre ja incluem o prazo final para rematricula?",
    status: "ABERTA",
    ageInHours: 92,
    sessionSeedTag: "demo-session-geo-datas",
  },
  {
    requesterName: "Diego Martins",
    requesterEmail: "demo.diego.martins@fatec.sp.gov.br",
    question:
      "Nao localizei a lista completa de documentos para a matricula de ingressantes.",
    status: "RESPONDIDA",
    ageInHours: 137,
    sessionSeedTag: "demo-session-nao-aluno-matricula",
  },
  {
    requesterName: "Eduarda Ferreira",
    requesterEmail: "demo.eduarda.ferreira@fatec.sp.gov.br",
    question:
      "Existe algum procedimento diferente para aproveitamento por proficiencia em ingles?",
    status: "ABERTA",
    ageInHours: 112,
    sessionSeedTag: "demo-session-marh-dispensa",
  },
  {
    requesterName: "Felipe Santos",
    requesterEmail: "demo.felipe.santos@fatec.sp.gov.br",
    question:
      "Meu atendimento travou antes de mostrar as opcoes finais do estagio. Podem me ajudar?",
    status: "ABERTA",
    ageInHours: 12,
    sessionSeedTag: "demo-session-marh-estagio",
  },
  {
    requesterName: "Gabriela Vieira",
    requesterEmail: "demo.gabriela.vieira@fatec.sp.gov.br",
    question:
      "Quero falar com a secretaria sobre emissao de declaracao, mesmo sem ter passado pelo chatbot.",
    status: "RESPONDIDA",
    ageInHours: 18,
    sessionSeedTag: null,
  },
];

const TG_TCC_SLUG_OVERRIDES = new Map<string, string>([
  ["dsm|Trabalho de GraduaÃ§Ã£o (TG/TCC)|dsm-portfolio", "dsm-tg-tcc"],
  ["geo|Trabalho de GraduaÃ§Ã£o (TG/TCC)|geo-portfolio", "geo-tg-tcc"],
  ["marh|Trabalho de GraduaÃ§Ã£o (TG/TCC)|marh-portfolio", "marh-tg-tcc"],
]);

const DEACTIVATE_SLUGS = [
  "dsm-dispensa-extensao",
  "geo-dispensa-extensao",
  "marh-dispensa-extensao",
];

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasSeedTag(
  feedbackHistory: unknown,
  seedTags: ReadonlySet<string>,
): boolean {
  if (!Array.isArray(feedbackHistory)) {
    return false;
  }

  return feedbackHistory.some((entry) => {
    if (!isObjectRecord(entry)) {
      return false;
    }

    return (
      entry.source === "seed" &&
      typeof entry.seed_tag === "string" &&
      seedTags.has(entry.seed_tag)
    );
  });
}

function normalizeLegacySlug(parentSlug: string | null, title: string, slug: string) {
  const overrideKey = `${parentSlug ?? "null"}|${title}|${slug}`;
  const exactOverride = TG_TCC_SLUG_OVERRIDES.get(overrideKey);

  if (exactOverride) {
    return exactOverride;
  }

  if (
    (parentSlug === "dsm" || parentSlug === "geo" || parentSlug === "marh") &&
    slug.endsWith("portfolio") &&
    /Trabalho de Gradua/i.test(title)
  ) {
    return `${parentSlug}-tg-tcc`;
  }

  return slug;
}

function extractLegacySeedCalls(sql: string): string[] {
  const marker = "SELECT upsert_navigation_node(";
  const calls: string[] = [];

  let cursor = 0;
  while (cursor < sql.length) {
    const start = sql.indexOf(marker, cursor);
    if (start === -1) {
      break;
    }

    const argsStart = start + marker.length;
    let i = argsStart;
    let depth = 1;
    let inSingleQuote = false;
    let inDollarQuote: string | null = null;
    let closed = false;

    while (i < sql.length) {
      const char = sql[i];

      if (inDollarQuote) {
        if (sql.startsWith(inDollarQuote, i)) {
          i += inDollarQuote.length;
          inDollarQuote = null;
          continue;
        }

        i += 1;
        continue;
      }

      if (inSingleQuote) {
        if (char === "'" && sql[i + 1] === "'") {
          i += 2;
          continue;
        }

        if (char === "'") {
          inSingleQuote = false;
        }

        i += 1;
        continue;
      }

      if (char === "$") {
        let end = i + 1;
        while (end < sql.length && /[A-Za-z0-9_]/.test(sql[end])) {
          end += 1;
        }

        if (end < sql.length && sql[end] === "$") {
          inDollarQuote = sql.slice(i, end + 1);
          i = end + 1;
          continue;
        }
      }

      if (char === "'") {
        inSingleQuote = true;
        i += 1;
        continue;
      }

      if (char === "(") {
        depth += 1;
        i += 1;
        continue;
      }

      if (char === ")") {
        depth -= 1;
        if (depth === 0) {
          const args = sql.slice(argsStart, i);
          calls.push(args);

          const semicolonIndex = sql.indexOf(";", i);
          cursor = semicolonIndex === -1 ? i + 1 : semicolonIndex + 1;
          closed = true;
          break;
        }
      }

      i += 1;
    }

    if (!closed) {
      throw new Error(
        "Nao foi possivel encontrar o fechamento de uma chamada upsert_navigation_node no seed legado.",
      );
    }
  }

  if (calls.length === 0) {
    throw new Error(
      "Nenhuma chamada de upsert_navigation_node foi encontrada no seed legado.",
    );
  }

  return calls;
}

function splitTopLevelArgs(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDollarQuote: string | null = null;
  let parenthesisDepth = 0;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (inDollarQuote) {
      if (value.startsWith(inDollarQuote, i)) {
        current += inDollarQuote;
        i += inDollarQuote.length - 1;
        inDollarQuote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (inSingleQuote) {
      current += char;

      if (char === "'" && value[i + 1] === "'") {
        current += "'";
        i += 1;
        continue;
      }

      if (char === "'") {
        inSingleQuote = false;
      }
      continue;
    }

    if (char === "$") {
      let end = i + 1;
      while (end < value.length && /[A-Za-z0-9_]/.test(value[end])) {
        end += 1;
      }

      if (end < value.length && value[end] === "$") {
        const delimiter = value.slice(i, end + 1);
        inDollarQuote = delimiter;
        current += delimiter;
        i = end;
        continue;
      }
    }

    if (char === "'") {
      inSingleQuote = true;
      current += char;
      continue;
    }

    if (char === "(") {
      parenthesisDepth += 1;
      current += char;
      continue;
    }

    if (char === ")") {
      parenthesisDepth -= 1;
      current += char;
      continue;
    }

    if (char === "," && parenthesisDepth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function parseSqlLiteral(input: string): string | number | boolean | null {
  const value = input.trim();

  if (/^NULL$/i.test(value)) {
    return null;
  }

  if (/^TRUE$/i.test(value)) {
    return true;
  }

  if (/^FALSE$/i.test(value)) {
    return false;
  }

  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }

  if (value.startsWith("$$") && value.endsWith("$$")) {
    return value.slice(2, -2);
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  throw new Error(`Literal SQL nao suportado no parser: ${value.slice(0, 80)}`);
}

function parseLegacyNodeSeed(callArgs: string): LegacyNodeSeed {
  const args = splitTopLevelArgs(callArgs).map(parseSqlLiteral);

  if (args.length !== 9) {
    throw new Error(
      `Esperados 9 argumentos no upsert_navigation_node; recebido ${args.length}.`,
    );
  }

  const [
    parentSlug,
    title,
    slug,
    prompt,
    answerSummary,
    evidenceExcerpt,
    evidenceSource,
    displayOrder,
    isActive,
  ] = args;

  if (typeof title !== "string" || typeof slug !== "string") {
    throw new Error("Titulo e slug devem ser strings no seed legado.");
  }

  if (typeof displayOrder !== "number") {
    throw new Error(`display_order invalido para slug ${slug}.`);
  }

  if (typeof isActive !== "boolean") {
    throw new Error(`is_active invalido para slug ${slug}.`);
  }

  const normalizedSlug = normalizeLegacySlug(
    typeof parentSlug === "string" ? parentSlug : null,
    title,
    slug,
  );

  return {
    parentSlug: typeof parentSlug === "string" ? parentSlug : null,
    title,
    slug: normalizedSlug,
    prompt: typeof prompt === "string" ? prompt : null,
    answerSummary: typeof answerSummary === "string" ? answerSummary : null,
    evidenceExcerpt:
      typeof evidenceExcerpt === "string" ? evidenceExcerpt : null,
    evidenceSource: typeof evidenceSource === "string" ? evidenceSource : null,
    displayOrder,
    isActive,
  };
}

function ensureUniqueSlugs(nodes: LegacyNodeSeed[]): void {
  const seen = new Set<string>();

  for (const node of nodes) {
    if (seen.has(node.slug)) {
      throw new Error(
        `Slug duplicado encontrado apos normalizacao: ${node.slug}`,
      );
    }
    seen.add(node.slug);
  }
}

async function upsertSeedUsers(): Promise<void> {
  for (const user of [...USER_SEEDS, ...USER_DEMO_SEEDS]) {
    const passwordHash = await argon2.hash(user.password, ARGON2_OPTIONS);

    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        password_hash: passwordHash,
      },
      update: {
        name: user.name,
        role: user.role,
        password_hash: passwordHash,
      },
    });
  }
}

async function upsertSeedNodes(nodes: LegacyNodeSeed[]): Promise<void> {
  let pendingNodes = [...nodes];

  while (pendingNodes.length > 0) {
    let progressed = false;
    const nextPending: LegacyNodeSeed[] = [];

    for (const node of pendingNodes) {
      let parentId: number | null = null;

      if (node.parentSlug) {
        const parent = await prisma.chatNode.findUnique({
          where: { slug: node.parentSlug },
          select: { id: true },
        });

        if (!parent) {
          nextPending.push(node);
          continue;
        }

        parentId = parent.id;
      }

      await prisma.chatNode.upsert({
        where: { slug: node.slug },
        create: {
          parent_id: parentId,
          title: node.title,
          slug: node.slug,
          prompt: node.prompt,
          answer_summary: node.answerSummary,
          evidence_excerpt: node.evidenceExcerpt,
          evidence_source: node.evidenceSource,
          display_order: node.displayOrder,
          is_active: node.isActive,
        },
        update: {
          parent_id: parentId,
          title: node.title,
          prompt: node.prompt,
          answer_summary: node.answerSummary,
          evidence_excerpt: node.evidenceExcerpt,
          evidence_source: node.evidenceSource,
          display_order: node.displayOrder,
          is_active: node.isActive,
        },
      });

      progressed = true;
    }

    if (!progressed) {
      const unresolvedParents = nextPending
        .map((node) => `${node.slug} -> ${node.parentSlug}`)
        .join(", ");

      throw new Error(
        `Nao foi possivel resolver a hierarquia dos nos do seed. Relacoes pendentes: ${unresolvedParents}.`,
      );
    }

    pendingNodes = nextPending;
  }

  await prisma.chatNode.updateMany({
    where: { slug: { in: DEACTIVATE_SLUGS } },
    data: { is_active: false },
  });
}

function parseSnapshotNodeSeed(input: unknown): LegacyNodeSeed {
  if (typeof input !== "object" || input === null) {
    throw new Error("Cada no do snapshot deve ser um objeto.");
  }

  const node = input as Record<string, unknown>;

  if (typeof node.title !== "string" || typeof node.slug !== "string") {
    throw new Error("Todo no do snapshot precisa conter title e slug.");
  }

  if (typeof node.displayOrder !== "number" || typeof node.isActive !== "boolean") {
    throw new Error(
      `No invalido no snapshot (${node.slug}). displayOrder e isActive sao obrigatorios.`,
    );
  }

  return {
    parentSlug: typeof node.parentSlug === "string" ? node.parentSlug : null,
    title: node.title,
    slug: node.slug,
    prompt: typeof node.prompt === "string" ? node.prompt : null,
    answerSummary:
      typeof node.answerSummary === "string" ? node.answerSummary : null,
    evidenceExcerpt:
      typeof node.evidenceExcerpt === "string" ? node.evidenceExcerpt : null,
    evidenceSource:
      typeof node.evidenceSource === "string" ? node.evidenceSource : null,
    displayOrder: node.displayOrder,
    isActive: node.isActive,
  };
}

async function loadSeedNodes(): Promise<LegacyNodeSeed[]> {
  try {
    const snapshotRaw = await readFile(SNAPSHOT_JSON_SEED_PATH, "utf8");
    const snapshotContent = snapshotRaw.replace(/^\uFEFF/, "");
    const parsed = JSON.parse(snapshotContent) as unknown;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("O snapshot de nos esta vazio ou invalido.");
    }

    return parsed.map(parseSnapshotNodeSeed);
  } catch (error) {
    const errorWithCode = error as NodeJS.ErrnoException;

    if (errorWithCode?.code !== "ENOENT") {
      throw error;
    }

    const legacySql = await readFile(LEGACY_SQL_SEED_PATH, "utf8");
    const nodeCalls = extractLegacySeedCalls(legacySql);
    return nodeCalls.map(parseLegacyNodeSeed);
  }
}

function isPdfEvidenceSource(value: string | null): value is string {
  return typeof value === "string" && value.toLowerCase().endsWith(".pdf");
}

async function syncSeedNodeEvidence(nodes: LegacyNodeSeed[]): Promise<number> {
  const persistedNodes = await prisma.chatNode.findMany({
    where: {
      slug: {
        in: [...new Set(nodes.map((node) => node.slug))],
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const nodeIdBySlug = new Map(
    persistedNodes.map((node) => [node.slug, node.id]),
  );

  let restoredPdfCount = 0;

  for (const node of nodes) {
    const nodeId = nodeIdBySlug.get(node.slug);

    if (!nodeId) {
      throw new Error(
        `Nao foi possivel sincronizar a evidencia do no '${node.slug}' porque ele nao foi persistido.`,
      );
    }

    if (!isPdfEvidenceSource(node.evidenceSource)) {
      await removeNodeEvidencePdf(nodeId).catch(() => undefined);
      continue;
    }

    const assetPath = path.join(NODE_EVIDENCE_ASSET_DIR, node.evidenceSource);
    await access(assetPath).catch(() => {
      throw new Error(
        `Arquivo de evidencia nao encontrado em seed-assets para o no '${node.slug}': ${node.evidenceSource}.`,
      );
    });

    const fileBuffer = await readFile(assetPath);

    await saveNodeEvidencePdf({
      nodeId,
      fileName: node.evidenceSource,
      mimeType: "application/pdf",
      fileData: new Uint8Array(fileBuffer),
    });

    restoredPdfCount += 1;
  }

  return restoredPdfCount;
}

async function reseedDemoSessionsAndQuestions(): Promise<{
  sessionCount: number;
  questionCount: number;
}> {
  const demoQuestionEmails = [
    ...new Set(DEMO_QUESTION_SEEDS.map((question) => question.requesterEmail)),
  ];

  if (demoQuestionEmails.length > 0) {
    await prisma.question.deleteMany({
      where: {
        requester_email: {
          in: demoQuestionEmails,
        },
      },
    });
  }

  const seedTags = new Set(
    DEMO_SESSION_SEEDS.map((session) => session.seedTag),
  );

  const existingLogs = await prisma.sessionLog.findMany({
    select: {
      id: true,
      feedback_history: true,
    },
  });

  const demoLogIds = existingLogs
    .filter((log) => hasSeedTag(log.feedback_history, seedTags))
    .map((log) => log.id);

  if (demoLogIds.length > 0) {
    await prisma.sessionLog.deleteMany({
      where: {
        id: {
          in: demoLogIds,
        },
      },
    });
  }

  const uniqueSlugs = [
    ...new Set(
      DEMO_SESSION_SEEDS.flatMap((session) => session.navigationFlow),
    ),
  ];

  const nodesBySlug = await prisma.chatNode.findMany({
    where: {
      slug: {
        in: uniqueSlugs,
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const nodeIdBySlug = new Map(nodesBySlug.map((node) => [node.slug, node.id]));

  if (nodeIdBySlug.size !== uniqueSlugs.length) {
    const missingSlugs = uniqueSlugs.filter((slug) => !nodeIdBySlug.has(slug));
    throw new Error(
      `Nao foi possivel criar os exemplos de sessao. Slugs ausentes: ${missingSlugs.join(", ")}.`,
    );
  }

  const sessionIdBySeedTag = new Map<string, number>();

  for (const session of DEMO_SESSION_SEEDS) {
    const createdAt = hoursAgo(session.ageInHours);
    const lastSlug = session.navigationFlow[session.navigationFlow.length - 1];
    const nodeId = nodeIdBySlug.get(lastSlug);

    if (!nodeId) {
      throw new Error(`Node_id nao encontrado para o slug final '${lastSlug}'.`);
    }

    const createdSession = await prisma.sessionLog.create({
      data: {
        navigation_flow: toJsonValue(session.navigationFlow),
        node_id: nodeId,
        flag: session.flag,
        created_at: createdAt,
        feedback_history: toJsonValue([
          {
            source: "seed",
            seed_tag: session.seedTag,
            node_id: nodeId,
            flag: session.flag,
            navigation_flow: session.navigationFlow,
            recorded_at: createdAt.toISOString(),
          },
        ]),
      },
    });

    sessionIdBySeedTag.set(session.seedTag, createdSession.id);
  }

  const questionIdsBySessionId = new Map<number, number[]>();

  for (const question of DEMO_QUESTION_SEEDS) {
    const createdAt = hoursAgo(question.ageInHours);
    const sessionId =
      question.sessionSeedTag == null
        ? null
        : sessionIdBySeedTag.get(question.sessionSeedTag) ?? null;

    if (question.sessionSeedTag && sessionId == null) {
      throw new Error(
        `Nao foi possivel vincular a pergunta ao seedTag '${question.sessionSeedTag}'.`,
      );
    }

    const createdQuestion = await prisma.question.create({
      data: {
        requester_name: question.requesterName,
        requester_email: question.requesterEmail,
        question: question.question,
        status: question.status,
        created_at: createdAt,
        updated_at: createdAt,
        session_log_id: sessionId,
      },
    });

    if (sessionId != null) {
      const currentQuestionIds = questionIdsBySessionId.get(sessionId) ?? [];
      currentQuestionIds.push(createdQuestion.id);
      questionIdsBySessionId.set(sessionId, currentQuestionIds);
    }
  }

  for (const [sessionId, questionIds] of questionIdsBySessionId.entries()) {
    await prisma.sessionLog.update({
      where: { id: sessionId },
      data: {
        inquiry_ids: toJsonValue(questionIds),
      },
    });
  }

  return {
    sessionCount: DEMO_SESSION_SEEDS.length,
    questionCount: DEMO_QUESTION_SEEDS.length,
  };
}

async function main(): Promise<void> {
  const parsedNodes = await loadSeedNodes();

  ensureUniqueSlugs(parsedNodes);

  await upsertSeedUsers();
  await upsertSeedNodes(parsedNodes);
  const restoredPdfCount = await syncSeedNodeEvidence(parsedNodes);
  const demoData = await reseedDemoSessionsAndQuestions();

  const expectedNodeCount = new Set(parsedNodes.map((node) => node.slug)).size;
  const persistedNodeCount = await prisma.chatNode.count({
    where: {
      slug: {
        in: [...new Set(parsedNodes.map((node) => node.slug))],
      },
    },
  });

  if (persistedNodeCount !== expectedNodeCount) {
    throw new Error(
      `Verificacao final falhou: esperado ${expectedNodeCount} nos, persistido ${persistedNodeCount}.`,
    );
  }

  const totalSeedUsers = USER_SEEDS.length + USER_DEMO_SEEDS.length;

  console.info(
    `Seed concluido com sucesso: ${totalSeedUsers} usuarios, ${expectedNodeCount} nos, ${restoredPdfCount} PDFs de evidencia, ${demoData.sessionCount} sessoes de exemplo e ${demoData.questionCount} tickets de exemplo.`,
  );
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
