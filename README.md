# FreightWise AI

FreightWise AI is a hackathon-ready freight analytics workspace for companies importing bulk cargo from overseas to India's East Coast. It helps teams compare freight assumptions, estimate landed cost, explore vessel economics, and see how scenario choices change the numerical outcome.

> **Important:** The current workspace uses clearly labeled illustrative demo data. It is a workflow prototype, not a live market-rate feed or a validated production prediction.

## Problem statement

Bulk cargo procurement decisions combine volatile freight, vessel fit, voyage count, and purchase assumptions. A decision maker needs more than a single quote: they need a transparent way to compare routes, timing, vessel sizes, and landed cost with the assumptions visible.

## Features

- Responsive enterprise dashboard with persistent navigation.
- Forecast workspace for cargo type, origin, destination, quantity, date, and vessel assumptions.
- Vessel comparison for Handysize, Supramax, Panamax, and Capesize.
- Procurement calculator with a visible landed-cost formula.
- Scenario planner for ship-now, ship-later, and change-vessel comparisons.
- Methodology page that explains the baseline, uncertainty range, data quality, and limitations.
- Standalone FastAPI backend under `backend/` with CSV loading, validation, missing-value handling, baseline forecasting, time-based evaluation, MAE reporting, vessel comparison, and procurement calculation endpoints.

## Technology stack

The interactive workspace is built with React 19, Vite, TypeScript, Tailwind CSS, shadcn-compatible UI primitives, Recharts, Wouter, and Lucide icons. The optional forecasting service uses Python 3.11, FastAPI, Pydantic, Pandas, scikit-learn, and Mangum for an AWS Lambda-compatible adapter.

## Architecture

```text
Browser / React + Vite
        |
        | local illustrative calculations (default demo mode)
        |
        | optional VITE_API_BASE_URL
        v
FastAPI service (backend/main.py)
        |
        +-- CSV history (backend/data/freight_history.csv)
        +-- baseline + time holdout evaluation
        +-- /health, /forecast, /compare-vessels, /calculate-procurement
```

The WebDev project shell runs the React preview through the scaffolded Node server. The FastAPI service is intentionally kept separate so a student team can deploy the frontend and backend independently on its own AWS account without requiring Amazon Bedrock.

## Dataset information

`backend/data/freight_history.csv` is a small, synthetic-but-realistic demonstration file with monthly observations for representative routes and cargo types. It is labeled illustrative in the UI and should be replaced before operational use. Expected columns are `date`, `origin_port`, `destination_port`, `cargo_type`, `freight_usd_per_tonne`, and `source_label`.

Do not present the sample values as real market rates. For a real deployment, document the data owner, currency, unit convention, route coverage, timestamp, and update cadence.

## Model methodology

The service starts with a route-aware trailing mean baseline. For a sufficiently large history, the service evaluates the baseline using a chronological holdout: the latest observations are not used to calculate the training mean, and MAE is reported from the held-out rows. If the selected dataset is too small, the response includes a warning and does not fabricate an accuracy score. A simple uncertainty range is returned only as an illustrative planning range, not a calibrated confidence interval.

The implementation leaves a seam for an advanced model, but a more complex model should only be enabled after checking row count, route coverage, missingness, and out-of-time performance.

## Local setup

### React workspace

```bash
pnpm install
pnpm dev
```

The WebDev preview uses the scaffolded Node server. The frontend works without a backend by using local demo calculations.

### FastAPI service

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check the service with:

```bash
curl http://localhost:8000/health
```

The frontend can be wired to the service by setting `VITE_API_BASE_URL=http://localhost:8000` and adding a small fetch adapter around the form submission. Keeping demo mode as the default makes the hackathon walkthrough deterministic when the API is not running.

## API reference

- `GET /health` — service and dataset status.
- `POST /forecast` — accepts cargo type, route, quantity, forecast date, and optional history CSV selection; returns a baseline estimate, total freight, illustrative range, warnings, and evaluation metadata.
- `POST /compare-vessels` — accepts quantity and optional vessel rate overrides; returns capacity, voyages, freight total, and unit cost for each class.
- `POST /calculate-procurement` — accepts quantity, purchase price, freight, and optional other costs; returns each line item and landed cost.

Interactive API docs are available at `/docs` when the FastAPI service is running.

## AWS deployment (low-cost path)

1. Build the React workspace with `pnpm build` and upload the static assets to an S3 bucket configured for static hosting, or place the bucket behind CloudFront for HTTPS and caching.
2. Package `backend/` for AWS Lambda. The included `Mangum` adapter exposes the FastAPI `app` to Lambda. Use API Gateway HTTP API as the public endpoint.
3. Set `VITE_API_BASE_URL` at frontend build time to the API Gateway URL if the browser should call the backend. Never hardcode credentials or commit `.env` files.
4. Keep the CSV inside the Lambda package for the first demo, or move it to S3 and load it at startup for a larger dataset. If the service grows beyond a small request-time model, consider a container-based Lambda or ECS Fargate.
5. Enable CloudFront only when the team needs HTTPS, a custom domain, or caching. The S3 bucket, CloudFront distribution, API Gateway, and Lambda may all incur charges; check AWS's current pricing and free-tier terms before enabling them.

Required frontend environment variable:

```text
VITE_API_BASE_URL=https://your-api-gateway.example.com
```

No AWS credentials are required by the browser. Use an IAM role for Lambda and least-privilege bucket access if the dataset is moved to S3.

## 3-minute demo flow

Introduce the bulk cargo planning problem. Open the dashboard and point out that the figures are illustrative. Open Freight forecast, choose an overseas port, Paradip, Coal, and 120,000 tonnes, then run the estimate. Compare vessel options and explain voyage count versus unit cost. Open Procurement calculator and show the visible landed-cost formula. Finish in Scenario planner and explain the numerical differences without calling one scenario universally best. Close with Methodology to show the CSV, baseline, time-based evaluation, and limitations.

## Limitations

This prototype does not ingest live market data, quote charter rates, model port congestion, account for demurrage or weather, validate vessel draft and berth constraints, or produce a calibrated confidence interval. The demo UI uses local calculations until the FastAPI adapter is connected. The backend's illustrative range is not a statistical guarantee.
