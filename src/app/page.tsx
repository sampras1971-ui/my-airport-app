'use client';
import { useState } from "react";

const initialAirports = [
  { iata: "HND", name: "東京羽田国際空港", nameEn: "Tokyo Haneda International Airport", city: "東京", cityEn: "Tokyo", flightHours: 0 },
  { iata: "HKG", name: "香港国際空港", nameEn: "Hong Kong International Airport", city: "香港", cityEn: "Hong Kong", flightHours: 4.5 },
  { iata: "SFO", name: "サンフランシスコ国際空港", nameEn: "San Francisco International Airport", city: "サンフランシスコ", cityEn: "San Francisco", flightHours: 9.5 },
  { iata: "SIN", name: "チャンギ国際空港", nameEn: "Singapore Changi Airport", city: "シンガポール", cityEn: "Singapore", flightHours: 7.5 },
  { iata: "IST", name: "イスタンブール空港", nameEn: "Istanbul Airport", city: "イスタンブール", cityEn: "Istanbul", flightHours: 12.5 },
  { iata: "DOH", name: "ハマド国際空港", nameEn: "Hamad International Airport", city: "ドーハ", cityEn: "Doha", flightHours: 11 },
];

export default function App() {
  const [airports, setAirports] = useState(initialAirports);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [cityJa, setCityJa] = useState("");
  const [flightHours, setFlightHours] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmIata, setConfirmIata] = useState(null);

  const filtered = airports.filter(a =>
    a.city.includes(query) ||
    a.cityEn.toLowerCase().includes(query.toLowerCase()) ||
    a.name.includes(query) ||
    a.nameEn.toLowerCase().includes(query.toLowerCase()) ||
    a.iata.toLowerCase().includes(query.toLowerCase())
  );

  const formatFlight = (h) => {
    if (h === 0) return "出発地";
    if (!h || isNaN(h)) return "不明";
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return mm > 0 ? `約 ${hh}時間${mm}分` : `約 ${hh}時間`;
  };

  const handleAiLookup = async () => {
    if (!cityJa.trim()) { setAiError("都市名（日本語）を入力してください。"); return; }
    setAiError(""); setAiResult(null); setLoading(true);
    try {
      const prompt = `以下の都市にある主要国際空港の情報をJSON形式で返してください。
都市名（日本語）：${cityJa}

以下のキーを含むJSONのみ返してください。余計な説明やマークダウンは不要です。
{
  "iata": "IATAコード（3文字大文字）",
  "name": "空港名（日本語）",
  "nameEn": "空港名（英語）",
  "city": "都市名（日本語）",
  "cityEn": "都市名（英語）",
  "flightHoursFromHND": 羽田からの飛行時間（数値・時間単位、例：4.5）
}
都市が存在しない・空港が不明な場合は {"error": "not_found"} を返してください。`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("").trim();
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed.error === "not_found") {
        setAiError("該当する空港が見つかりませんでした。都市名を確認してください。");
      } else {
        setAiResult(parsed);
        if (parsed.flightHoursFromHND) setFlightHours(String(parsed.flightHoursFromHND));
      }
    } catch {
      setAiError("情報の取得に失敗しました。もう一度お試しください。");
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setError("");
    if (!aiResult) { setError("先に「空港情報を検索」してください。"); return; }
    if (airports.find(a => a.iata === aiResult.iata)) {
      setError(`${aiResult.iata} はすでに登録されています。`); return;
    }
    const fh = flightHours !== "" ? parseFloat(flightHours) : null;
    const newAirport = { ...aiResult, flightHours: fh };
    setAirports([...airports, newAirport]);
    setSuccess(`✅ ${newAirport.name}（${newAirport.iata}）を登録しました！`);
    setTimeout(() => setSuccess(""), 3000);
    setCityJa(""); setFlightHours(""); setAiResult(null); setShowForm(false);
  };

  const handleDelete = (iata) => {
    if (iata === "HND") return;
    const deleted = airports.find(a => a.iata === iata);
    setAirports(airports.filter(a => a.iata !== iata));
    setConfirmIata(null);
    setSuccess(`🗑️ ${deleted.name}（${deleted.iata}）を削除しました。`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const resetForm = () => {
    setCityJa(""); setFlightHours(""); setAiResult(null); setAiError(""); setError("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #87CEEB 0%, #B0E0FF 100%)", fontFamily: "'Segoe UI', sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>✈️</div>
          <h1 style={{ margin: "8px 0 4px", fontSize: 26, color: "#1a3a5c", fontWeight: 700 }}>世界の空港検索</h1>
          <p style={{ color: "#2c5f8a", margin: 0, fontSize: 13 }}>羽田空港（HND）からの飛行時間を確認できます</p>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="都市名・空港名・IATAコードで検索..."
            style={{ width: "100%", padding: "13px 16px 13px 44px", borderRadius: 12, border: "none", fontSize: 15, boxSizing: "border-box", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", outline: "none" }} />
        </div>

        {/* Success */}
        {success && (
          <div style={{ background: "#d4f1d4", color: "#1a6a1a", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>{success}</div>
        )}

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#2c5f8a", padding: 40, fontSize: 15 }}>該当する空港が見つかりません 🔍</div>
          ) : filtered.map(a => (
            <div key={a.iata} style={{ background: "white", borderRadius: 16, padding: "18px 16px", boxShadow: "0 3px 14px rgba(0,0,0,0.1)", position: "relative", transition: "transform 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              {a.iata !== "HND" && (
                <button onClick={() => setConfirmIata(a.iata)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#aaa" }} title="削除">✕</button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ background: "#1a3a5c", color: "white", borderRadius: 8, padding: "4px 10px", fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>{a.iata}</span>
                {a.iata === "HND" && <span style={{ background: "#FFD700", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#7a5c00" }}>出発地</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a3a5c", marginBottom: 3 }}>{a.name}</div>
              {a.nameEn && <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>{a.nameEn}</div>}
              <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>📍 {a.city}{a.cityEn ? ` / ${a.cityEn}` : ""}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0f7ff", borderRadius: 8, padding: "6px 10px" }}>
                <span style={{ fontSize: 16 }}>🕐</span>
                <span style={{ fontWeight: 600, color: "#1a6aaa", fontSize: 14 }}>{formatFlight(a.flightHours)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Button */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <button onClick={() => { setShowForm(!showForm); resetForm(); }}
            style={{ background: "#1a3a5c", color: "white", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 3px 10px rgba(0,0,0,0.2)" }}>
            {showForm ? "✕ 閉じる" : "＋ 空港を追加登録"}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 6px", color: "#1a3a5c", fontSize: 16 }}>✈️ 新しい空港を登録</h3>
            <p style={{ margin: "0 0 18px", color: "#888", fontSize: 13 }}>都市名（日本語）を入力して検索すると、空港情報をAIが自動で補完します。</p>

            {/* Step 1 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1a3a5c", display: "block", marginBottom: 6 }}>① 都市名を入力（日本語）</label>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={cityJa} onChange={e => { setCityJa(e.target.value); setAiResult(null); setAiError(""); }}
                  placeholder="例：ロンドン、ニューヨーク、パリ..."
                  onKeyDown={e => e.key === "Enter" && handleAiLookup()}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, outline: "none" }} />
                <button onClick={handleAiLookup} disabled={loading}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: loading ? "#aaa" : "#2980b9", color: "white", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                  {loading ? "検索中…" : "🔍 検索"}
                </button>
              </div>
              {aiError && <div style={{ color: "#c0392b", fontSize: 13, marginTop: 8 }}>⚠️ {aiError}</div>}
            </div>

            {/* AI Result Preview */}
            {aiResult && (
              <div style={{ background: "#f0f7ff", borderRadius: 12, padding: 16, marginBottom: 16, border: "1.5px solid #b0d4f1" }}>
                <div style={{ fontSize: 12, color: "#2980b9", fontWeight: 600, marginBottom: 10 }}>✨ AIが取得した空港情報</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                  {[
                    ["IATAコード", aiResult.iata],
                    ["飛行時間（目安）", formatFlight(aiResult.flightHoursFromHND)],
                    ["空港名（日本語）", aiResult.name],
                    ["空港名（英語）", aiResult.nameEn],
                    ["都市名（日本語）", aiResult.city],
                    ["都市名（英語）", aiResult.cityEn],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: "#888" }}>{k}：</span>
                      <span style={{ fontWeight: 600, color: "#1a3a5c" }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>

                {/* Step 2: Optional flight hours override */}
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#1a3a5c", display: "block", marginBottom: 6 }}>
                    ② 飛行時間を手動入力（任意・上書き）
                  </label>
                  <input value={flightHours} onChange={e => setFlightHours(e.target.value)}
                    placeholder={`AIの推定値：${aiResult.flightHoursFromHND ? aiResult.flightHoursFromHND + " 時間" : "不明"}`}
                    type="number" step="0.5" min="0"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #ccc", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                  <p style={{ color: "#aaa", fontSize: 12, margin: "4px 0 0" }}>空欄の場合はAIの推定値を使用します。</p>
                </div>
              </div>
            )}

            {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>⚠️ {error}</div>}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleAdd} disabled={!aiResult}
                style={{ background: aiResult ? "#27ae60" : "#bbb", color: "white", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 15, fontWeight: 600, cursor: aiResult ? "pointer" : "not-allowed" }}>
                登録する
              </button>
              <button onClick={() => { setShowForm(false); resetForm(); }}
                style={{ background: "white", color: "#c0392b", border: "1.5px solid #c0392b", borderRadius: 10, padding: "11px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                登録を中止する
              </button>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmIata && (() => {
          const a = airports.find(x => x.iata === confirmIata);
          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
              <div style={{ background: "white", borderRadius: 18, padding: "30px 28px", maxWidth: 340, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
                <h3 style={{ margin: "0 0 8px", color: "#1a3a5c", fontSize: 17 }}>この空港を削除しますか？</h3>
                <p style={{ color: "#555", fontSize: 14, margin: "0 0 6px" }}><strong style={{ color: "#1a3a5c" }}>{a.name}</strong></p>
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 22px" }}>IATAコード：{a.iata}</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button onClick={() => setConfirmIata(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #ccc", background: "white", color: "#555", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>キャンセル</button>
                  <button onClick={() => handleDelete(confirmIata)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#e74c3c", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>削除する</button>
                </div>
              </div>
            </div>
          );
        })()}

        <div style={{ textAlign: "center", color: "#4a7a9b", fontSize: 12 }}>登録空港数：{airports.length}件</div>
      </div>
    </div>
  );
}
