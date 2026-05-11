import {Injectable, signal} from '@angular/core';
import {FlatNode, TreeNode} from './treetable.types';
import {TreetableBaseService} from './treetable-base.service';

@Injectable()
export class TreetableNodeManager<T> {
  private readonly expandedNodeIds = signal<Set<number>>(new Set());
  private readonly loadedNodeIds = signal<Set<number>>(new Set());
  private readonly loadingNodes = signal<Set<number>>(new Set());
  private readonly nodeChildrenMap = new Map<number, TreeNode<T>[]>();

  isExpanded(nodeId: number): boolean {
    return this.expandedNodeIds().has(nodeId);
  }

  isLoading(nodeId: number): boolean {
    return this.loadingNodes().has(nodeId);
  }

  getExpandedNodeIds(): Set<number> {
    return this.expandedNodeIds();
  }

  getNodeChildren(nodeId: number): TreeNode<T>[] | undefined {
    return this.nodeChildrenMap.get(nodeId);
  }

  getNodeChildrenMap(): Map<number, TreeNode<T>[]> {
    return this.nodeChildrenMap;
  }

  async toggleNode(node: FlatNode<T>, service: TreetableBaseService<T>): Promise<void> {
    const isExpanded = this.isExpanded(node.id);

    if (!isExpanded && node.expandable) {
      const isLoaded = this.loadedNodeIds().has(node.id);

      if (!isLoaded) {
        this.loadingNodes.update(nodes => new Set(nodes).add(node.id));
        const children = await service.getChildren(node.data);

        this.nodeChildrenMap.set(node.id, children);
        this.loadedNodeIds.update(ids => new Set(ids).add(node.id));

        this.loadingNodes.update(nodes => {
          nodes.delete(node.id);
          return new Set(nodes);
        });
      }
    }

    this.expandedNodeIds.update(ids => {
      if (isExpanded) {
        ids.delete(node.id);
      } else {
        ids.add(node.id);
      }
      return new Set(ids);
    });
  }

  reset(): void {
    this.expandedNodeIds.set(new Set());
    this.loadingNodes.set(new Set());
    this.loadedNodeIds.set(new Set());
    this.nodeChildrenMap.clear();
  }

  hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
