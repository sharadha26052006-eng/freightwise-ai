from __future__ import annotations

import math
from datetime import date
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from mangum import Mangum
except ImportError:  # pragma: no cover - local development does not require Mangum
    Mangum = None  # type: ignore

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "freight_history.csv"
REQUIRED_COLUMNS = {
    "date",
    "origin_port",
    "destination_port",
    "cargo_type",
    "freight_usd_per_tonne",
}

VESSELS: dict[str, dict[str, Any]] = {
    "Handysize": {"capacity_tonnes": 35_000, "illustrative_rate": 42.5},
    "Supramax": {"capacity_tonnes": 55_000, "illustrative_rate": 36.8},
    "Panamax": {"capacity_tonnes": 82_000, "illustrative_rate": 32.9},
    "Capesize": {"capacity_tonnes": 170_000, "illustrative_rate": 28.7},
}

app = FastAPI(
    title="FreightWise AI Forecasting API",
    version="0.1.0",
    description="Transparent freight forecasting and procurement calculations for the FreightWise demo.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to the deployed frontend domain in production.
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ForecastRequest(BaseModel):
    cargo_type: str = Field(pattern="^(Iron ore|Coal|Fertilizer)$")
    origin_port: str = Field(min_length=2)
    destination_port: str = Field(pattern="^(Paradip|Visakhapatnam|Chennai)$")
    cargo_quantity_tonnes: float = Field(gt=0)
    forecast_date: date
    vessel_capacity_tonnes: float = Field(default=55_000, gt=0)
    history_selection: str = Field(default="illustrative_demo_csv", min_length=1)


class VesselRateOverride(BaseModel):
    vessel_name: str = Field(min_length=1)
    capacity_tonnes: float | None = Field(default=None, gt=0)
    rate_usd_per_tonne: float | None = Field(default=None, gt=0)


class VesselCompareRequest(BaseModel):
    cargo_quantity_tonnes: float = Field(gt=0)
    rate_overrides: list[VesselRateOverride] = Field(default_factory=list)


class ProcurementRequest(BaseModel):
    cargo_quantity_tonnes: float = Field(gt=0)
    purchase_price_per_tonne: float = Field(ge=0)
    freight_cost_per_tonne: float = Field(ge=0)
    other_costs_per_tonne: float = Field(default=0, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)


def load_history() -> tuple[pd.DataFrame, list[str]]:
    warnings: list[str] = []
    if not DATA_PATH.exists():
        return pd.DataFrame(), [f"History file not found at {DATA_PATH}."]
    try:
        frame = pd.read_csv(DATA_PATH)
    except Exception as exc:  # pragma: no cover - defensive file handling
        return pd.DataFrame(), [f"History file could not be read: {exc}."]
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    if missing:
        return pd.DataFrame(), [f"History file is missing columns: {', '.join(sorted(missing))}."]
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    frame["freight_usd_per_tonne"] = pd.to_numeric(frame["freight_usd_per_tonne"], errors="coerce")
    before = len(frame)
    frame = frame.dropna(subset=["date", "freight_usd_per_tonne"])
    if len(frame) < before:
        warnings.append(f"Dropped {before - len(frame)} rows with missing or invalid date/rate values.")
    return frame.sort_values("date").reset_index(drop=True), warnings


def filtered_history(request: ForecastRequest, frame: pd.DataFrame) -> pd.DataFrame:
    if frame.empty:
        return frame
    route_frame = frame[
        (frame["origin_port"].str.casefold() == request.origin_port.casefold())
        & (frame["destination_port"].str.casefold() == request.destination_port.casefold())
        & (frame["cargo_type"].str.casefold() == request.cargo_type.casefold())
    ]
    # The demo data is intentionally small. Falling back to the cargo type keeps the API
    # usable while making the fallback explicit in the response warnings.
    return route_frame if not route_frame.empty else frame[frame["cargo_type"].str.casefold() == request.cargo_type.casefold()]


def baseline_and_mae(values: pd.Series) -> tuple[float, float | None, list[str]]:
    warnings: list[str] = []
    clean = values.dropna().astype(float).reset_index(drop=True)
    if clean.empty:
        return 0.0, None, ["No usable history rows are available for this selection."]
    window = min(3, len(clean))
    baseline = float(clean.tail(window).mean())
    mae: float | None = None
    if len(clean) >= 8:
        split = max(5, int(len(clean) * 0.75))
        train = clean.iloc[:split]
        test = clean.iloc[split:]
        prediction = float(train.tail(min(3, len(train))).mean())
        mae = float((test - prediction).abs().mean())
    else:
        warnings.append("Dataset is too small for a time-based evaluation; MAE is not reported.")
    return baseline, mae, warnings


@app.get("/health")
def health() -> dict[str, Any]:
    frame, warnings = load_history()
    return {
        "status": "ok" if not frame.empty else "degraded",
        "service": "freightwise-forecasting",
        "dataset": {"path": str(DATA_PATH.name), "rows": len(frame), "warnings": warnings},
    }


@app.post("/forecast")
def forecast(request: ForecastRequest) -> dict[str, Any]:
    frame, warnings = load_history()
    if frame.empty:
        return {"status": "unavailable", "warnings": warnings, "data_quality": "unavailable"}

    selected = filtered_history(request, frame)
    if selected.empty:
        selected = frame
        warnings.append("No exact route-and-cargo match was found; the complete illustrative history was used.")
    elif len(selected) < 3:
        warnings.append("The exact route selection has fewer than 3 rows; interpret the baseline cautiously.")

    exact_route_rows = len(selected)
    values = selected["freight_usd_per_tonne"]
    baseline, mae, baseline_warnings = baseline_and_mae(values)
    warnings.extend(baseline_warnings)
    if exact_route_rows < len(frame):
        warnings.append("Selected history is route-and-cargo filtered; confirm that the route is representative.")

    # This range is deliberately named a planning range. It is not presented as a
    # calibrated confidence interval without a larger, governed dataset.
    spread = max(1.9, mae or float(values.std(ddof=0) or 1.9))
    lower = max(0.0, baseline - spread)
    upper = baseline + spread
    return {
        "status": "ok",
        "estimate": {
            "freight_usd_per_tonne": round(baseline, 2),
            "total_freight_usd": round(baseline * request.cargo_quantity_tonnes, 2),
            "planning_range_usd_per_tonne": {"lower": round(lower, 2), "upper": round(upper, 2)},
        },
        "route": {"origin_port": request.origin_port, "destination_port": request.destination_port},
        "assumptions": {
            "cargo_type": request.cargo_type,
            "cargo_quantity_tonnes": request.cargo_quantity_tonnes,
            "forecast_date": request.forecast_date.isoformat(),
            "vessel_capacity_tonnes": request.vessel_capacity_tonnes,
            "history_selection": request.history_selection,
            "method": "trailing_mean_baseline",
        },
        "evaluation": {"mae_usd_per_tonne": round(mae, 2) if mae is not None else None, "rows_used": len(values)},
        "warnings": warnings,
        "data_quality": "illustrative_demo",
        "source": "backend/data/freight_history.csv",
    }


@app.post("/compare-vessels")
def compare_vessels(request: VesselCompareRequest) -> dict[str, Any]:
    overrides = {item.vessel_name: item for item in request.rate_overrides}
    options = []
    for name, defaults in VESSELS.items():
        override = overrides.get(name)
        capacity = override.capacity_tonnes if override and override.capacity_tonnes else defaults["capacity_tonnes"]
        rate = override.rate_usd_per_tonne if override and override.rate_usd_per_tonne else defaults["illustrative_rate"]
        voyages = math.ceil(request.cargo_quantity_tonnes / capacity)
        options.append({
            "vessel_name": name,
            "capacity_tonnes": capacity,
            "cargo_quantity_tonnes": request.cargo_quantity_tonnes,
            "voyages_required": voyages,
            "rate_usd_per_tonne": rate,
            "estimated_freight_usd": round(request.cargo_quantity_tonnes * rate, 2),
            "assumptions": ["Illustrative rate unless explicitly overridden.", "Whole-voyage rounding.", "No port, draft, demurrage, or ballast constraints modeled."],
        })
    return {"status": "ok", "options": options, "data_quality": "illustrative_demo"}


@app.post("/calculate-procurement")
def calculate_procurement(request: ProcurementRequest) -> dict[str, Any]:
    purchase = request.cargo_quantity_tonnes * request.purchase_price_per_tonne
    freight = request.cargo_quantity_tonnes * request.freight_cost_per_tonne
    other = request.cargo_quantity_tonnes * request.other_costs_per_tonne
    landed = purchase + freight + other
    return {
        "status": "ok",
        "currency": request.currency.upper(),
        "line_items": {"cargo_purchase_cost": round(purchase, 2), "freight_cost": round(freight, 2), "other_costs": round(other, 2)},
        "estimated_landed_cost": round(landed, 2),
        "landed_cost_per_tonne": round(landed / request.cargo_quantity_tonnes, 2),
        "assumptions": ["Other costs include only the user-entered value.", "Duties, taxes, inland haulage, and financing are excluded."],
        "data_quality": "illustrative_demo",
    }


if Mangum is not None:  # pragma: no cover - exercised by AWS Lambda runtime
    handler = Mangum(app)
