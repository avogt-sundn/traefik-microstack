import {inject, Injectable, Signal, signal} from '@angular/core';
import {Observable, map, catchError, of} from 'rxjs';
import {GroupDto, GroupListResponse, PartnerGatewayService} from '../api';

export interface GroupSelectOption {
  value: string;
  label: string;
  groupId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerGroupService {
  readonly allGroups: Signal<GroupDto[]>;
  readonly selectOptions: Signal<GroupSelectOption[]>;
  readonly loading: Signal<boolean>;
  readonly errorMessage: Signal<string | null>;
  private readonly partnerGatewayService = inject(PartnerGatewayService);
  private readonly groups = signal<GroupDto[]>([]);
  private readonly groupSelectOptions = signal<GroupSelectOption[]>([]);
  private readonly isLoading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);


  constructor() {
    this.allGroups = this.groups.asReadonly();
    this.selectOptions = this.groupSelectOptions.asReadonly();
    this.loading = this.isLoading.asReadonly();
    this.errorMessage = this.error.asReadonly();
  }

  getGroupSelectOptions(): string[] {
    return this.groupSelectOptions().map(option => option.value);
  }

  findGroupByName(name1: string): GroupDto | undefined {
    return this.groups().find(group => group.name1 === name1);
  }

  loadGroups(existingGroupNames?: string[]): Observable<GroupDto[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.partnerGatewayService.getAllGroups().pipe(
      map((response: GroupListResponse) => {
        // API returns single GroupDto, but we expect an array
        // If API actually returns multiple groups in some nested structure, adjust here
        const groups = response?.groups ? response.groups : [];
        this.groups.set(groups);
        this.updateSelectOptions(groups, existingGroupNames);
        this.isLoading.set(false);
        return groups;
      }),
      catchError(() => {
        this.error.set('Failed to load partner groups');
        this.isLoading.set(false);
        this.groups.set([]);
        this.groupSelectOptions.set([]);
        return of([]);
      }),
    );
  }

  /**
   * Convert groups to select options for the editable table
   */
  private updateSelectOptions(groups: GroupDto[], existingGroupNames?: string[]): void {
    const options: GroupSelectOption[] = groups.map(group => ({
      value: group.name1 || '',
      label: this.formatGroupLabelForDisplay(group),
      groupId: group.groupId,
    }));

    // Add any existing group names that are not in the loaded groups (fallback)
    if (existingGroupNames) {
      existingGroupNames.forEach(existingName => {
        if (existingName && !options.some(option => option.value === existingName)) {
          options.push({
            value: existingName,
            label: existingName + ' (inactive)',
            groupId: undefined,
          });
        }
      });
    }

    this.groupSelectOptions.set(options);
  }

  private formatGroupLabelForDisplay(group: GroupDto): string {
    const parts = [
      group.name1,
      group.name2,
    ].filter(Boolean);
    return parts.join(' - ');
  }
}
