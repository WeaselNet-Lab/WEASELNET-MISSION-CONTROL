import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EXHIBIT_STEPS, exhibitFrame, exhibitTravelUnits, type ExhibitFrame } from "@/lib/explore/exhibit-scroll";

function coverage(frame: ExhibitFrame): number {
  return frame.overview + frame.features.reduce((sum, layer) => sum + layer.opacity, 0);
}

function progressFor(units: number, count: number): number {
  return units / exhibitTravelUnits(count);
}

describe("exhibit scroll", () => {
  it("starts on the overview and ends on the last project", () => {
    const start = exhibitFrame(0, 4);
    assert.equal(start.overview, 1);
    assert.equal(start.activeIndex, -1);
    assert.deepEqual(start.features.map((layer) => layer.opacity), [0, 0, 0, 0]);

    const end = exhibitFrame(1, 4);
    assert.equal(end.overview, 0);
    assert.equal(end.activeIndex, 3);
    assert.equal(end.features[3]?.opacity, 1);
    assert.deepEqual(end.features.slice(0, 3).map((layer) => layer.opacity), [0, 0, 0]);
  });

  it("opens the first project, then swaps one at a time", () => {
    const count = 4;
    const afterOverview = exhibitFrame(progressFor(EXHIBIT_STEPS.overview, count), count);
    assert.equal(afterOverview.activeIndex, -1);
    assert.equal(afterOverview.overview, 1);

    const early = exhibitFrame(progressFor(EXHIBIT_STEPS.overview + EXHIBIT_STEPS.open * 0.12, count), count);
    assert.ok(early.overview > 0.7);
    assert.ok((early.features[0]?.opacity ?? 1) < 0.05);
    const late = exhibitFrame(progressFor(EXHIBIT_STEPS.overview + EXHIBIT_STEPS.open * 0.88, count), count);
    assert.ok(late.overview < 0.05);
    assert.ok((late.features[0]?.opacity ?? 0) > 0.7);
    assert.equal(late.activeIndex, 0);

    let cursor = EXHIBIT_STEPS.overview + EXHIBIT_STEPS.open;
    for (let index = 0; index < count; index += 1) {
      const held = exhibitFrame(progressFor(cursor + EXHIBIT_STEPS.hold / 2, count), count);
      assert.equal(held.activeIndex, index);
      assert.equal(held.features[index]?.opacity, 1);
      assert.equal(held.overview, 0);
      cursor += EXHIBIT_STEPS.hold;
      if (index === count - 1) break;
      const swapping = exhibitFrame(progressFor(cursor + EXHIBIT_STEPS.swap * 0.12, count), count);
      assert.ok((swapping.features[index]?.opacity ?? 0) > 0.7);
      assert.ok((swapping.features[index + 1]?.opacity ?? 1) < 0.05);
      const arriving = exhibitFrame(progressFor(cursor + EXHIBIT_STEPS.swap * 0.88, count), count);
      assert.ok((arriving.features[index]?.opacity ?? 1) < 0.05);
      assert.ok((arriving.features[index + 1]?.opacity ?? 0) > 0.7);
      assert.equal(arriving.activeIndex, index + 1);
      for (let other = 0; other < count; other += 1) {
        if (other === index || other === index + 1) continue;
        assert.equal(swapping.features[other]?.opacity, 0);
      }
      cursor += EXHIBIT_STEPS.swap;
    }
  });

  it("never shows two readable layouts in the window at once", () => {
    for (let step = 0; step <= 80; step += 1) {
      const frame = exhibitFrame(step / 80, 4);
      const readable = [frame.overview, ...frame.features.map((layer) => layer.opacity)].filter((opacity) => opacity > 0.35);
      assert.ok(readable.length <= 1);
      assert.ok(coverage(frame) <= 1.001);
      for (const layer of frame.features) {
        assert.ok(layer.opacity >= 0 && layer.opacity <= 1);
        assert.ok(layer.shift >= -1 && layer.shift <= 1);
      }
    }
  });

  it("reverses through the same projects back to the overview", () => {
    const seen: number[] = [];
    for (let step = 40; step >= 0; step -= 1) {
      const index = exhibitFrame(step / 40, 4).activeIndex;
      if (seen[seen.length - 1] !== index) seen.push(index);
    }
    assert.deepEqual(seen, [3, 2, 1, 0, -1]);
  });

  it("handles an empty room and a single project", () => {
    assert.equal(exhibitTravelUnits(0), 0);
    assert.deepEqual(exhibitFrame(1, 0), { overview: 1, features: [], activeIndex: -1 });
    const alone = exhibitFrame(1, 1);
    assert.equal(alone.activeIndex, 0);
    assert.equal(alone.features[0]?.opacity, 1);
    assert.equal(exhibitFrame(0, 1).activeIndex, -1);
  });
});
