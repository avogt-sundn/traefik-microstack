import {LoanValidators} from './loan.validators';

const SEARCH_MIN_LENGTH = 3;

export const searchFormValidator = [LoanValidators.atLeastOneFieldValidator(SEARCH_MIN_LENGTH)];