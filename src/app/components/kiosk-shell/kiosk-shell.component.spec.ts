import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { takeOpenTab } from './kiosk-shell.component';
import { KioskTabBarComponent } from './kiosk-tab-bar.component';

describe('takeOpenTab', () => {
  // Minimal stand-in for the Cache API, which jsdom doesn't have.
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    const cache = {
      match: async (key: string) => (store.has(key) ? new Response(store.get(key)) : undefined),
      delete: async (key: string) => store.delete(key),
    };
    vi.stubGlobal('caches', { open: async () => cache });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('opens Requests after a request notification was tapped, only once', async () => {
    store.set('/__open-tab', JSON.stringify({ tab: 'requests', at: 1_000 }));

    expect(await takeOpenTab(2_000)).toBe('requests');
    expect(await takeOpenTab(2_000)).toBeNull();
  });

  it('ignores a tap from long ago', async () => {
    store.set('/__open-tab', JSON.stringify({ tab: 'requests', at: 0 }));

    expect(await takeOpenTab(10 * 60 * 1000)).toBeNull();
  });

  it('does nothing when no notification was tapped', async () => {
    expect(await takeOpenTab()).toBeNull();
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
