// weather-widget.js
// Fetches current weather via browser Geolocation + Open-Meteo (no API key needed)
// Reverse geocoding via Nominatim (OpenStreetMap)

const WMO_LABELS = {
  0: "Klart",
  1: "Mestadels klart",
  2: "Delvis mulet",
  3: "Mulet",
  45: "Dimma",
  48: "Rimfrost",
  51: "Lätt duggregn",
  53: "Duggregn",
  55: "Kraftigt duggregn",
  61: "Lätt regn",
  63: "Regn",
  65: "Kraftigt regn",
  71: "Lätt snö",
  73: "Snöfall",
  75: "Kraftigt snöfall",
  80: "Regnskurar",
  81: "Regnskurar",
  82: "Kraftiga regnskurar",
  95: "Åska",
  96: "Åska med hagel",
};

const WMO_ICONS = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "🌨️",
  73: "❄️",
  75: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  95: "⛈️",
  96: "⛈️",
};

const container = document.getElementById("weather-widget");
if (!container) throw new Error("weather-widget element not found");

/** Builds the widget HTML skeleton */
function renderShell() {
  container.innerHTML = `
    <div class="wx-card">
      <div class="wx-top">
        <span class="wx-location" id="wx-location" aria-live="polite">Hämtar plats…</span>
        <button type="button" class="wx-refresh" id="wx-refresh" aria-label="Uppdatera väder">↻</button>
      </div>
      <div class="wx-body" id="wx-body">
        <div class="wx-main">
          <span class="wx-icon" id="wx-icon" aria-hidden="true">–</span>
          <div>
            <span class="wx-temp" id="wx-temp">–</span>
            <span class="wx-desc" id="wx-desc">Laddar…</span>
          </div>
        </div>
        <dl class="wx-stats">
          <div class="wx-stat">
            <dt>Känns som</dt>
            <dd id="wx-feels">–</dd>
          </div>
          <div class="wx-stat">
            <dt>Luftfuktighet</dt>
            <dd id="wx-humidity">–</dd>
          </div>
          <div class="wx-stat">
            <dt>Vind</dt>
            <dd id="wx-wind">–</dd>
          </div>
          <div class="wx-stat">
            <dt>Nederbörd</dt>
            <dd id="wx-precip">–</dd>
          </div>
        </dl>
      </div>
      <p class="wx-error" id="wx-error" role="alert" hidden></p>
    </div>
  `;
  document.getElementById("wx-refresh").addEventListener("click", loadWeather);
}

/** Shows an error message inside the widget */
function showError(msg) {
  const err = document.getElementById("wx-error");
  const body = document.getElementById("wx-body");
  if (err) {
    err.textContent = msg;
    err.hidden = false;
  }
  if (body) body.style.opacity = "0.3";
}

/** Reverse geocodes coordinates to a city name */
async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
  );
  if (!res.ok) throw new Error("Geocoding misslyckades");
  const data = await res.json();
  return (
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    data.address?.municipality ||
    "Okänd plats"
  );
}

/** Fetches current weather from Open-Meteo */
async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "precipitation",
      "weather_code",
    ].join(","),
    wind_speed_unit: "ms",
    timezone: "auto",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);
  return res.json();
}

/** Populates the widget with live data */
async function loadWeather() {
  const locEl = document.getElementById("wx-location");
  const errEl = document.getElementById("wx-error");
  const bodyEl = document.getElementById("wx-body");

  if (locEl) locEl.textContent = "Hämtar plats…";
  if (errEl) errEl.hidden = true;
  if (bodyEl) bodyEl.style.opacity = "1";

  if (!navigator.geolocation) {
    showError("Din webbläsare stöder inte platsåtkomst.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const [city, data] = await Promise.all([
          reverseGeocode(lat, lon),
          fetchWeather(lat, lon),
        ]);
        const c = data.current;
        const code = c.weather_code;

        document.getElementById("wx-location").textContent = city;
        document.getElementById("wx-icon").textContent =
          WMO_ICONS[code] ?? "🌡️";
        document.getElementById("wx-temp").textContent =
          `${Math.round(c.temperature_2m)}°C`;
        document.getElementById("wx-desc").textContent =
          WMO_LABELS[code] ?? "Okänt";
        document.getElementById("wx-feels").textContent =
          `${Math.round(c.apparent_temperature)}°C`;
        document.getElementById("wx-humidity").textContent =
          `${Math.round(c.relative_humidity_2m)} %`;
        document.getElementById("wx-wind").textContent =
          `${Math.round(c.wind_speed_10m)} m/s`;
        document.getElementById("wx-precip").textContent =
          `${c.precipitation.toFixed(1)} mm`;
      } catch {
        showError("Kunde inte hämta väderdata. Försök igen.");
      }
    },
    () =>
      showError(
        "Platsbehörighet nekades – tillåt plats i webbläsaren och försök igen.",
      ),
  );
}

// Init
renderShell();
loadWeather();
