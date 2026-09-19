import { describe, expect, it } from "vitest";
import { calculateScenario, type ScenarioInput } from "../shared/scenarios";

const base: ScenarioInput = {
  name: "Ship now",
  vessel: "Supramax",
  date: "2026-05-15",
  cargoQuantity: 120_000,
  vesselCapacity: 55_000,
  rate: 36.8,
  purchasePrice: 92,
  otherCostsPerTonne: 3.5,
};

describe("interactive scenario calculations", () => {
  it("updates voyage count and freight when Ship now changes vessel", () => {
    const supramax = calculateScenario(base);
    const panamax = calculateScenario({ ...base, vessel: "Panamax", vesselCapacity: 82_000, rate: 32.9 });

    expect(supramax.voyages).toBe(3);
    expect(panamax.voyages).toBe(2);
    expect(supramax.freightCost).toBe(4_416_000);
    expect(panamax.freightCost).toBe(3_948_000);
    expect(panamax.landedCostPerTonne).toBeCloseTo(128.4, 5);
  });

  it("applies only the Ship later date uplift to that scenario", () => {
    const now = calculateScenario(base);
    const later = calculateScenario({ ...base, name: "Ship later", date: "2026-06-15", laterRateUplift: 0.04 });

    expect(now.freightCost).toBe(4_416_000);
    expect(later.freightCost).toBeCloseTo(4_592_640, 5);
    expect(now.date).toBe("2026-05-15");
    expect(later.date).toBe("2026-06-15");
  });

  it("returns an explicit validation result for empty or invalid quantity", () => {
    const empty = calculateScenario({ ...base, cargoQuantity: 0 });
    const invalid = calculateScenario({ ...base, cargoQuantity: Number.NaN });

    expect(empty.isValid).toBe(false);
    expect(invalid.isValid).toBe(false);
    expect(empty.warning).toContain("greater than zero");
    expect(empty.voyages).toBe(0);
    expect(empty.landedCost).toBe(0);
  });
});
