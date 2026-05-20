import { Router } from 'express'

import authRoutes from '../modules/auth/auth.routes'
import chatbotRoutes from '../modules/chatbot/chatbot.routes'
import questionsRoutes from '../modules/questions/questions.routes'
import logRoutes from "../modules/logs/logs.routes";



const router: Router = Router()

router.use('/auth', authRoutes)
router.use('/questions', questionsRoutes)
router.use("/logs", logRoutes);

// Chatbot segue o contrato: /nodes/* e /sessions/log direto em /api/v1
router.use('/', chatbotRoutes)

export default router

""