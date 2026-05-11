import {provideHttpClientTesting} from '@angular/common/http/testing';
import {Injectable} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideTransloco, TranslocoLoader} from '@jsverse/transloco';
import {Header} from './header';

@Injectable()
class TestTranslocoLoader implements TranslocoLoader {
  getTranslation() {
    return Promise.resolve({});
  }
}

describe('Header', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
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

  it('should create the header', () => {
    const fixture = TestBed.createComponent(Header);
    const header = fixture.componentInstance;
    expect(header).toBeTruthy();
  });
});
