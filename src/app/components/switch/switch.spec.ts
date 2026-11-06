import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SwitchComponent } from './switch';

describe('SwitchComponent', () => {
  let fixture: ComponentFixture<SwitchComponent>;
  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SwitchComponent] }).compileComponents();
    fixture = TestBed.createComponent(SwitchComponent);
    fixture.componentRef.setInput('label', 'Stealth mode');
    fixture.componentRef.setInput('caption', 'Hide amounts on screen');
    await fixture.whenStable();
  });

  it('is a labelled switch that reports its state', async () => {
    expect(button().getAttribute('role')).toBe('switch');
    expect(button().getAttribute('aria-checked')).toBe('false');
    expect(button().textContent).toContain('Stealth mode');
    fixture.componentRef.setInput('checked', true);
    await fixture.whenStable();
    expect(button().getAttribute('aria-checked')).toBe('true');
  });

  it('asks for the opposite value when tapped', () => {
    const toggled = vi.fn<(value: boolean) => void>();
    fixture.componentInstance.toggled.subscribe(toggled);
    button().click();
    expect(toggled).toHaveBeenCalledWith(true);
  });

  it('does nothing while disabled', async () => {
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(button().disabled).toBe(true);
  });
});
