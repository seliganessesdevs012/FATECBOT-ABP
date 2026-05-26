import { NextFunction, Request, Response } from "express";

import { AppError } from "../../errors/AppError";
import { findNodeEvidencePdf } from "./nodes.evidence";
import { NodesService } from "./nodes.service";
import { CreateNodeDTO, UpdateNodeDTO } from "./nodes.types";

type NodeRequestBody = {
  title?: string;
  slug?: string;
  prompt?: string | null;
  answer_summary?: string | null;
  evidence_excerpt?: string | null;
  evidence_source?: string | null;
  evidence_file_name?: string | null;
  evidence_file_mime_type?: string | null;
  evidence_file_data?: string | null;
  parent_id?: number | null;
  display_order?: number;
  is_active?: boolean;
};

const toNodeDTO = (body: NodeRequestBody): CreateNodeDTO | UpdateNodeDTO => ({
  ...body,
  evidence_file_data: body.evidence_file_data
    ? new Uint8Array(Buffer.from(body.evidence_file_data, "base64"))
    : null,
});

export class NodesController {
  private readonly nodesService: NodesService;

  constructor() {
    this.nodesService = new NodesService();
  }

  async listNodes(req: Request, res: Response, next: NextFunction) {
    try {
      const nodes = await this.nodesService.listNodes();
      res.json({ success: true, data: nodes });
    } catch (error) {
      next(error);
    }
  }

  async createNode(
    req: Request<{}, any, NodeRequestBody>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const newNode = await this.nodesService.createNode(
        toNodeDTO(req.body) as CreateNodeDTO,
      );
      res.status(201).json({
        success: true,
        message: "No criado com sucesso.",
        data: newNode,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNode(
    req: Request<{ id: string }, any, NodeRequestBody>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const updatedNode = await this.nodesService.updateNode(
        Number(req.params.id),
        toNodeDTO(req.body) as UpdateNodeDTO,
      );
      res.json({
        success: true,
        message: "No atualizado com sucesso.",
        data: updatedNode,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNode(req: Request, res: Response, next: NextFunction) {
    try {
      await this.nodesService.deleteNode(Number(req.params.id));
      res.status(200).json({
        success: true,
        message: "No removido com sucesso.",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadEvidence(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const nodeId = Number(req.params.id);

      if (!Number.isInteger(nodeId) || nodeId <= 0) {
        throw new AppError("Identificador do no invalido.", 400);
      }

      const evidenceFile = await findNodeEvidencePdf(nodeId);

      if (!evidenceFile) {
        throw new AppError("Este no ainda nao possui PDF de evidencia salvo.", 404);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${evidenceFile.originalFileName}"`,
      );
      res.sendFile(evidenceFile.filePath);
    } catch (error) {
      next(error);
    }
  }
}
