import { useMemo, useState } from "react";
import { calculateScenario } from "../../../shared/scenarios";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Fuel,
  Gauge,
  Info,
  LayoutDashboard,
  Menu,
  MoveRight,
  Package,
  RefreshCw,
  Route,
  Ship,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ViewKey = "dashboard" | "forecast" | "vessels" | "procurement" | "scenarios" | "methodology";

type Vessel = {
  name: string;
  capacity: number;
  rate: number;
  color: string;
  note: string;
};

const navItems: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "forecast", label: "Freight forecast", icon: Activity },
  { key: "vessels", label: "Vessel comparison", icon: Ship },
  { key: "procurement", label: "Procurement calculator", icon: Calculator },
  { key: "scenarios", label: "Scenario planner", icon: Target },
  { key: "methodology", label: "Methodology", icon: BookOpen },
];

const forecastData = [
  { month: "Oct", observed: 31.8, forecast: null, lower: null, upper: null },
  { month: "Nov", observed: 32.6, forecast: null, lower: null, upper: null },
  { month: "Dec", observed: 33.4, forecast: null, lower: null, upper: null },
  { month: "Jan", observed: 32.9, forecast: null, lower: null, upper: null },
  { month: "Feb", observed: 34.1, forecast: null, lower: null, upper: null },
  { month: "Mar", observed: 35.2, forecast: null, lower: null, upper: null },
  { month: "Apr", observed: null, forecast: 35.7, lower: 33.8, upper: 37.6 },
  { month: "May", observed: null, forecast: 36.5, lower: 34.1, upper: 38.9 },
  { month: "Jun", observed: null, forecast: 37.1, lower: 34.2, upper: 40.0 },
  { month: "Jul", observed: null, forecast: 37.8, lower: 34.4, upper: 41.2 },
];

const vesselOptions: Vessel[] = [
  { name: "Handysize", capacity: 35_000, rate: 42.5, color: "#7bc9bc", note: "Flexible ports · more voyages" },
  { name: "Supramax", capacity: 55_000, rate: 36.8, color: "#36a99b", note: "Balanced fit for this cargo" },
  { name: "Panamax", capacity: 82_000, rate: 32.9, color: "#1d7f79", note: "Lower unit cost · deeper draft" },
  { name: "Capesize", capacity: 170_000, rate: 28.7, color: "#164e63", note: "Scale economics · fewer ports" },
];

const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const DECIMAL = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const formatINR = (value: number) => `₹${INR.format(Math.round(value))}`;
const formatNumber = (value: number) => INR.format(Math.round(value));

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "teal",
  trend,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Activity;
  tone?: "teal" | "navy" | "amber" | "slate";
  trend?: "up" | "down";
}) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <div className="metric-topline">
        <span className="eyebrow">{label}</span>
        <span className="metric-icon"><Icon size={17} strokeWidth={1.8} /></span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-helper">
        {trend ? (trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />) : <span className="metric-dot" />}
        {helper}
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown size={15} />
      </span>
    </label>
  );
}

function TextField({ label, value, onChange, suffix, type = "number" }: { label: string; value: string; onChange: (value: string) => void; suffix?: string; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap">
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} min={type === "number" ? 0 : undefined} />
        {suffix && <em>{suffix}</em>}
      </span>
    </label>
  );
}

function DataQuality({ level = "Illustrative" }: { level?: string }) {
  return <span className={`quality-badge ${level === "Illustrative" ? "quality-demo" : "quality-good"}`}><span />{level}</span>;
}

function EmptyNotice() {
  return <div className="demo-notice"><Info size={16} /><span><strong>Illustrative Demo Data</strong> — estimates are designed to demonstrate workflow, not represent live market rates or a validated prediction.</span></div>;
}

