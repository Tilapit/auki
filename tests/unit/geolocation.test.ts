import { describe, expect, it, vi } from 'vitest';
import { canLocate, LOCATE_OPTIONS, locateOnce, locationPermission, wallClock } from '@/lib/geolocation';

const geolocation = (run: (success: PositionCallback, failure: PositionErrorCallback) => void) =>
  ({ getCurrentPosition: vi.fn((success, failure) => run(success, failure as PositionErrorCallback)) }) as unknown as Geolocation;

describe('canLocate', () => {
  it('needs both the API and a secure context', () => {
    const api = { geolocation: {} as Geolocation };
    expect(canLocate({ navigator: api, isSecureContext: true })).toBe(true);
    expect(canLocate({ navigator: api, isSecureContext: false })).toBe(false);
    expect(canLocate({ navigator: {}, isSecureContext: true })).toBe(false);
    expect(canLocate({})).toBe(false);
  });
});

describe('locateOnce', () => {
  it('asks with low accuracy, a five-minute-old fix allowed and a ten-second timeout', async () => {
    const geo = geolocation((success) => success({ coords: { latitude: 60.17, longitude: 24.94, accuracy: 25 } } as GeolocationPosition));
    await expect(locateOnce(geo)).resolves.toEqual({ ok: true, lat: 60.17, lon: 24.94, accuracy: 25 });
    expect(geo.getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), LOCATE_OPTIONS);
    expect(LOCATE_OPTIONS).toEqual({ enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 });
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
    [99, 'unavailable'],
  ])('maps error code %i to %s', async (code, problem) => {
    const geo = geolocation((_, failure) => failure({ code } as GeolocationPositionError));
    await expect(locateOnce(geo)).resolves.toEqual({ ok: false, problem });
  });
});

describe('locationPermission', () => {
  it('reads the state, and says unknown where the browser cannot tell', async () => {
    await expect(locationPermission({ query: async () => ({ state: 'granted' }) as PermissionStatus })).resolves.toBe('granted');
    await expect(locationPermission({ query: async () => Promise.reject(new TypeError('unsupported')) })).resolves.toBe('unknown');
    await expect(locationPermission(undefined)).resolves.toBe('unknown');
  });
});

describe('wallClock', () => {
  it('formats local time as HH:mm', () => {
    expect(wallClock(new Date(2026, 10, 19, 8, 5))).toBe('08:05');
    expect(wallClock(new Date(2026, 10, 19, 20, 41))).toBe('20:41');
  });
});
