import { Request, Response, NextFunction } from 'express';
import { AppError } from "../../errors/AppError";
import { findNodeEvidencePdf } from "../nodes/nodes.evidence";
import { ChatbotService } from './chatbot.service';
import { CreateInteractionLogDTO } from './chatbot.types'; 

export class ChatbotController {
    async getRootNode(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const chatbotService = new ChatbotService();
            const rootNode = await chatbotService.getRootNode();
            response.status(200).json({ success: true, data: rootNode });
        } catch (error) {
            next(error);
        }
    }

    async getNodeById(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = request.params;
            const chatbotService = new ChatbotService();
            const node = await chatbotService.getNodeById(Number(id));
            response.status(200).json({ success: true, data: node });
        } catch (error) {
            next(error);
        }
    }

    async createInteractionLog(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { navigation_flow, node_id, flag, session_log_id } = request.body as CreateInteractionLogDTO;
            const chatbotService = new ChatbotService();
            const result = await chatbotService.createInteractionLog({
                navigation_flow,
                node_id,
                flag,
                session_log_id,
            });
            response.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async downloadEvidence(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const nodeId = Number(request.params.id);

            if (!Number.isInteger(nodeId) || nodeId <= 0) {
                throw new AppError("Identificador do no invalido.", 400);
            }

            const evidenceFile = await findNodeEvidencePdf(nodeId);

            if (!evidenceFile) {
                throw new AppError("Este no ainda nao possui PDF de evidencia salvo.", 404);
            }

            response.setHeader("Content-Type", "application/pdf");
            response.setHeader(
                "Content-Disposition",
                `inline; filename="${evidenceFile.originalFileName}"`,
            );
            response.sendFile(evidenceFile.filePath);
        } catch (error) {
            next(error);
        }
    }
}
