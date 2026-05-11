import {ColumnIconConfig, FlatNode} from './treetable.types';

export function getNodeIcon<T>(
  columnKey: string,
  node: FlatNode<T>,
  iconConfigs: ColumnIconConfig<T>[],
): string | null {
  const iconConfig = iconConfigs.find(config => config.columnKey === columnKey);
  if (!iconConfig) {
    return null;
  }

  const value = iconConfig.valueFormatter
    ? iconConfig.valueFormatter(node.data)
    : node.data[iconConfig.valueKey!];
  return iconConfig.iconMap.get(value) || null;
}

export function getNodeIconColor<T>(
  columnKey: string,
  node: FlatNode<T>,
  iconConfigs: ColumnIconConfig<T>[],
): string | null {
  const iconConfig = iconConfigs.find(config => config.columnKey === columnKey);
  if (!iconConfig?.colorMap) {
    return null;
  }

  const value = iconConfig.valueFormatter
    ? iconConfig.valueFormatter(node.data)
    : node.data[iconConfig.valueKey!];
  return iconConfig.colorMap.get(value) || null;
}
