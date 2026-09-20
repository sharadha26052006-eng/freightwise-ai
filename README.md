# FreightWise AI

## AI-Powered Freight & Logistics Decision-Support Platform

FreightWise AI is an AI-powered freight and logistics decision-support platform designed to help companies importing bulk cargo to India's East Coast make faster and more informed logistics decisions.

The platform brings freight forecasting, vessel comparison, procurement calculations, and scenario planning together in one workspace.

> **Important:** The current workspace uses clearly labeled illustrative demo data. It is a workflow prototype, not a live market-rate feed or a validated production prediction.

---

## 🚢 Problem

Bulk cargo procurement involves several interconnected decisions:

- Freight cost assumptions
- Cargo quantity and planning
- Vessel selection
- Voyage economics
- Procurement and landed cost
- Shipment timing

Teams often need to compare these factors manually across different sources.

**FreightWise AI** brings these calculations and comparisons into a single decision-support workspace.

---

## 💡 Solution

FreightWise AI provides an interactive workspace where users can:

- 📊 Forecast freight costs
- 🚢 Compare different vessel types
- 💰 Estimate procurement and landed costs
- 🔄 Explore different shipping scenarios
- 📋 Understand the assumptions behind calculations
- 🔍 Review model methodology and limitations

The goal is to make logistics planning more transparent and easier to evaluate.

---

## ✨ Key Features

### 📊 Dashboard

Provides a high-level view of:

- Planned cargo
- Freight estimate
- Total freight
- Model confidence
- Freight outlook
- Vessel economics

### 📈 Freight Forecast

Users can enter shipment assumptions such as:

- Cargo type
- Origin
- Destination
- Cargo quantity
- Date
- Vessel assumptions

The system provides an illustrative freight estimate based on the available demo data.

### 🚢 Vessel Comparison

Users can compare vessel options such as:

- Handysize
- Supramax
- Panamax
- Capesize

The comparison helps users understand how vessel selection affects voyage economics.

### 💰 Procurement Calculator

Calculates procurement-related costs using visible assumptions and formulas.

### 🔄 Scenario Planner

Allows users to compare different planning scenarios, including:

- Ship now
- Ship later
- Change vessel

Users can see how changing assumptions affects the numerical outcome.

### 📚 Methodology

Explains:

- Forecasting approach
- Baseline assumptions
- Uncertainty range
- Data quality
- Model limitations

---

## 🛠️ Technical Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn-compatible UI components
- Recharts
- Wouter
- Lucide Icons

### Backend

- Python 3.11
- FastAPI
- Pydantic
- Pandas
- scikit-learn
- Mangum

### Data & Forecasting

- CSV-based freight history
- Route-aware trailing mean baseline
- Chronological holdout evaluation
- Mean Absolute Error (MAE)
- Illustrative uncertainty range

---

## 🏗️ Architecture

```text
User
  |
  v
FreightWise AI Web Interface
  |
  +--> Dashboard
  |
  +--> Freight Forecast
  |
  +--> Vessel Comparison
  |
  +--> Procurement Calculator
  |
  +--> Scenario Planner
  |
  +--> Methodology
  |
  v
FastAPI Backend
  |
  +--> Freight Forecasting
  |
  +--> Vessel Comparison
  |
  +--> Procurement Calculation
  |
  v
Freight History Dataset
  |
  v
AWS EC2
```

---

## ⚙️ Backend

The backend is built using Python and FastAPI.

It provides APIs for:

- Freight forecasting
- Vessel comparison
- Procurement calculations
- Health/status checking

### API Endpoints

```text
GET  /health
POST /forecast
POST /compare-vessels
POST /calculate-procurement
```

Interactive API documentation is available at `/docs` when the FastAPI service is running.

---

## ☁️ AWS Deployment

FreightWise AI is deployed using **Amazon EC2**.

Amazon EC2 provides the cloud compute environment used to run the application and make the platform publicly accessible.

The deployment gave our team practical experience with:

