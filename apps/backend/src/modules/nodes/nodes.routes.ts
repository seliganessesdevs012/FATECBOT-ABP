import {Request, Response, NextFunction, Router} from 'express';
import { NodesController } from './nodes.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { authorize } from '@/middlewares/rbac.middleware';
import {z} from 'zod';
import { request } from 'node:http';

const router: Router = Router();
const controller = new NodesController();

router.use(authenticate);
router.use(authorize('ADMIN'));

const createNodeSchema = z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      prompt: z.string().nullable().optional(),
      answer_summary: z.string().nullable().optional(),
      evidence_excerpt: z.string().nullable().optional(),
      evidence_source: z.string().nullable().optional(),
      parent_id: z.number().nullable().optional(),
      display_order: z.number(),
      is_active: z.boolean().optional(),
});

function validateCreateNode(req: Request, res: Response, next: NextFunction) {
      try {
            req.body = createNodeSchema.parse(req.body);
            next();
      } catch (error) {
            next(error); // Deixa o middleware de erro do Express tratar
      }
}

const updateNodeSchema = createNodeSchema.partial();
function validateUpdateNode(req: Request, res: Response, next: NextFunction) {
      try {
            req.body = updateNodeSchema.parse(req.body);
            next();
      } catch (error) {
            next(error);
      }
}

router.get('/', (req, res, next) => controller.listNodes(req, res, next));
router.post('/', validateCreateNode,(req, res, next) => controller.createNode(req, res, next));
router.patch('/:id', validateUpdateNode, (req, res, next) => controller.updateNode(req, res, next));
router.delete('/:id', (req, res, next) => controller.deleteNode(req, res, next)); 


export default router;
