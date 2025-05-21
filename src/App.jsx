import React, { useState } from "react";
import "./App.css";

// Nutzenpunkte rekursiv berechnen
function buildUtilityPoints(lower, upper, intervals) {
  const points = [
    { x: Number(lower), u: 0 },
    { x: Number(upper), u: 1 }
  ];
  function addMidpoints(subLow, subHigh, subUlow, subUhigh) {
    const mp = intervals.find(
      (intv) =>
        intv.low === subLow &&
        intv.high === subHigh &&
        intv.midpoint !== null
    );
    if (mp) {
      const uMid = (subUlow + subUhigh) / 2;
      points.push({ x: mp.midpoint, u: uMid });
      addMidpoints(subLow, mp.midpoint, subUlow, uMid);
      addMidpoints(mp.midpoint, subHigh, uMid, subUhigh);
    }
  }
  addMidpoints(Number(lower), Number(upper), 0, 1);
  // Sortiere die Punkte nach x
  return points.sort((a, b) => a.x - b.x);
}

export function App() {
  const [lower, setLower] = useState(0);
  const [upper, setUpper] = useState(100);
  const [started, setStarted] = useState(false);
  const [intervals, setIntervals] = useState([]);
  const [selectedIntervalIdx, setSelectedIntervalIdx] = useState(null);
  const [midpointInput, setMidpointInput] = useState("");

  const width = 420;
  const height = 230;
  const padding = 40;

  // Initialisierung
  const start = () => {
    setIntervals([
      {
        low: Number(lower),
        high: Number(upper),
        uLow: 0,
        uHigh: 1,
        midpoint: null
      }
    ]);
    setStarted(true);
    setMidpointInput("");
    setSelectedIntervalIdx(null);
  };

  // Intervall auswählen
  const selectInterval = (idx) => {
    setSelectedIntervalIdx(idx);
    setMidpointInput("");
  };

  // Mittelpunkt setzen
  const submitMidpoint = () => {
    if (selectedIntervalIdx === null) return;
    const midpoint = Number(midpointInput);
    const { low, high, uLow, uHigh } = intervals[selectedIntervalIdx];
    const uMid = (uLow + uHigh) / 2;

    if (
      isNaN(midpoint) ||
      midpoint <= low ||
      midpoint >= high
    ) {
      alert("Bitte geben Sie einen Wert zwischen den beiden Grenzen ein.");
      return;
    }

    setIntervals((prev) => {
      // Mittelpunkt im gewählten Intervall setzen
      const updated = prev.map((intv, i) =>
        i === selectedIntervalIdx
          ? { ...intv, midpoint }
          : intv
      );
      // Zwei neue Intervalle mit passenden Nutzenwertgrenzen anlegen
      updated.push({
        low: low,
        high: midpoint,
        uLow: uLow,
        uHigh: uMid,
        midpoint: null
      });
      updated.push({
        low: midpoint,
        high: high,
        uLow: uMid,
        uHigh: uHigh,
        midpoint: null
      });
      return updated;
    });

    setSelectedIntervalIdx(null);
    setMidpointInput("");
  };

  const reset = () => {
    setStarted(false);
    setIntervals([]);
    setSelectedIntervalIdx(null);
    setMidpointInput("");
  };

  // Punkte für die Visualisierung berechnen
  const utilityPoints = buildUtilityPoints(lower, upper, intervals);

  // Hilfsfunktion: Welt nach SVG-Koordinaten
  const worldToSvg = (x, u) => {
    const sx =
      padding +
      ((x - lower) / (upper - lower || 1)) * (width - 2 * padding);
    const sy =
      height - padding - u * (height - 2 * padding); // y ist invertiert
    return [sx, sy];
  };

  // Linien für SVG
  const linePath = utilityPoints
    .map((p, idx) => {
      const [x, y] = worldToSvg(p.x, p.u);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Noch offene Intervalle (ohne Mittelpunkt)
  const openIntervals = intervals
    .map((intv, idx) => ({ ...intv, idx }))
    .filter((intv) => intv.midpoint === null && intv.high - intv.low > 0);

  return (
    <div className="app-container">
      <h2>Halbierungsmethode &mdash; Subjektiver Nutzenwert (€)</h2>
      {!started ? (
        <div className="setup-card">
          <div className="input-row">
            <label>
              Untere Grenze:
              <input
                type="number"
                min="0"
                value={lower}
                onChange={(e) => setLower(e.target.value)}
                className="input-euro"
              />€
            </label>
            <label>
              Obere Grenze:
              <input
                type="number"
                min={Number(lower)+1}
                value={upper}
                onChange={(e) => setUpper(e.target.value)}
                className="input-euro"
              />€
            </label>
          </div>
          <button className="btn-primary" onClick={start}>
            Starten
          </button>
        </div>
      ) : (
        <div className="experiment-card">
          <div className="info-row">
            <span className="info-chip">
              Grenze unten: <b>{lower} €</b>
            </span>
            <span className="info-chip">
              Grenze oben: <b>{upper} €</b>
            </span>
          </div>
          {openIntervals.length === 0 ? (
            <div className="done-message">
              <span>Fertig! Alle Nutzenwerte wurden bestimmt.</span>
            </div>
          ) : (
            <div>
              <h4>Für welches Intervall möchten Sie den subjektiven Nutzenwert bestimmen?</h4>
              <div className="interval-list">
                {openIntervals.map((intv) => (
                  <button
                    className={
                      selectedIntervalIdx === intv.idx
                        ? "interval-btn selected"
                        : "interval-btn"
                    }
                    key={intv.idx}
                    onClick={() => selectInterval(intv.idx)}
                  >
                    {intv.low} € – {intv.high} €
                  </button>
                ))}
              </div>
              {selectedIntervalIdx !== null && (() => {
                const selected = intervals[selectedIntervalIdx];
                const uMid = ((selected.uLow + selected.uHigh) / 2).toFixed(2);
                return (
                  <div className="question-card">
                    <p>
                      <b>
                        Angenommen, Sie empfinden {selected.low} € als Nutzenwert {selected.uLow}
                        und {selected.high} € als Nutzenwert {selected.uHigh}.<br /><br />
                        <span style={{ color: "#1769aa" }}>
                          Welcher Geldbetrag (in €) entspricht für Sie dem Nutzenwert {uMid}, also
                          genau in der Mitte der beiden Nutzenwerte ({selected.uLow} und {selected.uHigh})?
                        </span>
                      </b>
                    </p>
                    <input
                      type="number"
                      className="input-euro"
                      value={midpointInput}
                      onChange={(e) => setMidpointInput(e.target.value)}
                    /> €
                    <button className="btn-primary" onClick={submitMidpoint}>
                      Nutzenwert festlegen
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          <h3>Subjektive Nutzenfunktion</h3>
          <div className="chart-card">
            <svg width={width} height={height} className="utility-svg">
              {/* Achsen */}
              <line
                x1={padding}
                y1={height - padding}
                x2={width - padding}
                y2={height - padding}
                stroke="#333"
              />
              <line
                x1={padding}
                y1={height - padding}
                x2={padding}
                y2={padding}
                stroke="#333"
              />
              {/* Achsenbeschriftung */}
              <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="13">
                Betrag in €
              </text>
              <text
                x={padding - 25}
                y={padding - 8}
                textAnchor="start"
                fontSize="13"
                transform={`rotate(-90,${padding - 25},${padding - 8})`}
              >
                Nutzenwert
              </text>
              {/* Skalen */}
              <text x={padding} y={height - padding + 18} fontSize="11" textAnchor="middle">
                {lower} €
              </text>
              <text x={width - padding} y={height - padding + 18} fontSize="11" textAnchor="middle">
                {upper} €
              </text>
              <text x={padding - 12} y={height - padding + 5} fontSize="11" textAnchor="end">
                0
              </text>
              <text x={padding - 12} y={padding + 4} fontSize="11" textAnchor="end">
                1
              </text>
              {/* Linienzug */}
              <path
                d={linePath}
                fill="none"
                stroke="#1769aa"
                strokeWidth={3}
              />
              {/* Punkte */}
              {utilityPoints.map((p, i) => {
                const [x, y] = worldToSvg(p.x, p.u);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={5}
                    fill="#fff"
                    stroke="#1769aa"
                    strokeWidth={2}
                  >
                    <title>
                      Betrag: {p.x.toFixed(2)} €, Nutzenwert: {p.u.toFixed(2)}
                    </title>
                  </circle>
                );
              })}
            </svg>
          </div>

          <h3>Bisherige Nutzenwerte</h3>
          <table className="utility-table">
            <thead>
              <tr>
                <th>von</th>
                <th>bis</th>
                <th>subjektiver Mittelpunkt (Nutzenwert-Mitte)</th>
                <th>Nutzenwert links</th>
                <th>Nutzenwert rechts</th>
                <th>Nutzenwert-Mitte</th>
              </tr>
            </thead>
            <tbody>
              {intervals
                .filter((intv) => intv.midpoint !== null)
                .map((intv, i) => (
                  <tr key={i}>
                    <td>{intv.low} €</td>
                    <td>{intv.high} €</td>
                    <td>{intv.midpoint} €</td>
                    <td>{intv.uLow}</td>
                    <td>{intv.uHigh}</td>
                    <td>{((intv.uLow + intv.uHigh) / 2).toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <button className="btn-secondary" onClick={reset}>
            Neustart
          </button>
        </div>
      )}
      <footer>
        <hr />
        <small>
          <b>Hinweis:</b> Sie können beliebig viele Nutzenwerte bestimmen. Wählen Sie jeweils das Intervall, dessen Nutzenwert Sie weiter differenzieren möchten.
        </small>
      </footer>
    </div>
  );
}


