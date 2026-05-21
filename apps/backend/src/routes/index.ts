import { Router } from 'express'

import authRoutes from '../modules/auth/auth.routes'
import chatbotRoutes from '../modules/chatbot/chatbot.routes'
import questionsRoutes from '../modules/questions/questions.routes'
import logRoutes from "../modules/logs/logs.routes";
import nodesRoutes from '../modules/nodes/nodes.routes'
import usersRoutes from '../modules/users/users.routes'

const router: Router = Router()

router.use('/auth', authRoutes)
// Chatbot segue o contrato: /nodes/* e /sessions/log direto em /api/v1
// Essas rotas publicas precisam vir antes do modulo admin de /nodes
// para que /nodes/root e GET /nodes/:id nao caiam no authorize('ADMIN').
router.use('/', chatbotRoutes)
router.use('/questions', questionsRoutes)
router.use('/logs', logRoutes)
router.use('/nodes', nodesRoutes)
router.use('/users', usersRoutes)

export default router
