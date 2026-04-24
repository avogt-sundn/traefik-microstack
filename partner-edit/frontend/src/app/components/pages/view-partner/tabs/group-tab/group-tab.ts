import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  signal,
} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {ValidatedFormField, CypressIdDirective} from '@traefik-microstack/shared';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {PartnerEditDto} from '../../../../../api';

@Component({
  selector: 'partner-group-tab',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    ValidatedFormField,
    CypressIdDirective,
  ],
  templateUrl: './group-tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupTab {
  readonly partner: InputSignal<PartnerEditDto> = input.required<PartnerEditDto>();
  readonly isEditMode: InputSignal<boolean> = input<boolean>(false);

  partnerTabChanged: OutputEmitterRef<Partial<PartnerEditDto>> = output<Partial<PartnerEditDto>>();
  groupForm: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly hasUserEdited = signal(false);

  constructor() {
    this.groupForm = this.fb.group({
      type: [''],
      groupType: [''],
      groupNumber: [null],
    });

    effect((): void => {
      if (!this.isEditMode() || !this.hasUserEdited()) {
        this.hasUserEdited.set(false);
        const p = this.partner();
        this.groupForm.patchValue({
          type: p.type ?? '',
          groupType: p.groupType ?? '',
          groupNumber: p.groupNumber ?? null,
        }, {emitEvent: false});
      }
    });

    this.groupForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(formData => {
        if (this.isEditMode()) {
          this.hasUserEdited.set(true);
          this.partnerTabChanged.emit({
            type: formData.type ?? undefined,
            groupType: formData.groupType ?? undefined,
            groupNumber: formData.groupNumber != null ? Number(formData.groupNumber) : undefined,
          });
        }
      });
  }
}
