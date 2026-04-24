import {PartnerValidators} from './partner.validators';

const SEARCH_MIN_LENGTH = 3;

export const searchFormValidator = [PartnerValidators.atLeastOneFieldValidator(SEARCH_MIN_LENGTH)];
