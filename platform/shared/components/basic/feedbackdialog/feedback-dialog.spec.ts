import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {FeedbackDialog} from './feedback-dialog';
import {Mock} from 'vitest';

describe('FeedbackDialog', () => {
  let component: FeedbackDialog;
  let fixture: ComponentFixture<FeedbackDialog>;
  let dialogRefMock: { close: Mock };

  beforeEach(async () => {
    dialogRefMock = {close: vi.fn()};

    await TestBed.configureTestingModule({
      imports: [FeedbackDialog],
      providers: [{provide: MatDialogRef, useValue: dialogRefMock}],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should save feedback in property', () => {
    // given
    const testFeedback = 'Test Feedback';

    // when
    component.feedback = testFeedback;

    // then
    expect(component.feedback).toBe('Test Feedback');
  });

  describe('onSubmit', () => {
    it('should close the dialog with trimmed feedback when feedback is not empty', () => {
      // given
      component.feedback = '  Mein Feedback  ';

      // when
      component.onSubmit();

      // then
      expect(dialogRefMock.close).toHaveBeenCalledWith('Mein Feedback');
    });

    it('should not call dialogRef.close when feedback is only whitespace', () => {
      // given
      component.feedback = '   ';

      // when
      component.onSubmit();

      // then
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should not call dialogRef.close when feedback is empty', () => {
      // given
      component.feedback = '';

      // when
      component.onSubmit();

      // then
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close the dialog without parameters', () => {
      // when
      component.onCancel();

      // then
      expect(dialogRefMock.close).toHaveBeenCalledWith();
    });
  });
});
