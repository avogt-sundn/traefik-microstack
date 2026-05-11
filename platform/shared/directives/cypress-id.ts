import {Directive, ElementRef, inject, OnInit} from '@angular/core';

@Directive({
  selector: `
    input,
    input[matInput],
    shared-validated-form-field
  `,
})
export class CypressIdDirective implements OnInit {
  private el = inject(ElementRef);

  ngOnInit() {
    const technicalName = this.getTechnicalName();
    if (technicalName) {
      const cypressIdValue = `cypress-${technicalName}`;
      this.el.nativeElement.setAttribute('cypressId', cypressIdValue);
    }
  }

  private getTechnicalName(): string | null {
    const element = this.el.nativeElement;

    return (
      element.getAttribute('formControlName') ||
      element.getAttribute('name') ||
      element.getAttribute('id') ||
      element.id ||
      null
    );
  }
}
