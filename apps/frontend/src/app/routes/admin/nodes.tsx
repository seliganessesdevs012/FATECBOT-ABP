import { useState } from "react";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { AdminLayout } from "@/components/layout/AdminLayout";
import type { NodeListItemDTO } from "@/features/admin/api/nodes.api";
import NodeInspector, {
  type NodeInspectorState,
} from "@/features/admin/components/NodeInspector";
import NodeTree from "@/features/admin/components/NodeTree";
import { useNodes } from "@/features/admin/hooks/useNodes";
import { getApiErrorMessage } from "@/lib/api-feedback";

const buildParentNode = (
  nodes: NodeListItemDTO[],
  nodeId: number,
): NodeListItemDTO | null => {
  const currentNode = nodes.find(node => node.id === nodeId) ?? null;

  if (!currentNode || currentNode.parent_id === null) {
    return null;
  }

  return nodes.find(node => node.id === currentNode.parent_id) ?? null;
};

export default function AdminNodesPage() {
  const { nodes, deleteNode, isLoading } = useNodes();
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [inspectorState, setInspectorState] = useState<NodeInspectorState>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{
    variant: "info" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleDeleteNode = async (node: NodeListItemDTO) => {
    if (node.childrenCount > 0 || isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      `Remover o nó "${node.title}"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const parentNode = buildParentNode(nodes, node.id);

      await deleteNode(node.id);
      setSelectedNodeId(parentNode?.id ?? null);
      setInspectorState(null);
      setFeedback({
        variant: "info",
        title: "Nó removido",
        message: `O nó "${node.title}" foi removido com sucesso.`,
      });
    } catch (error) {
      setFeedback({
        variant: "error",
        title: "Não foi possível remover o nó",
        message: getApiErrorMessage(
          error,
          "Tente novamente em instantes.",
        ),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Care"
      hidePageHeader
      contentClassName="pt-0"
      containerClassName="max-w-[1480px]"
    >
      {feedback ? (
        <div className="px-5 pt-5 lg:px-8">
          <ErrorAlert
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
            dismissible
            onDismiss={() => setFeedback(null)}
          />
        </div>
      ) : null}

      <NodeTree
        selectedNodeId={selectedNodeId}
        onSelectNode={node => setSelectedNodeId(node.id)}
        onDeleteNode={node => {
          void handleDeleteNode(node);
        }}
        onInspectNode={node => {
          setSelectedNodeId(node.id);
          setInspectorState({
            mode: "view",
            nodeId: node.id,
          });
        }}
        onCreateNode={parentNode => {
          setSelectedNodeId(parentNode?.id ?? null);
          setInspectorState({
            mode: "create",
            parentNode,
          });
        }}
      />

      <NodeInspector
        nodes={nodes}
        state={inspectorState}
        isDeleting={isDeleting || isLoading}
        onNodeSaved={message => {
          setFeedback({
            variant: "info",
            title: "Alterações salvas",
            message,
          });
        }}
        onSelectNode={node => setSelectedNodeId(node.id)}
        onCreateNode={parentNode => {
          setSelectedNodeId(parentNode?.id ?? null);
          setInspectorState({
            mode: "create",
            parentNode,
          });
        }}
        onEditNode={node => {
          setSelectedNodeId(node.id);
          setInspectorState({
            mode: "edit",
            node,
          });
        }}
        onClose={() => setInspectorState(null)}
        onDeleteNode={node => {
          void handleDeleteNode(node);
        }}
      />
    </AdminLayout>
  );
}
