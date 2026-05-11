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
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {ValidatedFormField, CypressIdDirective} from '@traefik-microstack/shared';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {PartnerEditDto} from '../../../../../api';
import {PartnerAddressService} from '../../../../../services/partner-address.service';

@Component({
  selector: 'partner-address-tab',
  imports: [
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    ValidatedFormField,
    CypressIdDirective,
  ],
  templateUrl: './address-tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressTab {
  partner: InputSignal<PartnerEditDto> = input.required<PartnerEditDto>();
  isEditMode: InputSignal<boolean> = input<boolean>(false);

  partnerTabChanged: OutputEmitterRef<Partial<PartnerEditDto>> = output<Partial<PartnerEditDto>>();
  addressForm: FormGroup;

  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly partnerAddressService = inject(PartnerAddressService);
  private readonly hasUserEdited = signal(false);

  constructor() {
    this.addressForm = this.fb.group({
      company1: [''],
      company2: [''],
      company3: [''],
      firstname: [''],
      street: [''],
      houseNumber: [''],
      postalCode: [''],
      city: [''],
      alphacode: [''],
    });

    effect((): void => {
      if (!this.isEditMode() || !this.hasUserEdited()) {
        this.hasUserEdited.set(false);
        this.partnerAddressService.populateFormFromPartner(this.addressForm, this.partner());
      }
    });

    this.setupEditChangeListener();
  }

  private setupEditChangeListener(): void {
    this.addressForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe(formData => {
        if (this.isEditMode()) {
          this.hasUserEdited.set(true);
          const partnerUpdate = this.partnerAddressService.convertFormToPartnerDto(formData);
          this.partnerTabChanged.emit(partnerUpdate);
        }
      });
  }
}
