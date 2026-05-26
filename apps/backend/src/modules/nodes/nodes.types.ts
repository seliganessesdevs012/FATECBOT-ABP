export interface CreateNodeDTO  {
      title: string;
      slug: string;
      prompt?: string | null;
      answer_summary?: string | null;
      evidence_excerpt?: string | null;
      evidence_source?: string | null;
      evidence_file_name?: string | null;
      evidence_file_mime_type?: string | null;
      evidence_file_data?: Uint8Array | null;
      parent_id: number | null;
      display_order: number;
      is_active?: boolean;
}
export interface UpdateNodeDTO {
      title?: string;
      slug?: string;
      prompt?: string | null;
      answer_summary?: string | null;
      evidence_excerpt?: string | null;
      evidence_source?: string | null;
      evidence_file_name?: string | null;
      evidence_file_mime_type?: string | null;
      evidence_file_data?: Uint8Array | null;
      parent_id?: number | null;
      display_order?: number;
      is_active?: boolean;
}

export interface NodeListItemDTO {
      id: number;
      title: string;
      slug: string;
      parent_id?: number | null;
      display_order: number;
      is_active: boolean;
      childrenCount: number;
}
