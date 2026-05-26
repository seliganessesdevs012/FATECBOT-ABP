import { Router } from 'express'

import authRoutes from '../modules/auth/auth.routes'
import chatbotRoutes from '../modules/chatbot/chatbot.routes'
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import questionsRoutes from '../modules/questions/questions.routes'
import logRoutes from "../modules/logs/logs.routes";
import nodesRoutes from '../modules/nodes/nodes.routes'
import usersRoutes from '../modules/users/users.routes'

const router: Router = Router()

router.use('/auth', authRoutes)
router.use('/', chatbotRoutes)
router.use("/dashboard", dashboardRoutes)
router.use('/questions', questionsRoutes)
router.use('/logs', logRoutes)
router.use('/nodes', nodesRoutes)
router.use('/users', usersRoutes)

export default router
