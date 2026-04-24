import {provideHttpClientTesting} from '@angular/common/http/testing';
import {Injectable} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideTransloco, TranslocoLoader} from '@jsverse/transloco';
import {App} from './app';

@Injectable()
class TestTranslocoLoader implements TranslocoLoader {
  getTranslation() {
    return Promise.resolve({});
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClientTesting(),
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

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