- Cloud application deployment
- Server configuration
- Networking
- Security groups
- Port configuration
- Running a web application on AWS

### AWS Service Used

- **Amazon EC2**

---

## 🧰 Build It

FreightWise AI was built using open-source technologies including:

- React
- TypeScript
- Vite
- Python
- FastAPI
- Pandas
- scikit-learn
- Tailwind CSS
- Recharts

The frontend provides the interactive decision-support interface.

The backend provides APIs for forecasting, vessel comparison, procurement calculations, and health monitoring.

---

## 📂 Dataset

The project currently uses a small illustrative freight-history dataset located at:

```text
backend/data/freight_history.csv
```

Expected fields include:

```text
date
origin_port
destination_port
cargo_type
freight_usd_per_tonne
source_label
```

The dataset is intended for demonstration and prototyping.

It should not be interpreted as a live market-rate feed.

---

## 🧠 Forecasting Methodology

FreightWise AI currently uses a **route-aware trailing mean baseline** for illustrative forecasting.

Where sufficient historical data is available, chronological holdout evaluation is used to calculate **Mean Absolute Error (MAE)**.

The application avoids presenting fabricated accuracy metrics when the available data is insufficient.

The uncertainty range shown in the application is illustrative and should not be interpreted as a statistically calibrated confidence interval.

---

## 💻 Running Locally

### Frontend

```bash
pnpm install
pnpm dev
```

### Backend

```bash
cd backend
python -m venv .venv
```

For Windows:

```bash
.venv\Scripts\activate
```

For Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

Check the backend:

```bash
curl http://localhost:8000/health
```

The frontend can be connected to the backend using:

```text
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🎥 Demo Flow

Our hackathon demonstration follows this flow:

1. Introduce the bulk cargo logistics problem.
2. Show the FreightWise AI dashboard.
3. Demonstrate Freight Forecast.
4. Compare different vessel options.
5. Use the Procurement Calculator.
6. Demonstrate the Scenario Planner.
7. Explain the Methodology and limitations.
8. Explain the technology stack and AWS deployment.

---

## 🔗 Project Links

### 🚀 Live Demo

[Open FreightWise AI Live Demo](http://13.60.5.161:3000)

### 💻 GitHub Repository

[FreightWise AI GitHub Repository](https://github.com/sharadha26052006-eng/freightwise-ai)

### 🔗 Team Leader LinkedIn

[Sharadha Kulkarni - LinkedIn](https://www.linkedin.com/in/sharadha-r-585254389/)

---

## 👥 Team

### Sharadha — Team Lead

Contributions:

- Project planning
- Frontend development
- Dashboard design
- Integration of freight and logistics modules
- AWS deployment
- Testing
- Overall project coordination

### Ganesh

Contributions:

- Backend and AI functionality
- Freight forecasting
- Logistics decision-support features
- Testing and debugging
- Technical integration

---

## 🏆 Hackathon

**Project:** FreightWise AI

**Track:** Ship It

FreightWise AI was developed as a hackathon project to explore how AI, data analysis, and cloud technologies can support freight and logistics decision-making.

---

## 🚀 Future Improvements

Future versions could include:

- Live freight-rate data
- Real-time port information
- More advanced forecasting models
- Weather and congestion data
- Automated data ingestion
- More detailed vessel constraints
- Production-grade model monitoring
- Role-based access
- Historical performance dashboards

---

## ⚠️ Limitations

The current prototype does not include:

- Live freight market data
- Live charter rates
- Real-time port congestion
- Demurrage calculations
- Weather impacts
- Detailed draft and berth constraints
- Calibrated statistical confidence intervals

The current dataset is illustrative and should be replaced with validated operational data before production use.

---

## 📌 Disclaimer

FreightWise AI is a prototype decision-support application.

The current forecasts and calculations use illustrative data and assumptions and should not be treated as live market information, financial advice, or operational shipping recommendations.

---

## 📄 License

This project was created for educational and hackathon purposes.