import { useState, useRef } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounce = useRef(null);

  const search = async (q) => {
    if (q.length < 3) {
      setResults(null);
      setError(q.length > 0 ? "Type at least 3 characters." : null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/departures?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else setResults(data);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(val), 400);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1>🚆 Lagovia Train Tracker</h1>
      <p style={{ color: "#666" }}>Next 15 minutes · Live from Belgium</p>

      <input
        type="text"
        placeholder='Search station e.g. "Bru" or "Gent"'
        value={query}
        onChange={handleChange}
        style={{ width: "100%", padding: 12, fontSize: 16, marginBottom: 16, marginTop: 16 }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading…</p>}

      {results && results.stations.length === 0 && (
        <p>No departures in the next 15 minutes for "{results.query}".</p>
      )}

      {results && results.stations.map(station => (
        <div key={station.station_id} style={{ marginBottom: 32 }}>
          <h2 style={{ borderBottom: "2px solid #000", paddingBottom: 8 }}>
            {station.station_name}
          </h2>
          <table width="100%" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={th}>Train</th>
                <th style={th}>To</th>
                <th style={th}>Scheduled</th>
                <th style={th}>Delay</th>
                <th style={th}>Platform</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {station.departures.map(dep => (
                <tr
                  key={dep.train_id + dep.scheduled_time}
                  style={{ opacity: dep.cancelled ? 0.5 : 1 }}
                >
                  <td style={td}><strong>{dep.train_id}</strong></td>
                  <td style={td}>{dep.destination}</td>
                  <td style={td}>
                    {new Date(dep.scheduled_time).toLocaleTimeString("en-GB", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </td>
                  <td style={{ ...td, color: dep.delay_minutes > 0 ? "orange" : "green" }}>
                    {dep.delay_minutes > 0 ? `+${dep.delay_minutes} min` : "On time"}
                  </td>
                  <td style={td}>{dep.platform || "—"}</td>
                  <td style={td}>{dep.cancelled ? "❌ Cancelled" : "✅"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

const th = { padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #ddd" };
const td = { padding: "8px 12px", borderBottom: "1px solid #eee" };

export default App;