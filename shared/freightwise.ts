export type VesselInput = {
  name: string;
  capacity: number;
  rate: number;
};

export type VesselRow = VesselInput & {
  voyages: number;
  cost: number;
};

export function calculateVesselRows(quantity: number, options: VesselInput[]): VesselRow[] {
  return options.map((option) => ({
    ...option,
    voyages: Math.ceil(quantity / option.capacity),
    cost: quantity * option.rate,
  }));
}

export function calculateProcurement(
  quantity: number,
  purchasePerTonne: number,
  freightPerTonne: number,
  otherPerTonne: number,
) {
  const purchaseTotal = quantity * purchasePerTonne;
  const freightTotal = quantity * freightPerTonne;
  const otherTotal = quantity * otherPerTonne;
  const landedTotal = purchaseTotal + freightTotal + otherTotal;
  return {
    purchaseTotal,
    freightTotal,
    otherTotal,
    landedTotal,
    landedPerTonne: quantity > 0 ? landedTotal / quantity : 0,
  };
}

export function calculateTrailingMean(values: number[], window = 3) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length === 0) return null;
  const slice = clean.slice(-Math.min(window, clean.length));
  return slice.reduce((sum, value) => sum + value, 0) / slice.length;
}
