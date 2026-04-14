"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { AppConfig, WidgetConfig } from "@/types/config";
import { WIDGET_DEFINITIONS, DEFAULT_WIDGETS } from "@/lib/widget-registry";

interface AudioFile {
  name: string;
  path: string;
  size: number;
}

const TIMEZONES = [
  "Asia/Dubai", "Asia/Riyadh", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka",
  "Asia/Kuala_Lumpur", "Asia/Jakarta", "Asia/Istanbul", "Africa/Cairo",
  "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago",
  "America/Denver", "America/Los_Angeles", "America/Toronto",
];

const CALCULATION_METHODS = [
  { value: "Dubai", label: "Dubai (IACAD)" },
  { value: "MuslimWorldLeague", label: "Muslim World League" },
  { value: "Egyptian", label: "Egyptian General Authority" },
  { value: "Karachi", label: "University of Islamic Sciences, Karachi" },
  { value: "UmmAlQura", label: "Umm al-Qura, Makkah" },
  { value: "NorthAmerica", label: "ISNA (North America)" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Qatar", label: "Qatar" },
  { value: "Singapore", label: "Singapore" },
  { value: "Tehran", label: "Institute of Geophysics, Tehran" },
  { value: "Turkey", label: "Turkey (Diyanet)" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load config and audio files
  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setConfig).catch(() => {});
    loadAudioFiles();
  }, []);

  function loadAudioFiles() {
    fetch("/api/audio-files")
      .then((r) => r.json())
      .then((data) => setAudioFiles(data.files || []))
      .catch(() => {});
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Settings saved successfully" });
        if (data.config) setConfig(data.config);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" });
    }
    setSaving(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/audio-upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: `Uploaded ${data.file.name}` });
        loadAudioFiles();
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteFile(name: string) {
    try {
      const res = await fetch("/api/audio-files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        loadAudioFiles();
        setMessage({ type: "success", text: `Deleted ${name}` });
      }
    } catch {}
  }

  function updateConfig(path: string, value: unknown) {
    if (!config) return;
    const keys = path.split(".");
    const updated = JSON.parse(JSON.stringify(config));
    let obj = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setConfig(updated);
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <p className="text-white/40">Loading settings...</p>
      </div>
    );
  }

  const audioOptions = [
    { value: "", label: "None" },
    ...audioFiles.map((f) => ({ value: f.path, label: f.name })),
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/50 hover:text-white transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-medium rounded-lg transition-colors text-sm"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <div className={`px-4 py-2 rounded-lg text-sm ${message.type === "success" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
            {message.text}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Location & Calculation */}
        <Section title="Location & Calculation">
          <Field label="City">
            <input
              type="text"
              value={config.location.city}
              onChange={(e) => updateConfig("location.city", e.target.value)}
              className="input-field"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <input
                type="number"
                step="0.0001"
                value={config.location.latitude}
                onChange={(e) => updateConfig("location.latitude", parseFloat(e.target.value) || 0)}
                className="input-field"
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="0.0001"
                value={config.location.longitude}
                onChange={(e) => updateConfig("location.longitude", parseFloat(e.target.value) || 0)}
                className="input-field"
              />
            </Field>
          </div>
          <Field label="Timezone">
            <select
              value={config.location.timezone}
              onChange={(e) => updateConfig("location.timezone", e.target.value)}
              className="input-field"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </Field>
          <Field label="Calculation Method">
            <select
              value={config.calculationMethod}
              onChange={(e) => updateConfig("calculationMethod", e.target.value)}
              className="input-field"
            >
              {CALCULATION_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Madhab">
            <select
              value={config.madhab}
              onChange={(e) => updateConfig("madhab", e.target.value)}
              className="input-field"
            >
              <option value="Shafi">Shafi</option>
              <option value="Hanafi">Hanafi</option>
            </select>
          </Field>
        </Section>

        {/* Iqama Offsets */}
        <Section title="Iqama Offsets (minutes after Azan)">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(["fajr", "dhuhr", "asr", "maghrib", "isha"] as const).map((prayer) => (
              <Field key={prayer} label={prayer.charAt(0).toUpperCase() + prayer.slice(1)}>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={config.iqamaOffsets[prayer]}
                  onChange={(e) => updateConfig(`iqamaOffsets.${prayer}`, parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </Field>
            ))}
          </div>
        </Section>

        {/* Audio */}
        <Section title="Audio">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/70">Enable Audio</span>
            <Toggle
              checked={config.audio.enabled}
              onChange={(v) => updateConfig("audio.enabled", v)}
            />
          </div>

          <Field label={`Volume: ${Math.round(config.audio.volume * 100)}%`}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.audio.volume}
              onChange={(e) => updateConfig("audio.volume", parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </Field>

          <Field label="Azan Sound">
            <select
              value={config.audio.defaultAzan}
              onChange={(e) => updateConfig("audio.defaultAzan", e.target.value)}
              className="input-field"
            >
              {audioOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Fajr Azan Sound">
            <select
              value={config.audio.fajrAzan}
              onChange={(e) => updateConfig("audio.fajrAzan", e.target.value)}
              className="input-field"
            >
              {audioOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Iqama Sound">
            <select
              value={config.audio.iqamaSound}
              onChange={(e) => updateConfig("audio.iqamaSound", e.target.value)}
              className="input-field"
            >
              {audioOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          {/* Upload */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-white/50 mb-2">Upload Audio File</p>
            <label className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg cursor-pointer transition-colors text-sm w-fit">
              <span>{uploading ? "Uploading..." : "Choose File"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.ogg,.m4a"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* File List */}
          {audioFiles.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-sm text-white/50 mb-2">Uploaded Files</p>
              {audioFiles.map((f) => (
                <div key={f.name} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg text-sm">
                  <div>
                    <span className="text-white/80">{f.name}</span>
                    <span className="text-white/30 ml-2">{formatFileSize(f.size)}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(f.name)}
                    className="text-red-400/60 hover:text-red-400 transition-colors text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Display */}
        <Section title="Display">
          <Field label="Theme">
            <select
              value={config.display.theme || "auto"}
              onChange={(e) => updateConfig("display.theme", e.target.value)}
              className="input-field"
            >
              <option value="auto">Auto (light by day, dark by night)</option>
              <option value="dark">Always Dark</option>
              <option value="light">Always Light</option>
            </select>
          </Field>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/70">24-Hour Format</span>
            <Toggle
              checked={config.display.timeFormat === "24h"}
              onChange={(v) => updateConfig("display.timeFormat", v ? "24h" : "12h")}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Show Seconds</span>
            <Toggle
              checked={config.display.showSeconds}
              onChange={(v) => updateConfig("display.showSeconds", v)}
            />
          </div>
        </Section>

        {/* Camera */}
        <Section title="Camera Feed">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/70">Enable Camera</span>
            <Toggle
              checked={config.camera?.enabled || false}
              onChange={(v) => updateConfig("camera.enabled", v)}
            />
          </div>
          <Field label="Stream URL">
            <input
              type="text"
              value={config.camera?.url || ""}
              onChange={(e) => updateConfig("camera.url", e.target.value)}
              placeholder="rtsp://user:pass@192.168.1.x:554/stream"
              className="input-field"
            />
          </Field>
          <Field label="Feed Type">
            <select
              value={config.camera?.type || "image"}
              onChange={(e) => updateConfig("camera.type", e.target.value)}
              className="input-field"
            >
              <option value="image">Image / MJPEG Stream</option>
              <option value="iframe">Iframe (web player)</option>
            </select>
          </Field>
          <Field label="Refresh Interval (seconds, 0 = live stream)">
            <input
              type="number"
              min="0"
              max="60"
              value={config.camera?.refreshInterval || 0}
              onChange={(e) => updateConfig("camera.refreshInterval", parseInt(e.target.value) || 0)}
              className="input-field"
            />
          </Field>
          <div className="mt-3 p-3 rounded-lg bg-white/5 text-xs text-white/40">
            <p className="font-medium text-white/60 mb-1">Supported URL formats:</p>
            <ul className="space-y-1">
              <li>RTSP: rtsp://user:pass@camera-ip:554/stream (converted automatically via built-in go2rtc)</li>
              <li>MJPEG: http://server:8090/stream</li>
              <li>Frigate: http://server:5000/api/camera/latest.jpg</li>
              <li>Snapshot: http://camera-ip/snap.jpg (set refresh to 2-5s)</li>
            </ul>
          </div>
        </Section>

        {/* Layout / Widgets */}
        <Section title="Dashboard Widgets">
          <p className="text-xs text-white/40 mb-3">Toggle widgets, set sizes (S/M/L), and reorder with arrows. Order here = order on dashboard.</p>
          <div className="space-y-2">
            {(config.layout?.widgets || DEFAULT_WIDGETS).map((wc, idx) => {
              const def = WIDGET_DEFINITIONS.find((d) => d.id === wc.id);
              if (!def) return null;

              const moveUp = () => {
                if (idx === 0) return;
                const widgets = [...(config.layout?.widgets || DEFAULT_WIDGETS)];
                [widgets[idx - 1], widgets[idx]] = [widgets[idx], widgets[idx - 1]];
                updateConfig("layout.widgets", widgets);
              };
              const moveDown = () => {
                const widgets = [...(config.layout?.widgets || DEFAULT_WIDGETS)];
                if (idx >= widgets.length - 1) return;
                [widgets[idx], widgets[idx + 1]] = [widgets[idx + 1], widgets[idx]];
                updateConfig("layout.widgets", widgets);
              };
              const toggleEnabled = () => {
                const widgets = [...(config.layout?.widgets || DEFAULT_WIDGETS)];
                widgets[idx] = { ...widgets[idx], enabled: !widgets[idx].enabled };
                updateConfig("layout.widgets", widgets);
              };
              const changeSize = (size: string) => {
                const widgets = [...(config.layout?.widgets || DEFAULT_WIDGETS)];
                widgets[idx] = { ...widgets[idx], size: size as WidgetConfig["size"] };
                updateConfig("layout.widgets", widgets);
              };

              return (
                <div key={wc.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${wc.enabled ? "bg-white/5" : "bg-white/[0.02] opacity-50"}`}>
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-0.5">
                    <button onClick={moveUp} className="text-white/30 hover:text-white/60 text-xs leading-none" disabled={idx === 0}>&uarr;</button>
                    <button onClick={moveDown} className="text-white/30 hover:text-white/60 text-xs leading-none" disabled={idx === (config.layout?.widgets || DEFAULT_WIDGETS).length - 1}>&darr;</button>
                  </div>

                  {/* Toggle */}
                  <Toggle checked={wc.enabled} onChange={toggleEnabled} />

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{def.name}</p>
                    <p className="text-xs text-white/30 truncate">{def.description}</p>
                  </div>

                  {/* Size selector */}
                  <select
                    value={wc.size}
                    onChange={(e) => changeSize(e.target.value)}
                    className="text-center text-xs py-1 px-2 rounded-md flex-shrink-0"
                    style={{ width: "60px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  >
                    {def.sizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => updateConfig("layout.widgets", DEFAULT_WIDGETS)}
            className="mt-3 text-xs text-white/40 hover:text-white/60 underline"
          >
            Reset to Default Layout
          </button>
        </Section>

        {/* Data Sources */}
        <Section title="Data Sources">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm text-white/70">IACAD Prayer Times (AlAdhan API)</span>
              <p className="text-xs text-white/30">Falls back to local calculation if disabled</p>
            </div>
            <Toggle
              checked={config.dataSources.iacadEnabled}
              onChange={(v) => updateConfig("dataSources.iacadEnabled", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-white/70">Weather</span>
              <p className="text-xs text-white/30">Open-Meteo (free, no API key)</p>
            </div>
            <Toggle
              checked={config.dataSources.weatherEnabled}
              onChange={(v) => updateConfig("dataSources.weatherEnabled", v)}
            />
          </div>
        </Section>

        {/* Bottom Save */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <Link href="/" className="text-white/50 hover:text-white transition-colors text-sm">
            &larr; Back to Dashboard
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-medium rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 sm:p-5">
      <h2 className="text-base font-medium text-white/90 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-sm text-white/50 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-amber-500" : "bg-white/20"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
