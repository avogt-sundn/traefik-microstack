import {ValidatorFn, Validators} from '@angular/forms';

/**
 * API Parameter Validators
 * Auto-generated from OpenAPI schema
 */
export class ApiParameterValidators {
  /**
   * Contract number for exact match search. Use * for wildcard search
   */
  static contractNumberValidators(): ValidatorFn[] {
    return [
      Validators.maxLength(10),
      Validators.pattern("^[A-Za-z0-9*]*$")
    ].filter(v => v !== undefined);
  }
  /**
   * Application number
   */
  static applicationNumberValidators(): ValidatorFn[] {
    return [
      Validators.min(1)
    ].filter(v => v !== undefined);
  }
  /**
   * Partner number
   */
  static partnerNumberValidators(): ValidatorFn[] {
    return [
      Validators.min(3)
    ].filter(v => v !== undefined);
  }
  /**
   * First name of contract holder (2-35 characters). Use * for wildcard search
   */
  static firstNameValidators(): ValidatorFn[] {
    return [
      Validators.minLength(2),
      Validators.maxLength(35),
      Validators.pattern("^[A-Za-zÄÖÜäöüßÉÈÊËéèêëÀÁÂÃÅÆÇÎÏÌÍÔÖØÙÚÛÜÝŸÑñ' *-]*$")
    ].filter(v => v !== undefined);
  }
  /**
   * Last name of contract holder (2-35 characters). Use * for wildcard search
   */
  static nameValidators(): ValidatorFn[] {
    return [
      Validators.minLength(2),
      Validators.maxLength(35),
      Validators.pattern("^[A-Za-zÄÖÜäöüßÉÈÊËéèêëÀÁÂÃÅÆÇÎÏÌÍÔÖØÙÚÛÜÝŸÑñ' *-]*$")
    ].filter(v => v !== undefined);
  }
  /**
   * Date of birth of contract holder
   */
  static dateOfBirthValidators(): ValidatorFn[] {
    return [
      // No validators needed
    ].filter(v => v !== undefined);
  }
  /**
   * Postal code. Use * for wildcard search
   */
  static postalCodeValidators(): ValidatorFn[] {
    return [
      Validators.maxLength(5),
      Validators.pattern("^[0-9*]+$")
    ].filter(v => v !== undefined);
  }
  /**
   * City name (2-35 characters). Use * for wildcard search
   */
  static cityValidators(): ValidatorFn[] {
    return [
      Validators.minLength(2),
      Validators.maxLength(35),
      Validators.pattern("^[A-Za-zÄÖÜäöüßÉÈÊËéèêëÀÁÂÃÅÆÇÎÏÌÍÔÖØÙÚÛÜÝŸÑñàáâãåæçìíîïôöøùúûüýÿ' .*-]*$")
    ].filter(v => v !== undefined);
  }
  /**
   * Vehicle license plate number. Use * for wildcard search
   */
  static vehicleLicensePlateValidators(): ValidatorFn[] {
    return [
      Validators.minLength(1),
      Validators.maxLength(15),
      Validators.pattern("^[A-ZÄÖÜ0-9\\s\\-*]+$")
    ].filter(v => v !== undefined);
  }
  /**
   * Client identifier for multi-tenant scenarios
   */
  static clientValidators(): ValidatorFn[] {
    return [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(10),
      Validators.pattern("^[A-Z0-9]+$")
    ].filter(v => v !== undefined);
  }

  /**
   * All validators as FormGroup config
   */
  static createFormValidators(): { [key: string]: ValidatorFn[] } {
    return {
      contractNumber: ApiParameterValidators.contractNumberValidators(),
      applicationNumber: ApiParameterValidators.applicationNumberValidators(),
      partnerNumber: ApiParameterValidators.partnerNumberValidators(),
      firstName: ApiParameterValidators.firstNameValidators(),
      name: ApiParameterValidators.nameValidators(),
      dateOfBirth: ApiParameterValidators.dateOfBirthValidators(),
      postalCode: ApiParameterValidators.postalCodeValidators(),
      city: ApiParameterValidators.cityValidators(),
      vehicleLicensePlate: ApiParameterValidators.vehicleLicensePlateValidators(),
      client: ApiParameterValidators.clientValidators()
    };
  }
}
