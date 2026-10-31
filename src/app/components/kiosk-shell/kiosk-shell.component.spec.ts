import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readInitialKioskTab } from './kiosk-shell.component';
import { KioskTabBarComponent } from './kiosk-tab-bar.component';

describe('readInitialKioskTab', () => {
  afterEach(() => history.replaceState(null, '', '/'));

  it('opens the Requests tab when coming from a request notification, then tidies the URL', () => {
    history.replaceState(null, '', '/?tab=requests&keep=1');

    expect(readInitialKioskTab()).toBe('requests');
    expect(window.location.search).toBe('?keep=1');
  });

  it('opens the New tab otherwise', () => {
    history.replaceState(null, '', '/');

    expect(readInitialKioskTab()).toBe('new');
  });
});

describe('KioskTabBarComponent', () => {
  function render(requestCount: number) {
    const fixture = TestBed.createComponent(KioskTabBarComponent);
    fixture.componentRef.setInput('activeTab', 'new');
    fixture.componentRef.setInput('requestCount', requestCount);
    fixture.detectChanges();
    return fixture;
  }

  it('marks the active tab and switches tabs on tap', () => {
    const fixture = render(0);
    const emitted = vi.fn();
    fixture.componentInstance.tabChange.subscribe(emitted);

    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');

    tabs[1].click();
    expect(emitted).toHaveBeenCalledWith('requests');
  });

  it('shows a count bubble only when requests are waiting', () => {
    expect(render(0).nativeElement.textContent).not.toContain('2');
    expect(
      render(2).nativeElement.querySelector('[aria-label="2 requests waiting"]'),
    ).not.toBeNull();
  });
});
