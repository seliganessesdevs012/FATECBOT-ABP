import { NodesService } from './nodes.service';
import { Request, Response, NextFunction } from 'express';

export class NodesController {
      private readonly nodesService: NodesService;
      constructor() { 
            this.nodesService = new NodesService();
      }

      async listNodes(req: Request, res: Response, next: NextFunction) {
            try {
                  const nodes = await this.nodesService.listNodes();
                  res.json({ "success": true, "data": nodes });
            } catch (error) {
                  next(error);
            }
      };
 
      async createNode(req: Request, res: Response, next: NextFunction) {
            try {
                  const newNode = await this.nodesService.createNode(req.body);
                  res.status(201).json({ "success": true, "data": newNode });
            } catch (error) {
                  next(error);
            }
      };
 
      async updateNode(req: Request, res: Response, next: NextFunction) {
            try {
                  const updatedNode = await this.nodesService.updateNode(Number(req.params.id), req.body);
                  res.json({ "success": true, "data": updatedNode });
            } catch (error) {
                  next(error);
            }
      };
      async deleteNode(req: Request, res: Response, next: NextFunction) {
            try {
                  const deletedNode = await this.nodesService.deleteNode(Number(req.params.id));
                  res.status(200).json({ "success": true, "data": null })
            } catch (error) {
                  next(error);
            }
      };
}