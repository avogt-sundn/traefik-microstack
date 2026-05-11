export interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  isLoaded?: boolean;
}

export interface FlatNode<T> {
  data: T;
  level: number;
  expandable: boolean;
  id: number;
}

export interface ColumnIconConfig<T, V = T[keyof T]> {
  columnKey: string;
  valueKey?: keyof T;
  valueFormatter?: (data: T) => V;
  iconMap: Map<V, string>;
  colorMap: Map<V, string>;
}
