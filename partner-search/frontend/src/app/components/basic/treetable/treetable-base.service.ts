import {TreeNode} from './treetable.types';

export abstract class TreetableBaseService<T> {
  abstract getInitialTree(): Promise<TreeNode<T>[]>;

  abstract getChildren(nodeData: T): Promise<TreeNode<T>[]>;
}
