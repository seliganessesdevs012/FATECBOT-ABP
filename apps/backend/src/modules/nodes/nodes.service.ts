import { db } from '../../config/database';
import { AppError } from '../../errors/AppError';
import { NodeListItemDTO, CreateNodeDTO, UpdateNodeDTO } from './nodes.types';
import { ChatNodeResponseDTO } from '../chatbot/chatbot.types';

export class NodesService {

      async listNodes(): Promise<NodeListItemDTO[]> {
            const nodes = await db.chatNode.findMany({
                  where: { is_active: true },
                  orderBy: [{ parent_id: 'asc' }, { display_order: 'asc' }],
                  select: {
                        id: true,
                        title: true,
                        slug: true,
                        parent_id: true,
                        display_order: true,
                        is_active: true,
                        _count: { select: { children: true } }
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
                              orderBy: { display_order: 'asc' },
                        },
                  },
            });

            if (!node) {
                  throw new AppError('Nó não encontrado', 404);
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
                  const parent = await db.chatNode.findUnique({ where: { id: dto.parent_id } });
                  if (!parent) {
                        throw new AppError('Nó pai não encontrado', 400);
                  }
            }

            const created = await db.chatNode.create({
                  data: {
                        title: dto.title,
                        slug: dto.slug,
                        prompt: dto.prompt ?? null,
                        answer_summary: dto.answer_summary ?? null,
                        evidence_excerpt: dto.evidence_excerpt ?? null,
                        evidence_source: dto.evidence_source ?? null,
                        parent_id: dto.parent_id ?? null,
                        display_order: dto.display_order,
                        is_active: dto.is_active ?? true,
                  },
            });

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
                  throw new AppError('Nó não encontrado', 404);
            }

            if (dto.parent_id !== undefined && dto.parent_id !== null) {
                  if (dto.parent_id === id) {
                        throw new AppError('Nó pai inválido', 400);
                  }
                  const parent = await db.chatNode.findUnique({ where: { id: dto.parent_id } });
                  if (!parent) {
                        throw new AppError('Nó pai não encontrado', 400);
                  }
            }

            const updated = await db.chatNode.update({
                  where: { id },
                  data: {
                        title: dto.title ?? existing.title,
                        slug: dto.slug ?? existing.slug,
                        prompt: dto.prompt ?? existing.prompt,
                        answer_summary: dto.answer_summary ?? existing.answer_summary,
                        evidence_excerpt: dto.evidence_excerpt ?? existing.evidence_excerpt,
                        evidence_source: dto.evidence_source ?? existing.evidence_source,
                        parent_id: dto.parent_id ?? existing.parent_id,
                        display_order: dto.display_order ?? existing.display_order,
                        is_active: dto.is_active ?? existing.is_active,
                  },
            });

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
                  throw new AppError('Nó não encontrado', 404);
            }

            const activeChildren = await db.chatNode.count({ where: { parent_id: id, is_active: true } });
            if (activeChildren > 0) {
                  throw new AppError('Nó possui filhos e não pode ser excluído', 409);
            }

            await db.chatNode.delete({ where: { id } });
      }
}