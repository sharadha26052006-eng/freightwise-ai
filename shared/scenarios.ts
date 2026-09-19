export type ScenarioInput = {
  name: string;
  vessel: string;
  date: string;
  cargoQuantity: number;
  vesselCapacity: number;
  rate: number;
  purchasePrice: number;
  otherCostsPerTonne: number;
  laterRateUplift?: number;
};

export type ScenarioResult = ScenarioInput & {
  isValid: boolean;
  voyages: number;
  freightCost: number;
  purchaseCost: number;
  otherCosts: number;
  landedCost: number;
  landedCostPerTonne: number;
  warning?: string;
};

export function calculateScenario(input: ScenarioInput): ScenarioResult {
  const quantity = Number(input.cargoQuantity);
  const isValid = Number.isFinite(quantity) && quantity > 0;
  if (!isValid) {
    return {
      ...input,
      isValid: false,
      voyages: 0,
      freightCost: 0,
      purchaseCost: 0,
      otherCosts: 0,
      landedCost: 0,
      landedCostPerTonne: 0,
      warning: "Enter a cargo quantity greater than zero.",
    };
  }

  const rate = input.rate * (1 + (input.laterRateUplift ?? 0));
  const voyages = Math.ceil(quantity / input.vesselCapacity);
  const freightCost = quantity * rate;
  const purchaseCost = quantity * input.purchasePrice;
  const otherCosts = quantity * input.otherCostsPerTonne;
  const landedCost = purchaseCost + freightCost + otherCosts;
  return {
    ...input,
    rate,
    isValid: true,
    voyages,
    freightCost,
    purchaseCost,
    otherCosts,
    landedCost,
    landedCostPerTonne: landedCost / quantity,
  };
}
