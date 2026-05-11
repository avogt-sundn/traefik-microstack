/* eslint-disable */
import {Component, computed, effect, inject, input, OnChanges, output, signal, SimpleChanges} from '@angular/core';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatIcon} from "@angular/material/icon";
import {CommonModule} from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {TreetableBaseService} from './treetable-base.service';
import {ColumnIconConfig, FlatNode, TreeNode} from './treetable.types';
import {TreetableNodeManager} from './treetable-node-manager';
import {flattenTree, isNodeVisible} from './treetable-flatten.util';
import {getNodeIcon, getNodeIconColor} from './treetable-icon.util';
import {HighlightPipe} from '@traefik-microstack/shared';

@Component({
  selector: 'partner-treetable',
  imports: [
    MatTableModule,
    MatIcon,
    CommonModule,
    MatProgressSpinnerModule,
    HighlightPipe,
  ],
  templateUrl: './treetable.html',
  styleUrl: './treetable.scss',
  providers: [TreetableNodeManager],
})
export class Treetable<T> implements OnChanges {
  readonly treetableService = input.required<TreetableBaseService<T>>();
  readonly displayedColumns = input<{
    key: string;
    label: string;
  }[]>([{key: 'name', label: 'Name'}]);
  readonly treeColumn = input<string>('name');
  readonly iconConfigs = input<ColumnIconConfig<T>[]>([]);
  /** Terms to highlight in cell values (case-insensitive). */
  readonly highlightTerms = input<string[]>([]);

  readonly rowClick = output<FlatNode<T>>();

  dataSource: MatTableDataSource<FlatNode<T>>;

  private readonly nodeManager = inject(TreetableNodeManager<T>);

  private readonly nodes = signal<TreeNode<T>[]>([]);
  private readonly isInitialLoading = signal<boolean>(false);

  private readonly flatNodes = computed(() =>
    flattenTree(
      this.nodes(),
      this.nodeManager.getExpandedNodeIds(),
      this.nodeManager.getNodeChildrenMap(),
      (str) => this.nodeManager.hashString(str),
    ),
  );

  private readonly visibleNodes = computed(() => {
    const visibleNodes: FlatNode<T>[] = [];
    for (const node of this.flatNodes()) {
      if (isNodeVisible(node, this.flatNodes(), this.nodeManager.getExpandedNodeIds())) {
        visibleNodes.push(node);
      }
    }
    return visibleNodes;
  });

  constructor() {
    this.dataSource = new MatTableDataSource<FlatNode<T>>();
    effect(() => {
      this.dataSource.data = this.visibleNodes();
    });
  }

  get otherColumns(): { key: string; label: string }[] {
    return this.displayedColumns().filter(c => c.key !== this.treeColumn());
  }

  get columnKeys(): string[] {
    return this.displayedColumns().map(c => c.key);
  }

  get initialLoading(): boolean {
    return this.isInitialLoading();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const treetableService = this.treetableService();
    if (changes['treetableService'] && treetableService) {
      this.nodeManager.reset();
      this.nodes.set([]);
      this.isInitialLoading.set(true);

      treetableService.getInitialTree().then(nodes => {
        this.nodes.set(nodes);
        this.isInitialLoading.set(false);
      });
    }
  }

  onToggleClick(event: Event, node: FlatNode<T>) {
    event.stopPropagation();
    this.toggleNode(node);
  }

  onNodeIconClick(event: Event, node: FlatNode<T>) {
    event.stopPropagation();
    this.toggleNode(node);
  }

  onKeyUp(event: KeyboardEvent, node: FlatNode<T>) {
    if (event.key === 'Enter') {
      event.stopPropagation();
      this.toggleNode(node);
    }
  }

  async reload(): Promise<void> {
    this.nodeManager.reset();
    this.nodes.set([]);
    this.isInitialLoading.set(true);
    const nodes = await this.treetableService().getInitialTree();
    this.nodes.set(nodes);
    this.isInitialLoading.set(false);
  }

  async toggleNode(node: FlatNode<T>) {
    await this.nodeManager.toggleNode(node, this.treetableService());
  }

  isExpanded(node: FlatNode<T>): boolean {
    return this.nodeManager.isExpanded(node.id);
  }

  isLoading(node: FlatNode<T>): boolean {
    return this.nodeManager.isLoading(node.id);
  }

  getIcon(columnKey: string, node: FlatNode<T>): string | null {
    return getNodeIcon(columnKey, node, this.iconConfigs());
  }

  getIconColor(columnKey: string, node: FlatNode<T>): string | null {
    return getNodeIconColor(columnKey, node, this.iconConfigs());
  }

  getFullName(node: FlatNode<T>): string {
    const data = node.data as any;
    return [data.name1, data.name2, data.name3]
      .filter((part: string | undefined) => part && part.trim().length > 0)
      .join(' ');
  }

  getAddress(node: FlatNode<T>): string {
    const d = node.data as any;
    const street = [d.street, d.houseNumber].filter(Boolean).join(' ');
    const locality = [d.postalCode, d.city].filter(Boolean).join(' ');
    return [street, locality].filter(Boolean).join(', ');
  }

  onRowClick(node: FlatNode<T>) {
    this.rowClick.emit(node);
  }
}
