import { Prisma } from "@prisma/client";

import { db } from "../../config/database";
import { AppError } from "../../errors/AppError";
import { ChatNodeResponseDTO } from "../chatbot/chatbot.types";
import { removeNodeEvidencePdf, saveNodeEvidencePdf } from "./nodes.evidence";
import { CreateNodeDTO, NodeListItemDTO, UpdateNodeDTO } from "./nodes.types";

export class NodesService {
  private throwMappedPrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        "Ja existe um no com este slug. Escolha outro identificador.",
        409,
      );
    }

    throw error;
  }

  async listNodes(): Promise<NodeListItemDTO[]> {
    const nodes = await db.chatNode.findMany({
      where: { is_active: true },
      orderBy: [{ parent_id: "asc" }, { display_order: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        parent_id: true,
        display_order: true,
        is_active: true,
        _count: { select: { children: true } },
      },
    });

    return nodes.map((node: any) => ({
      id: node.id,
      title: node.title,
      slug: node.slug,
      parent_id: node.parent_id ?? null,
      display_order: node.display_order,
      is_active: node.is_active,
      childrenCount: node._count?.children ?? 0,
    }));
  }

  async getNodeById(id: number): Promise<ChatNodeResponseDTO> {
    const node = await db.chatNode.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { display_order: "asc" },
        },
      },
    });

    if (!node) {
      throw new AppError("No nao encontrado.", 404);
    }

    const formattedChildren = (node.children ?? []).map((child: any) => ({
      id: child.id,
      title: child.title,
      slug: child.slug,
      display_order: child.display_order,
    }));

    return {
      id: node.id,
      title: node.title,
      slug: node.slug,
      prompt: node.prompt ?? null,
      answer_summary: node.answer_summary ?? null,
      evidence_excerpt: node.evidence_excerpt ?? null,
      evidence_source: node.evidence_source ?? null,
      parent_id: node.parent_id ?? null,
      display_order: node.display_order,
      is_active: node.is_active,
      children: formattedChildren,
    } as ChatNodeResponseDTO;
  }

  async createNode(dto: CreateNodeDTO): Promise<NodeListItemDTO> {
    if (dto.parent_id !== null && dto.parent_id !== undefined) {
      const parent = await db.chatNode.findUnique({
        where: { id: dto.parent_id },
      });

      if (!parent) {
        throw new AppError("No pai nao encontrado.", 400);
      }
    }

    const evidenceSource =
      dto.evidence_file_name?.trim() || (dto.evidence_source ?? null);

    const created = await db.chatNode
      .create({
        data: {
          title: dto.title,
          slug: dto.slug,
          prompt: dto.prompt ?? null,
          answer_summary: dto.answer_summary ?? null,
          evidence_excerpt: dto.evidence_excerpt ?? null,
          evidence_source: evidenceSource,
          parent_id: dto.parent_id ?? null,
          display_order: dto.display_order,
          is_active: dto.is_active ?? true,
        },
      })
      .catch(error => this.throwMappedPrismaError(error));

    if (
      created &&
      dto.evidence_file_name &&
      dto.evidence_file_mime_type &&
      dto.evidence_file_data
    ) {
      try {
        await saveNodeEvidencePdf({
          nodeId: created.id,
          fileName: dto.evidence_file_name,
          mimeType: dto.evidence_file_mime_type,
          fileData: dto.evidence_file_data,
        });
      } catch (error) {
        await db.chatNode.delete({ where: { id: created.id } }).catch(() => undefined);
        throw error;
      }
    }

    return {
      id: created.id,
      title: created.title,
      slug: created.slug,
      parent_id: created.parent_id ?? null,
      display_order: created.display_order,
      is_active: created.is_active,
      childrenCount: 0,
    } as NodeListItemDTO;
  }

  async updateNode(id: number, dto: UpdateNodeDTO): Promise<NodeListItemDTO> {
    const existing = await db.chatNode.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError("No nao encontrado.", 404);
    }

    if (dto.parent_id !== undefined && dto.parent_id !== null) {
      if (dto.parent_id === id) {
        throw new AppError("No pai invalido.", 400);
      }

      const parent = await db.chatNode.findUnique({
        where: { id: dto.parent_id },
      });

      if (!parent) {
        throw new AppError("No pai nao encontrado.", 400);
      }
    }

    const nextEvidenceSource = dto.evidence_file_name?.trim()
      ? dto.evidence_file_name.trim()
      : dto.evidence_source !== undefined
        ? dto.evidence_source
        : existing.evidence_source;

    const updated = await db.chatNode
      .update({
        where: { id },
        data: {
          title: dto.title ?? existing.title,
          slug: dto.slug ?? existing.slug,
          prompt: dto.prompt !== undefined ? dto.prompt : existing.prompt,
          answer_summary:
            dto.answer_summary !== undefined
              ? dto.answer_summary
              : existing.answer_summary,
          evidence_excerpt:
            dto.evidence_excerpt !== undefined
              ? dto.evidence_excerpt
              : existing.evidence_excerpt,
          evidence_source: nextEvidenceSource,
          parent_id:
            dto.parent_id !== undefined ? dto.parent_id : existing.parent_id,
          display_order: dto.display_order ?? existing.display_order,
          is_active: dto.is_active ?? existing.is_active,
        },
      })
      .catch(error => this.throwMappedPrismaError(error));

    if (
      dto.evidence_file_name &&
      dto.evidence_file_mime_type &&
      dto.evidence_file_data
    ) {
      await saveNodeEvidencePdf({
        nodeId: id,
        fileName: dto.evidence_file_name,
        mimeType: dto.evidence_file_mime_type,
        fileData: dto.evidence_file_data,
      });
    } else if (dto.evidence_source === null) {
      await removeNodeEvidencePdf(id).catch(() => undefined);
    }

    const childrenCount = await db.chatNode.count({ where: { parent_id: id } });

    return {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      parent_id: updated.parent_id ?? null,
      display_order: updated.display_order,
      is_active: updated.is_active,
      childrenCount,
    } as NodeListItemDTO;
  }

  async deleteNode(id: number): Promise<void> {
    const existing = await db.chatNode.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError("No nao encontrado.", 404);
    }

    const activeChildren = await db.chatNode.count({
      where: { parent_id: id, is_active: true },
    });

    if (activeChildren > 0) {
      throw new AppError("No possui filhos e nao pode ser excluido.", 409);
    }

    await db.chatNode.delete({ where: { id } });
    await removeNodeEvidencePdf(id).catch(() => undefined);
  }
}
