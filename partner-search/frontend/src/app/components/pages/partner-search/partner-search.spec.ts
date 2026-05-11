import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {Injectable} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideTransloco, TranslocoLoader} from '@jsverse/transloco';
import {PartnerSearch} from './partner-search';

@Injectable()
class TestTranslocoLoader implements TranslocoLoader {
  getTranslation() {
    return Promise.resolve({});
  }
}

describe('PartnerSearch', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerSearch],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
          loader: TestTranslocoLoader,
        }),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PartnerSearch);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
