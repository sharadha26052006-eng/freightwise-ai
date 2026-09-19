# FreightWise forecasting service

This folder is a standalone FastAPI service for the FreightWise frontend. It deliberately starts with a route-aware trailing mean baseline and returns warnings whenever the dataset is too small for a time-based evaluation.

## Local

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the interactive API reference.

## AWS Lambda

The module exposes `handler` through Mangum when the dependency is installed. Package the folder with its dependencies, set the Lambda handler to `main.handler`, and connect it to an API Gateway HTTP API. For production, restrict CORS to the frontend CloudFront domain and store a larger governed CSV in S3 rather than committing it to the function package.

The current CSV is synthetic illustrative data and must not be represented as a live market source.
