import { describe, expect, it } from "vitest";
import {
  calculateProcurement,
  calculateTrailingMean,
  calculateVesselRows,
} from "../shared/freightwise";

describe("FreightWise calculations", () => {
  it("rounds vessel voyages up to whole voyages", () => {
    const rows = calculateVesselRows(120_000, [
      { name: "Supramax", capacity: 55_000, rate: 36.8 },
      { name: "Panamax", capacity: 82_000, rate: 32.9 },
    ]);

    expect(rows[0]).toMatchObject({ voyages: 3, cost: 4_416_000 });
    expect(rows[1]).toMatchObject({ voyages: 2, cost: 3_948_000 });
  });

  it("keeps landed cost arithmetic transparent", () => {
    const result = calculateProcurement(120_000, 92, 35.7, 3.5);

    expect(result).toEqual({
      purchaseTotal: 11_040_000,
      freightTotal: 4_284_000,
      otherTotal: 420_000,
      landedTotal: 15_744_000,
      landedPerTonne: 131.2,
    });
  });

  it("uses only the trailing values for the baseline", () => {
    expect(calculateTrailingMean([31.8, 32.6, 33.4, 32.9, 34.1, 35.2])).toBeCloseTo(34.0667, 3);
    expect(calculateTrailingMean([])).toBeNull();
  });
});
