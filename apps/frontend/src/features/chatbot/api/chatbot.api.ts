import { api } from "../../../lib/axios";
import { env } from "../../../config/env";
import type {
    ChatNode,
    SessionRatingPayload,
    SessionRatingResponse,
    QuestionPayload,
    SubmitQuestionPayload,
} from "../types/chatbot.types";
import type { ApiResponse } from "../../../types/api.types";


export async function getRootNode(){
    const res = await api.get<ApiResponse<ChatNode>>("/nodes/root");
    return res.data.data;
}

export async function getNodeById(id: number){
    const res = await api.get<ApiResponse<ChatNode>>(`/nodes/${id}`);
    return res.data.data;
}

export async function submitRating(payload: SessionRatingPayload){
    const res = await api.post<ApiResponse<SessionRatingResponse>>("/sessions/log", payload);
    return res.data.data
}

export async function submitQuestion(payload: SubmitQuestionPayload){
    const res = await api.post<ApiResponse<QuestionPayload>>("/questions", payload);
    return res.data.data;
}

export function getEvidenceUrl(nodeId: number){
    if (env.VITE_USE_MOCKS === "true") {
        return null;
    }

    return new URL(`/api/v1/nodes/${nodeId}/evidence`, env.VITE_API_URL).toString();
}

export const chatbotApi = {
    getRootNode,
    getNodeById,
    submitRating,
    submitQuestion,
    getEvidenceUrl
};
