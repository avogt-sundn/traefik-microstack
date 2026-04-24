import {TestBed} from '@angular/core/testing';
import {TranslocoService} from '@jsverse/transloco';
import {Mocked} from 'vitest';
import {LanguageService} from './language.service';

// TODO unit test erweitern
describe('LanguageService', () => {
  let service: LanguageService;
  let mockTranslocoService: Mocked<Partial<TranslocoService>>;

  beforeEach(() => {
    mockTranslocoService = {
      translate: vi.fn().mockReturnValue('mocked-translation'),
    };

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        {provide: TranslocoService, useValue: mockTranslocoService},
      ],
    });

    service = TestBed.inject(LanguageService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      // Given
      // Service is injected in beforeEach

      // When
      // Service instance exists

      // Then
      expect(service).toBeTruthy();
      expect(service).toBeInstanceOf(LanguageService);
    });
  });
});