function ForecastChart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "chart chart-compact" : "chart"}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={forecastData} margin={{ top: 12, right: 10, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2c9a92" stopOpacity={0.26} /><stop offset="100%" stopColor="#2c9a92" stopOpacity={0.02} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e4eceb" strokeDasharray="4 5" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#7b8f91", fontSize: 11 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7b8f91", fontSize: 11 }} tickFormatter={(value) => `₹${value}`} domain={[28, 43]} />
          <Tooltip formatter={(value: number | string, name: string) => [value == null ? "—" : `₹${value}/t`, name === "observed" ? "Observed" : name === "forecast" ? "Baseline forecast" : name === "lower" ? "Lower range" : "Upper range"]} contentStyle={{ borderRadius: 12, border: "1px solid #dbe8e6", boxShadow: "0 10px 30px rgba(16, 52, 62, .10)", fontSize: 12 }} />
          <Area type="monotone" dataKey="upper" stroke="none" fill="url(#forecastFill)" connectNulls />
          <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" connectNulls />
          <Line type="monotone" dataKey="observed" stroke="#163d4b" strokeWidth={2.4} dot={{ r: 3, fill: "#163d4b", strokeWidth: 0 }} connectNulls={false} />
          <Line type="monotone" dataKey="forecast" stroke="#2c9a92" strokeWidth={2.4} strokeDasharray="5 5" dot={{ r: 3, fill: "#2c9a92", strokeWidth: 0 }} connectNulls={false} />
          <ReferenceLine x="Apr" stroke="#b4c8c7" strokeDasharray="3 4" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  return (
    <div className="view-stack">
      <div className="page-heading">
        <div>
          <div className="breadcrumb"><span>Workspace</span><MoveRight size={14} /><strong>Overview</strong></div>
          <h1>Good morning, plan with confidence.</h1>
          <p>Build a freight view for your next India East Coast cargo window.</p>
        </div>
        <button className="button button-primary" onClick={() => onNavigate("forecast")}><Sparkles size={16} /> New forecast</button>
      </div>
      <EmptyNotice />
      <div className="metrics-grid">
        <MetricCard label="Planned cargo" value="120,000 t" helper="Across 2 active scenarios" icon={Package} tone="navy" />
        <MetricCard label="Freight estimate" value="₹35.7 / t" helper="+2.8% vs. trailing baseline" icon={TrendingUp} tone="teal" trend="up" />
        <MetricCard label="Total freight" value="₹42.8M" helper="Before duties and inland haulage" icon={Fuel} tone="amber" />
        <MetricCard label="Model confidence" value="Moderate" helper="6 monthly observations" icon={Gauge} tone="slate" />
      </div>
      <div className="dashboard-grid">
        <Panel title="East Coast freight outlook" subtitle="Illustrative baseline · USD-equivalent per tonne" className="forecast-panel" action={<button className="text-button" onClick={() => onNavigate("forecast")}>Open forecast <MoveRight size={14} /></button>}>
          <div className="chart-legend"><span><i className="legend-line legend-observed" />Observed</span><span><i className="legend-line legend-forecast" />Baseline forecast</span><span><i className="legend-band" />Range</span></div>
          <ForecastChart />
          <div className="chart-footer"><span><strong>₹35.7/t</strong> next-window baseline</span><span><strong>₹33.8–₹37.6/t</strong> illustrative range</span></div>
        </Panel>
        <Panel title="Vessel economics" subtitle="Estimated unit freight cost by class" action={<button className="icon-button" aria-label="Open vessel comparison" onClick={() => onNavigate("vessels")}><MoveRight size={16} /></button>}>
          <div className="chart vessel-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={vesselOptions} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 0 }}><CartesianGrid horizontal={false} stroke="#e4eceb" /><XAxis type="number" hide domain={[0, 50]} /><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#506a6d", fontSize: 11 }} width={72} /><Tooltip cursor={{ fill: "#f4f8f7" }} formatter={(value: number) => [`₹${value}/t`, "Illustrative rate"]} contentStyle={{ borderRadius: 12, border: "1px solid #dbe8e6", fontSize: 12 }} /><Bar dataKey="rate" radius={[0, 5, 5, 0]} barSize={18}>{vesselOptions.map((vessel) => <Cell key={vessel.name} fill={vessel.color} />)}</Bar></BarChart></ResponsiveContainer></div>
          <div className="mini-callout"><span className="callout-icon"><Ship size={16} /></span><span><strong>Supramax is the balanced fit</strong><small>2 voyages for 120,000 tonnes at the current demo input</small></span></div>
        </Panel>
      </div>
      <div className="lower-grid">
        <Panel title="Recent planning runs" subtitle="Saved locally in this demo workspace" action={<button className="text-button" onClick={() => onNavigate("scenarios")}>View all <MoveRight size={14} /></button>}>
          <div className="history-list">
            <div className="history-row"><span className="history-mark history-teal"><Route size={15} /></span><span className="history-main"><strong>Odisha coal replenishment</strong><small>Paradip → Visakhapatnam · 120,000 t</small></span><span className="history-value"><strong>₹42.8M</strong><small>just now</small></span><DataQuality /></div>
            <div className="history-row"><span className="history-mark history-navy"><Ship size={15} /></span><span className="history-main"><strong>East coast iron ore window</strong><small>Port Hedland → Paradip · 80,000 t</small></span><span className="history-value"><strong>₹31.1M</strong><small>yesterday</small></span><DataQuality level="Illustrative" /></div>
            <div className="history-row"><span className="history-mark history-amber"><Calculator size={15} /></span><span className="history-main"><strong>Q4 landed cost sensitivity</strong><small>Newcastle → Chennai · 55,000 t</small></span><span className="history-value"><strong>₹28.6M</strong><small>Sep 17</small></span><DataQuality level="Illustrative" /></div>
          </div>
        </Panel>
        <Panel title="Decision signals" subtitle="Read before presenting the estimate">
          <div className="signal-list"><div className="signal-row"><span className="signal-icon signal-up"><TrendingUp size={16} /></span><span><strong>Freight is trending up</strong><small>Baseline rises 5.9% over the next four demo months.</small></span></div><div className="signal-row"><span className="signal-icon signal-down"><TrendingDown size={16} /></span><span><strong>Scale saves on unit cost</strong><small>Panamax saves ₹2.8/t vs. Supramax in this illustration.</small></span></div><div className="signal-row"><span className="signal-icon signal-neutral"><CircleHelp size={16} /></span><span><strong>Data confidence is moderate</strong><small>Replace the sample CSV before using for a live decision.</small></span></div></div>
        </Panel>
      </div>
    </div>
  );
}

function ForecastView() {
  const [cargo, setCargo] = useState("120000");
  const [origin, setOrigin] = useState("Newcastle");
  const [destination, setDestination] = useState("Paradip");
  const [cargoType, setCargoType] = useState("Coal");
  const [date, setDate] = useState("2026-05-15");
  const [vessel, setVessel] = useState("Supramax");
  const [hasRun, setHasRun] = useState(false);
  const quantity = Number(cargo) || 0;
  const vesselRate = vesselOptions.find((item) => item.name === vessel)?.rate ?? 36.8;
  const estimate = vesselRate + (cargoType === "Fertilizer" ? 1.4 : cargoType === "Iron ore" ? -0.9 : 0);
  const total = quantity * estimate;
  return (
    <div className="view-stack">
      <div className="page-heading"><div><div className="breadcrumb"><span>Freight planning</span><MoveRight size={14} /><strong>Forecast</strong></div><h1>Build a freight forecast</h1><p>Start with a simple, transparent baseline. Upgrade the model when your historical file earns it.</p></div><DataQuality /></div>
      <EmptyNotice />
      <div className="module-grid">
        <Panel title="Forecast inputs" subtitle="All fields are editable demo inputs"><div className="form-grid"><SelectField label="Cargo type" value={cargoType} onChange={setCargoType} options={["Coal", "Iron ore", "Fertilizer"]} /><SelectField label="Origin port" value={origin} onChange={setOrigin} options={["Newcastle", "Port Hedland", "Richards Bay", "Tubarao"]} /><SelectField label="Indian destination" value={destination} onChange={setDestination} options={["Paradip", "Visakhapatnam", "Chennai"]} /><TextField label="Cargo quantity" value={cargo} onChange={setCargo} suffix="tonnes" /><TextField label="Forecast date" value={date} onChange={setDate} type="date" /><SelectField label="Vessel assumption" value={vessel} onChange={setVessel} options={vesselOptions.map((item) => item.name)} /></div><div className="form-actions"><span className="form-hint"><Info size={14} /> Uses a trailing mean baseline for the demo dataset.</span><button className="button button-primary" onClick={() => setHasRun(true)}><RefreshCw size={16} /> {hasRun ? "Refresh estimate" : "Run forecast"}</button></div></Panel>
        <Panel title="Estimate summary" subtitle={hasRun ? `For ${formatNumber(quantity)} tonnes · ${date}` : "Run the forecast to populate this panel"} className="summary-panel"><div className={`estimate-box ${hasRun ? "estimate-live" : ""}`}><span className="eyebrow">Estimated freight / tonne</span><strong>{hasRun ? `₹${DECIMAL.format(estimate)}` : "—"}</strong><span className="estimate-range">{hasRun ? "Illustrative range ₹33.8–₹37.6/t" : "Awaiting input"}</span></div><div className="summary-lines"><div><span>Total freight</span><strong>{hasRun ? formatINR(total) : "—"}</strong></div><div><span>Route</span><strong>{origin} <MoveRight size={13} /> {destination}</strong></div><div><span>Data quality</span><DataQuality /></div></div><div className="summary-warning"><CircleHelp size={16} /><span><strong>Not a validated prediction.</strong> The selected history is illustrative and has only six observations.</span></div></Panel>
      </div>
      <Panel title="Forecast trend and range" subtitle="Observed values transition into a baseline estimate at the forecast date"><div className="chart-legend"><span><i className="legend-line legend-observed" />Observed</span><span><i className="legend-line legend-forecast" />Baseline forecast</span><span><i className="legend-band" />Illustrative uncertainty range</span></div><ForecastChart /></Panel>
      <Panel title="Model notes" subtitle="What this output does and does not mean"><div className="notes-grid"><div><span className="note-number">01</span><strong>Baseline first</strong><p>For a small dataset, FreightWise uses a trailing mean rather than implying a complex model is more accurate.</p></div><div><span className="note-number">02</span><strong>Time-aware evaluation</strong><p>When enough rows exist, the backend holds out the latest records and reports MAE without inventing an accuracy score.</p></div><div><span className="note-number">03</span><strong>Replace before use</strong><p>Upload a real, consistently sourced freight history with route, date, currency, and unit definitions.</p></div></div></Panel>
    </div>
  );
}

function VesselsView() {
  const [quantity, setQuantity] = useState("120000");
  const tonnes = Number(quantity) || 0;
  return <div className="view-stack"><div className="page-heading"><div><div className="breadcrumb"><span>Freight planning</span><MoveRight size={14} /><strong>Vessel comparison</strong></div><h1>Compare the fleet fit</h1><p>Understand the trade-off between scale, voyage count, and unit economics.</p></div><DataQuality /></div><EmptyNotice /><Panel title="Cargo input" subtitle="Change the quantity to see voyage requirements update"><div className="inline-form"><TextField label="Cargo quantity" value={quantity} onChange={setQuantity} suffix="tonnes" /><span className="inline-note"><Info size={15} /> Demo rates are explicit inputs, not live charter quotes.</span></div></Panel><Panel title="Vessel options" subtitle="Illustrative rates for decision framing"><div className="table-wrap"><table><thead><tr><th>Class</th><th>Capacity</th><th>Voyages required</th><th>Demo rate</th><th>Estimated freight</th><th>Readout</th></tr></thead><tbody>{vesselOptions.map((item) => { const voyages = Math.ceil(tonnes / item.capacity); const cost = tonnes * item.rate; return <tr key={item.name}><td><span className="vessel-name"><i style={{ background: item.color }} />{item.name}</span></td><td>{formatNumber(item.capacity)} t</td><td><strong>{voyages}</strong></td><td>₹{DECIMAL.format(item.rate)}/t</td><td><strong>{formatINR(cost)}</strong></td><td><span className="row-note">{item.note}</span></td></tr>; })}</tbody></table></div><div className="table-footnote"><Info size={14} /> Assumes the full cargo quantity is carried and rounded up to whole voyages. Draft, port restrictions, demurrage, and ballast are not modeled.</div></Panel><Panel title="Unit cost curve" subtitle="Scale economics shown as a simple comparison"><div className="chart vessel-large-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={vesselOptions} margin={{ top: 10, right: 16, bottom: 0, left: -12 }}><CartesianGrid vertical={false} stroke="#e4eceb" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#506a6d", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#7b8f91", fontSize: 11 }} tickFormatter={(value) => `₹${value}`} /><Tooltip formatter={(value: number) => [`₹${value}/t`, "Demo rate"]} contentStyle={{ borderRadius: 12, border: "1px solid #dbe8e6", fontSize: 12 }} /><Bar dataKey="rate" radius={[5, 5, 0, 0]} barSize={44}>{vesselOptions.map((item) => <Cell key={item.name} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></div></Panel></div>;
}

function ProcurementView() {
  const [quantity, setQuantity] = useState("120000");
  const [purchase, setPurchase] = useState("92");
  const [freight, setFreight] = useState("35.7");
  const [other, setOther] = useState("3.5");
  const qty = Number(quantity) || 0;
  const purchaseTotal = qty * (Number(purchase) || 0);
  const freightTotal = qty * (Number(freight) || 0);
  const otherTotal = qty * (Number(other) || 0);
  const landed = purchaseTotal + freightTotal + otherTotal;
  return <div className="view-stack"><div className="page-heading"><div><div className="breadcrumb"><span>Procurement</span><MoveRight size={14} /><strong>Landed cost</strong></div><h1>Make the landed cost legible</h1><p>Bring purchase price, freight, and optional costs into one auditable calculation.</p></div><button className="button button-quiet"><FileText size={16} /> Export summary</button></div><EmptyNotice /><div className="module-grid"><Panel title="Cost assumptions" subtitle="Enter a per-tonne value for each cost line"><div className="form-grid"><TextField label="Cargo quantity" value={quantity} onChange={setQuantity} suffix="tonnes" /><TextField label="Purchase price" value={purchase} onChange={setPurchase} suffix="₹ / t" /><TextField label="Freight estimate" value={freight} onChange={setFreight} suffix="₹ / t" /><TextField label="Insurance + port charges" value={other} onChange={setOther} suffix="₹ / t" /></div><div className="procurement-assumption"><Info size={15} /><span>Other costs are optional and illustrative. Duties, taxes, inland haulage, and financing are not included.</span></div></Panel><Panel title="Landed cost result" subtitle={`For ${formatNumber(qty)} tonnes`} className="summary-panel"><div className="landed-total"><span className="eyebrow">Estimated landed cost / tonne</span><strong>{qty ? `₹${DECIMAL.format(landed / qty)}` : "—"}</strong><small>Purchase + freight + other costs</small></div><div className="summary-lines"><div><span>Cargo purchase</span><strong>{formatINR(purchaseTotal)}</strong></div><div><span>Freight</span><strong>{formatINR(freightTotal)}</strong></div><div><span>Other costs</span><strong>{formatINR(otherTotal)}</strong></div><div className="summary-total"><span>Estimated landed cost</span><strong>{formatINR(landed)}</strong></div></div></Panel></div><Panel title="Calculation trace" subtitle="A transparent formula you can show in a review"><div className="formula-card"><span>{formatNumber(qty)} t × ₹{DECIMAL.format(Number(purchase) || 0)}/t</span><strong>+</strong><span>{formatNumber(qty)} t × ₹{DECIMAL.format(Number(freight) || 0)}/t</span><strong>+</strong><span>{formatNumber(qty)} t × ₹{DECIMAL.format(Number(other) || 0)}/t</span><strong>=</strong><b>{formatINR(landed)}</b></div><div className="formula-caption">The calculator intentionally exposes the arithmetic; it does not hide assumptions in a single blended number.</div></Panel></div>;
}

function ScenariosView() {
  const vesselByName = useMemo(() => Object.fromEntries(vesselOptions.map((vessel) => [vessel.name, vessel])), []);
  const [laterMarketCase, setLaterMarketCase] = useState(false);
  const [scenarioInputs, setScenarioInputs] = useState({
    now: { vessel: "Supramax", date: "2026-05-15", cargoQuantity: "120000" },
    later: { vessel: "Supramax", date: "2026-06-15", cargoQuantity: "120000" },
    change: { vessel: "Panamax", date: "2026-05-15", cargoQuantity: "120000" },
  });
  const updateScenario = (key: "now" | "later" | "change", field: "vessel" | "date" | "cargoQuantity", value: string) => {
    setScenarioInputs((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));
  };
  const makeScenario = (key: "now" | "later" | "change", name: string, uplift = 0) => {
    const input = scenarioInputs[key];
    const vessel = vesselByName[input.vessel] ?? vesselOptions[0];
    const result = calculateScenario({ name, vessel: vessel.name, date: input.date, cargoQuantity: Number(input.cargoQuantity), vesselCapacity: vessel.capacity, rate: vessel.rate, purchasePrice: 92, otherCostsPerTonne: 3.5, laterRateUplift: uplift });
    return { ...result, key };
  };
  const results = [makeScenario("now", "Ship now"), makeScenario("later", "Ship later", laterMarketCase ? 0.04 : 0), makeScenario("change", "Change vessel")];
  const update = (key: "now" | "later" | "change", field: "vessel" | "date" | "cargoQuantity") => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => updateScenario(key, field, event.target.value);
  const ScenarioInput = ({ result }: { result: ReturnType<typeof makeScenario> }) => (
    <div className="scenario-card-inputs">
      <label className="scenario-field"><span>Vessel</span><span className="select-wrap"><select value={scenarioInputs[result.key].vessel} onChange={update(result.key, "vessel")}><option>Handysize</option><option>Supramax</option><option>Panamax</option><option>Capesize</option></select><ChevronDown size={13} /></span></label>
      <label className="scenario-field"><span>Shipping date</span><input type="date" value={scenarioInputs[result.key].date} onChange={update(result.key, "date")} /></label>
      <label className="scenario-field"><span>Cargo quantity</span><span className="input-wrap"><input type="number" min="1" value={scenarioInputs[result.key].cargoQuantity} onChange={update(result.key, "cargoQuantity")} /><em>t</em></span></label>
    </div>
  );
  return <div className="view-stack"><div className="page-heading"><div><div className="breadcrumb"><span>Planning</span><MoveRight size={14} /><strong>Scenarios</strong></div><h1>Compare the decision paths</h1><p>Each card has its own inputs. Change one path without overwriting the others.</p></div><DataQuality /></div><EmptyNotice /><Panel title="Scenario assumptions" subtitle="Use independent controls to make each planning path concrete"><div className="scenario-controls"><div className="control-chip"><Clock3 size={16} /><span><strong>Shared cost assumptions</strong><small>Purchase ₹92/t · other costs ₹3.5/t</small></span></div><button className={`toggle ${laterMarketCase ? "toggle-on" : ""}`} onClick={() => setLaterMarketCase((value) => !value)} aria-label="Toggle illustrative later market rate case"><span /></button><span className="control-copy"><strong>Illustrative later-rate case</strong><small>{laterMarketCase ? "Ship later freight is uplifted by 4%" : "Dates alone do not change rates"}</small></span></div></Panel><Panel title="Scenario comparison" subtitle="Independent inputs · same purchase and other-cost assumptions"><div className="scenario-grid">{results.map((result, index) => <div className={`scenario-card ${index === 0 ? "scenario-selected" : ""}`} key={result.name}><div className="scenario-card-top"><span className="scenario-index">0{index + 1}</span>{index === 0 && <span className="recommended-label">Current plan</span>}</div><h3>{result.name}</h3><ScenarioInput result={result} />{!result.isValid && <div className="scenario-error"><CircleHelp size={13} />{result.warning}</div>}<div className="scenario-metrics"><div><span>Voyages</span><strong>{result.isValid ? result.voyages : "—"}</strong></div><div><span>Freight</span><strong>{result.isValid ? `₹${(result.freightCost / 1_000_000).toFixed(3)}M` : "—"}</strong></div><div><span>Landed cost</span><strong>{result.isValid ? `₹${(result.landedCost / 1_000_000).toFixed(3)}M` : "—"}</strong></div></div><div className="scenario-footer"><span>{result.vessel} · {result.date}</span><DataQuality /></div></div>)}</div></Panel><Panel title="Landed cost comparison" subtitle="Chart follows each card's current quantity, vessel, date, and rate assumption"><div className="chart scenario-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={results} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}><CartesianGrid vertical={false} stroke="#e4eceb" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#506a6d", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#7b8f91", fontSize: 11 }} tickFormatter={(value) => `₹${value}M`} /><Tooltip formatter={(value: number) => [`₹${value.toFixed(3)}M`, "Landed cost"]} contentStyle={{ borderRadius: 12, border: "1px solid #dbe8e6", fontSize: 12 }} /><Bar dataKey="landedCost" fill="#2c9a92" radius={[5, 5, 0, 0]} barSize={42} /></BarChart></ResponsiveContainer></div><div className="comparison-note"><Info size={15} /><span><strong>Formula:</strong> voyages = ceiling(quantity ÷ usable capacity); freight = quantity × selected rate; landed cost = purchase + freight + other costs. Capacities are Handysize 35k, Supramax 55k, Panamax 82k, Capesize 170k tonnes. Actual availability, draft, berth restrictions, and cargo compatibility must be checked.</span></div><div className="comparison-note"><CircleHelp size={15} /><span>Ship-later rate changes are illustrative only unless supported by real historical data. A larger vessel is not automatically cheaper or suitable.</span></div></Panel></div>;
}
function MethodologyView() {
  return <div className="view-stack"><div className="page-heading"><div><div className="breadcrumb"><span>FreightWise AI</span><MoveRight size={14} /><strong>Methodology</strong></div><h1>Make the model easy to trust</h1><p>FreightWise is designed to show its work before it shows a number.</p></div><span className="status-pill"><span /> Demo mode</span></div><div className="method-hero"><div><span className="eyebrow">Model design principle</span><h2>Simple enough to audit. Structured enough to extend.</h2><p>The current workspace uses an illustrative CSV and a transparent baseline. When a real history is available, the backend can evaluate a stronger model with a time-based holdout—without silently turning a small dataset into false certainty.</p></div><div className="method-orbit"><div className="orbit-center"><Ship size={22} /><span>Freight<br />signal</span></div><span className="orbit-tag orbit-tag-one">Data quality</span><span className="orbit-tag orbit-tag-two">Route fit</span><span className="orbit-tag orbit-tag-three">Cost trace</span></div></div><div className="method-grid"><div className="method-card"><span className="method-icon"><FileText size={18} /></span><span className="eyebrow">Input</span><h3>Historical freight CSV</h3><p>Date, route, cargo type, and a consistently defined freight rate. Missing values are handled explicitly.</p></div><div className="method-card"><span className="method-icon"><TrendingUp size={18} /></span><span className="eyebrow">Baseline</span><h3>Trailing mean</h3><p>A simple average gives a stable reference point for small datasets and makes the assumptions visible.</p></div><div className="method-card"><span className="method-icon"><Activity size={18} /></span><span className="eyebrow">Evaluation</span><h3>Time-based holdout</h3><p>With enough rows, the latest observations are held out and MAE is calculated at runtime. No fabricated accuracy.</p></div><div className="method-card"><span className="method-icon"><CircleHelp size={18} /></span><span className="eyebrow">Limitations</span><h3>Not a charter quote</h3><p>Fuel, congestion, weather, demurrage, and port constraints need richer data before operational use.</p></div></div><Panel title="What to replace before production" subtitle="A practical handoff list for the student team"><div className="check-list"><div><Check size={16} /><span>Replace the illustrative CSV with a governed source and document currency / unit conventions.</span></div><div><Check size={16} /><span>Validate route-level coverage and add a minimum row count check before exposing advanced models.</span></div><div><Check size={16} /><span>Connect the frontend to the FastAPI endpoints through <code>VITE_API_BASE_URL</code> when deployed.</span></div><div><Check size={16} /><span>Review AWS costs for CloudFront, Lambda/API Gateway, S3, and any persistent database usage.</span></div></div></Panel></div>;
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeItem = navItems.find((item) => item.key === activeView) ?? navItems[0];
  const navigate = (view: ViewKey) => { setActiveView(view); setMobileOpen(false); };
  const content = activeView === "dashboard" ? <Dashboard onNavigate={navigate} /> : activeView === "forecast" ? <ForecastView /> : activeView === "vessels" ? <VesselsView /> : activeView === "procurement" ? <ProcurementView /> : activeView === "scenarios" ? <ScenariosView /> : <MethodologyView />;
  return <div className="app-shell"><aside className={`app-sidebar ${mobileOpen ? "sidebar-open" : ""}`}><div className="brand"><span className="brand-mark"><Route size={19} strokeWidth={2.4} /></span><span><strong>FreightWise</strong><small>AI workspace</small></span><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div><div className="workspace-switcher"><span className="workspace-dot" /><span><small>Workspace</small><strong>East Coast imports</strong></span><ChevronDown size={15} /></div><nav><span className="nav-label">Plan & decide</span>{navItems.slice(0, 5).map((item) => { const Icon = item.icon; return <button key={item.key} className={`nav-item ${activeView === item.key ? "nav-active" : ""}`} onClick={() => navigate(item.key)}><Icon size={17} /><span>{item.label}</span>{item.key === "forecast" && <span className="nav-new">New</span>}</button>; })}<span className="nav-label nav-label-spaced">Reference</span><button className={`nav-item ${activeView === "methodology" ? "nav-active" : ""}`} onClick={() => navigate("methodology")}><BookOpen size={17} /><span>Methodology</span></button></nav><div className="sidebar-bottom"><div className="help-card"><CircleHelp size={17} /><span><strong>Need a hand?</strong><small>Read the 3-minute demo guide</small></span><MoveRight size={15} /></div><div className="user-card"><span className="avatar">AM</span><span><strong>Analytics mode</strong><small>Illustrative workspace</small></span><span className="online-dot" /></div></div></aside><div className={`sidebar-scrim ${mobileOpen ? "scrim-visible" : ""}`} onClick={() => setMobileOpen(false)} /><main className="main-content"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="topbar-context"><span className="context-icon"><activeItem.icon size={16} /></span><span>{activeItem.label}</span></div><div className="topbar-actions"><span className="topbar-date"><Clock3 size={14} /> Sep 20, 2026</span><button className="button button-quiet button-small"><span className="live-dot" /> Demo data</button><button className="avatar avatar-small">AM</button></div></header><div className="page-container">{content}</div><footer className="app-footer"><span>FreightWise AI · Ship It track demo</span><span>Data is illustrative · <button onClick={() => navigate("methodology")}>Read methodology</button></span></footer></main></div>;
}
