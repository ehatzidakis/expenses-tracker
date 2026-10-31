import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { SyncMarkerService } from './sync-marker.service';

describe('SyncMarkerService.watch', () => {
  it('works when called after an await, outside an injection context', async () => {
    const user = signal<object | null>(null);
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient()),
        { provide: AuthService, useValue: { user } },
      ],
    });
    const service = TestBed.inject(SyncMarkerService);
    const check = vi.spyOn(service, 'checkForRemoteChanges').mockResolvedValue();

    // The app initializer awaits the cache restore before calling watch().
    await Promise.resolve();
    expect(() => service.watch()).not.toThrow();

    TestBed.tick();
    expect(check).not.toHaveBeenCalled();

    user.set({ uid: 'admin' });
    TestBed.tick();
    expect(check).toHaveBeenCalledWith(true);
  });
});
