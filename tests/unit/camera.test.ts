import { describe, expect, it } from 'vitest';
import { distanceMeters } from '@/lib/geo';
import { boxOf, cameraOf, edgeChip, fit, isInside, metersPerPixel, NO_INSETS, projector, spread, type Camera, type Insets, type Size } from '@/lib/map/camera';

/**
 * Where things are on the map (lib/map/camera.ts). The markers, the edge chips and the
 * framing all come from this arithmetic, with MapLibre under them or without.
 */

const KAMPPI = { lat: 60.16952, lon: 24.93545 };
const phone: Size = { width: 390, height: 844 };
const desktop: Size = { width: 1000, height: 900 };
const sheet: Insets = { top: 0, right: 0, bottom: 216, left: 0 };
const camera: Camera = { ...KAMPPI, zoom: 15 };

describe('projecting places to pixels', () => {
  it('puts the camera centre in the middle of what the sheet leaves free', () => {
    expect(projector(camera, phone)(KAMPPI.lat, KAMPPI.lon)).toEqual({ x: 195, y: 422 });
    expect(projector(camera, phone, sheet)(KAMPPI.lat, KAMPPI.lon)).toEqual({ x: 195, y: 314 });
  });

  it('keeps north up and east to the right, at the scale of the zoom', () => {
    const project = projector(camera, desktop);
    const north = { lat: KAMPPI.lat + 300 / 111_320, lon: KAMPPI.lon };
    const east = { lat: KAMPPI.lat, lon: KAMPPI.lon + 300 / 55_400 };
    const centre = project(KAMPPI.lat, KAMPPI.lon);
    const up = project(north.lat, north.lon);
    const right = project(east.lat, east.lon);
    expect(up.x).toBeCloseTo(centre.x, 0);
    expect(up.y).toBeLessThan(centre.y);
    expect(right.x).toBeGreaterThan(centre.x);
    // The pixels agree with the metres on the ground, to within a pixel or two.
    const scale = metersPerPixel(KAMPPI.lat, camera.zoom);
    expect((centre.y - up.y) * scale).toBeCloseTo(distanceMeters(KAMPPI, north), -1);
    expect((right.x - centre.x) * scale).toBeCloseTo(distanceMeters(KAMPPI, east), -1);
    // One zoom level in doubles every distance on screen.
    const closer = projector({ ...camera, zoom: 16 }, desktop)(north.lat, north.lon);
    expect(centre.y - closer.y).toBeCloseTo((centre.y - up.y) * 2, 0);
  });

  it('reads a scene view, which counts tiles of 256 px, as a camera one level lower', () => {
    expect(cameraOf({ center: [60.17, 24.94], zoom: 16 })).toEqual({ lat: 60.17, lon: 24.94, zoom: 15 });
    // The same view through the old placeholder arithmetic and the new one lands on the same pixel.
    const project = projector(cameraOf({ center: [KAMPPI.lat, KAMPPI.lon], zoom: 16 }), desktop);
    expect(project(KAMPPI.lat, KAMPPI.lon)).toEqual({ x: 500, y: 450 });
  });
});

describe('framing', () => {
  const far = { lat: KAMPPI.lat + 0.02, lon: KAMPPI.lon + 0.03 };

  it('shows every place inside the free part of the container', () => {
    const framed = fit([KAMPPI, far], phone, { top: 76, right: 12, bottom: 216, left: 12 })!;
    const project = projector(framed, phone, sheet);
    const box = boxOf(phone, { top: 76, right: 12, bottom: 216, left: 12 });
    // The camera is centred for the sheet alone, so allow the bar's share of the difference.
    for (const place of [KAMPPI, far]) {
      const point = project(place.lat, place.lon);
      expect(point.x).toBeGreaterThan(box.left);
      expect(point.x).toBeLessThan(box.right);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(box.bottom + 40);
    }
  });

  it('never zooms in past the limit for two places a street apart', () => {
    const near = { lat: KAMPPI.lat + 0.0002, lon: KAMPPI.lon };
    expect(fit([KAMPPI, near], desktop, NO_INSETS)!.zoom).toBe(16);
    expect(fit([KAMPPI, near], desktop, NO_INSETS, { maxZoom: 14.5 })!.zoom).toBe(14.5);
    expect(fit([KAMPPI], desktop, NO_INSETS)).toMatchObject({ zoom: 16 });
    expect(fit([], desktop, NO_INSETS)).toBeUndefined();
  });

  it('centres on the middle of the places', () => {
    const framed = fit([KAMPPI, far], desktop, NO_INSETS)!;
    expect(framed.lat).toBeCloseTo((KAMPPI.lat + far.lat) / 2, 3);
    expect(framed.lon).toBeCloseTo((KAMPPI.lon + far.lon) / 2, 4);
  });
});

