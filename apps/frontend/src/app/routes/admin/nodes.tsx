import { useMemo, useState } from "react";

import { AdminLayout } from "@/components/layout/AdminLayout";
import type { NodeListItemDTO } from "@/features/admin/api/nodes.api";
import NodeEditor from "@/features/admin/components/NodeEditor";
import NodeTree from "@/features/admin/components/NodeTree";

type EditorState =
  | { mode: "create"; parentNode: NodeListItemDTO | null }
  | { mode: "edit"; node: NodeListItemDTO };

export default function AdminNodesPage() {
  const [selectedNode, setSelectedNode] = useState<NodeListItemDTO | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  const selectedNodeId = useMemo(() => {
    if (editorState?.mode === "edit") {
      return editorState.node.id;
    }

    if (editorState?.mode === "create") {
      return editorState.parentNode?.id ?? selectedNode?.id ?? null;
    }

    return selectedNode?.id ?? null;
  }, [editorState, selectedNode]);

  return (
    <AdminLayout
      title="Caré"
      hidePageHeader
      contentClassName="pt-0"
    >
      <div className="space-y-4">
        <NodeTree
          className="min-w-0"
          selectedNodeId={selectedNodeId}
          onSelectNode={node => setSelectedNode(node)}
          onCreateNode={parentNode => {
            setSelectedNode(parentNode);
            setEditorState({
              mode: "create",
              parentNode,
            });
          }}
          onEditNode={node => {
            setSelectedNode(node);
            setEditorState({
              mode: "edit",
              node,
            });
          }}
        />
      </div>

      {editorState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[1px]">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-[#E4D9C7] bg-white p-5 shadow-[0_28px_70px_rgba(0,0,0,0.18)] lg:p-7">
            {editorState.mode === "create" ? (
              <NodeEditor
                parentNode={editorState.parentNode}
                className="border-none bg-transparent p-0 shadow-none"
                onCancel={() => setEditorState(null)}
                onSuccess={() => {
                  if (editorState.parentNode) {
                    setSelectedNode(editorState.parentNode);
                  }
                  setEditorState(null);
                }}
              />
            ) : null}

            {editorState.mode === "edit" ? (
              <NodeEditor
                nodeId={editorState.node.id}
                className="border-none bg-transparent p-0 shadow-none"
                onCancel={() => setEditorState(null)}
                onSuccess={() => {
                  setSelectedNode(editorState.node);
                  setEditorState(null);
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
