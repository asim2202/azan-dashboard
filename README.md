# Azan Clock - Dubai Prayer Times Dashboard

Full-screen living room display showing Dubai prayer times, iqama times, weather, and Hijri date with Azan audio playback.

## Features

- Prayer times using Dubai/IACAD calculation method (adhan.js)
- Iqama times with seasonal IACAD-based offsets (configurable)
- Live countdown to next prayer
- Azan audio at each prayer time (separate Fajr recitation)
- Iqama countdown overlay after Azan
- Dubai weather from Open-Meteo (free, no API key)
- Hijri date (Umm al-Qura calendar)
- Dark theme for always-on displays
- Screen wake lock + daily auto-refresh at 1 AM

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Docker (Unraid)

```bash
docker-compose up -d
```

Access at http://your-server-ip:3000

## Adding Azan Audio

Place MP3 files in `public/audio/`:
- `azan-makkah.mp3` - Main Azan (Dhuhr, Asr, Maghrib, Isha)
- `azan-fajr.mp3` - Fajr Azan

Search for "Mishary Rashid Alafasy Azan MP3" or "Makkah Azan MP3" for free recordings.

## Configuration

Edit `config/default.json` or use Docker environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LATITUDE` | 25.2048 | Location latitude |
| `LONGITUDE` | 55.2708 | Location longitude |
| `TIMEZONE` | Asia/Dubai | IANA timezone |
| `CITY` | Dubai | Display city name |
| `CALCULATION_METHOD` | Dubai | Prayer calculation method |
| `MADHAB` | Shafi | Juristic madhab (Shafi/Hanafi) |

## Display Options

- **Tablet on wall**: Use "Fully Kiosk Browser" on Android, set URL to `http://server-ip:3000`
- **Raspberry Pi**: `chromium-browser --kiosk --autoplay-policy=no-user-gesture-required http://server-ip:3000`
- **Smart TV / Any browser**: Navigate to `http://server-ip:3000`, tap to enable audio