describe('edge chips', () => {
  const box = boxOf(desktop, { top: 64, right: 16, bottom: 44, left: 16 });

  it('gives no chip to a place that is on the map', () => {
    expect(edgeChip({ x: 500, y: 450 }, box)).toBeUndefined();
    expect(isInside({ x: 16, y: 64 }, box)).toBe(true);
  });

  it('puts the chip on the edge, on the line towards the place, and turns the arrow to it', () => {
    const north = edgeChip({ x: 508, y: -400 }, box)!;
    expect(north.side).toBe('n');
    expect(north.y).toBeLessThan(120);
    expect(Math.abs(north.x - 508)).toBeLessThan(10);
    expect(north.degrees === 0 || north.degrees === 1).toBe(true);

    const east = edgeChip({ x: 2400, y: 460 }, box)!;
    expect(east.side).toBe('e');
    expect(east.x).toBeGreaterThan(900);
    expect(east.degrees).toBe(90);

    const southWest = edgeChip({ x: -600, y: 1500 }, box)!;
    expect(southWest.side).toBe('sw');
    expect(southWest.degrees).toBeGreaterThan(180);
    expect(southWest.degrees).toBeLessThan(270);
  });

  it('keeps every chip whole inside the box, whatever the direction', () => {
    for (let degrees = 0; degrees < 360; degrees += 7) {
      const point = { x: 508 + Math.sin((degrees * Math.PI) / 180) * 5000, y: 460 - Math.cos((degrees * Math.PI) / 180) * 5000 };
      const chip = edgeChip(point, box)!;
      expect(chip.x).toBeGreaterThanOrEqual(box.left + 44 - 1);
      expect(chip.x).toBeLessThanOrEqual(box.right - 44 + 1);
      expect(chip.y).toBeGreaterThanOrEqual(box.top + 22 - 1);
      expect(chip.y).toBeLessThanOrEqual(box.bottom - 22 + 1);
    }
  });

  it('gives a place just inside the box its chip when asked to: the map has taken its marker off', () => {
    const inside = { x: box.left + 20, y: (box.top + box.bottom) / 2 + 30 };
    expect(edgeChip(inside, box)).toBeUndefined();
    const chip = edgeChip(inside, box, undefined, true)!;
    // On the same line from the middle, at the edge, whole.
    expect(chip.x).toBe(box.left + 44);
    expect(chip.side).toBe('w');
    // The very middle has no direction.
    expect(edgeChip({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 }, box, undefined, true)).toBeUndefined();
  });

  it('moves chips apart when two places lie in the same direction', () => {
    const first = edgeChip({ x: 2400, y: 460 }, box)!;
    const second = edgeChip({ x: 3000, y: 470 }, box)!;
    const [a, b] = spread([first, second], box);
    expect(a).toEqual(first);
    expect(Math.abs(b.y - a.y)).toBeGreaterThanOrEqual(40);
    expect(b.x).toBe(second.x);
  });

  it('moves a chip off what it is told to keep clear of: the answer\'s marker, along the edge it is on', () => {
    const chip = edgeChip({ x: 2400, y: 460 }, box)!;
    // A marker's button right where the chip would lie.
    const marker = { left: chip.x - 60, top: chip.y - 22, right: chip.x + 32, bottom: chip.y + 22 };
    const [moved] = spread([chip], box, undefined, [marker]);
    expect(moved.x).toBe(chip.x);
    expect(Math.abs(moved.y - chip.y)).toBeGreaterThanOrEqual(40);
    // Nothing to keep clear of: it stays.
    expect(spread([chip], box, undefined, [{ ...marker, top: chip.y + 200, bottom: chip.y + 244 }])).toEqual([chip]);
  });
});
