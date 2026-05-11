import {FlatNode, TreeNode} from './treetable.types';

export function flattenTree<T>(
  nodes: TreeNode<T>[],
  expandedNodeIds: Set<number>,
  nodeChildrenMap: Map<number, TreeNode<T>[]>,
  hashFn: (str: string) => number,
  level = 0,
  parentPath = '',
): FlatNode<T>[] {
  let flatNodes: FlatNode<T>[] = [];

  nodes.forEach((node, index) => {
    const currentPath = parentPath ? `${parentPath}-${index}` : `${index}`;
    const nodeId = hashFn(currentPath);

    const flatNode: FlatNode<T> = {
      data: node.data,
      level: level,
      expandable: !!node.children,
      id: nodeId,
    };

    flatNodes.push(flatNode);

    const dynamicChildren = nodeChildrenMap.get(nodeId);
    const childrenToProcess = dynamicChildren || node.children;

    if (childrenToProcess && expandedNodeIds.has(nodeId)) {
      flatNodes = flatNodes.concat(
        flattenTree(childrenToProcess, expandedNodeIds, nodeChildrenMap, hashFn, level + 1, currentPath),
      );
    }
  });

  return flatNodes;
}

export function isNodeVisible<T>(
  node: FlatNode<T>,
  flatNodes: FlatNode<T>[],
  expandedNodeIds: Set<number>,
): boolean {
  if (node.level === 0) {
    return true;
  }

  let parent = getParentNode(node, flatNodes);
  while (parent) {
    if (!expandedNodeIds.has(parent.id)) {
      return false;
    }
    parent = getParentNode(parent, flatNodes);
  }
  return true;
}

export function getParentNode<T>(node: FlatNode<T>, flatNodes: FlatNode<T>[]): FlatNode<T> | null {
  const nodeIndex = flatNodes.indexOf(node);
  for (let i = nodeIndex - 1; i >= 0; i--) {
    if (flatNodes[i].level === node.level - 1) {
      return flatNodes[i];
    }
  }
  return null;
}
