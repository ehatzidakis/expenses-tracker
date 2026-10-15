import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PEOPLE } from '../../models/splitz.model';
import { CreateSplitState, SplitFieldsComponent } from './split-fields.component';

const initialState: CreateSplitState = {
  goesSplitzes: false,
  splitWith: [],
  paidById: 'me',
  customSplitMode: false,
  customSplitAmounts: {},
};

describe('SplitFieldsComponent', () => {
  let fixture: ComponentFixture<SplitFieldsComponent>;
  let pendingFrame: FrameRequestCallback | undefined;
  let hostForm: HTMLFormElement;
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let originalMatchMedia: PropertyDescriptor | undefined;
  let originalScrollIntoView: PropertyDescriptor | undefined;

  beforeEach(async () => {
    pendingFrame = undefined;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      pendingFrame = callback;
      return 1;
    });

    originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    matchMediaMock = vi.fn((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
    }));
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: matchMediaMock,
    });

    originalScrollIntoView = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollIntoView',
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });

    await TestBed.configureTestingModule({ imports: [SplitFieldsComponent] }).compileComponents();
    fixture = TestBed.createComponent(SplitFieldsComponent);
    fixture.componentRef.setInput('amount', 25);
    fixture.componentRef.setInput('people', PEOPLE);
    fixture.componentRef.setInput('state', initialState);
    fixture.componentRef.setInput('allowCustom', true);
    fixture.componentRef.setInput('scrollOnSplitInteraction', true);
    fixture.detectChanges();

    hostForm = document.createElement('form');
    document.body.append(hostForm);
    hostForm.append(fixture.nativeElement);

    fixture.componentInstance.stateChange.subscribe((state) => {
      fixture.componentRef.setInput('state', state);
    });
  });

  afterEach(() => {
    hostForm.remove();
    vi.unstubAllGlobals();
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      delete (window as Partial<Window>).matchMedia;
    }
    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
    }
  });

  it('scrolls the enclosing form to its bottom when split is enabled', () => {
    fixture.nativeElement.querySelector('button')?.click();
    fixture.detectChanges();
    pendingFrame?.(0);

    expect(hostForm.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end',
    });
  });

  it('uses non-smooth scrolling when reduced motion is preferred', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query === '(max-width: 767px)' || query === '(prefers-reduced-motion: reduce)',
      media: query,
    }));

    fixture.nativeElement.querySelector('button')?.click();
    fixture.detectChanges();
    pendingFrame?.(0);

    expect(hostForm.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'end',
    });
  });

  it('scrolls to the bottom after selecting a split person, payer, or custom mode', () => {
    const clickButton = (label: string) => {
      const buttons = fixture.nativeElement.querySelectorAll(
        'button',
      ) as NodeListOf<HTMLButtonElement>;
      const button = Array.from(buttons).find((item) => item.textContent?.includes(label));
      expect(button).toBeTruthy();
      button?.click();
    };

    clickButton('✂️ Yes');
    fixture.detectChanges();
    pendingFrame?.(0);
    vi.mocked(hostForm.scrollIntoView).mockClear();

    clickButton(PEOPLE[0].name);
    fixture.detectChanges();
    pendingFrame?.(0);
    expect(hostForm.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'end' });
    vi.mocked(hostForm.scrollIntoView).mockClear();

    clickButton('Me');
    fixture.detectChanges();
    pendingFrame?.(0);
    expect(hostForm.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'end' });
    vi.mocked(hostForm.scrollIntoView).mockClear();

    clickButton('Custom');
    fixture.detectChanges();
    pendingFrame?.(0);
    expect(hostForm.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'end' });
  });

  it('does not auto-scroll when the shared split controls are not opted in', () => {
    fixture.componentRef.setInput('scrollOnSplitInteraction', false);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button')?.click();
    fixture.detectChanges();
    pendingFrame?.(0);

    expect(hostForm.scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not auto-scroll on desktop widths', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
    }));

    fixture.nativeElement.querySelector('button')?.click();
    fixture.detectChanges();
    pendingFrame?.(0);

    expect(hostForm.scrollIntoView).not.toHaveBeenCalled();
  });
});
