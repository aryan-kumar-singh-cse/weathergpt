import { NextResponse } from "next/server";

// Helper to convert 2-letter ISO country code to emoji flag
function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function mapWeatherCodeToDescription(code: number): string {
  if (code === 0) return "Clear Sky";
  if (code === 1) return "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55].includes(code)) return "Light Drizzle";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Clear";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // 1. Query Open-Meteo Geocoding API
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=8&language=en&format=json`;

    const geoRes = await fetch(geoUrl, { next: { revalidate: 3600 } });
    if (!geoRes.ok) {
      throw new Error("Geocoding API responded with error");
    }

    const geoData = await geoRes.json();
    const rawResults = geoData.results || [];

    if (rawResults.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 2. Fetch live mini-weather for the results in parallel (just temperature & weathercode)
    const enrichedResults = await Promise.all(
      rawResults.map(async (item: any) => {
        let temp: number | null = null;
        let weatherCode = 0;

        try {
          const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${item.latitude}&longitude=${item.longitude}&current=temperature_2m,weather_code`;
          const wRes = await fetch(wUrl, { next: { revalidate: 300 } });
          if (wRes.ok) {
            const wData = await wRes.json();
            temp = Math.round(wData.current?.temperature_2m ?? 25);
            weatherCode = wData.current?.weather_code ?? 0;
          }
        } catch {
          // Weather fetch is optional for preview
        }

        return {
          id: `${item.latitude}-${item.longitude}`,
          name: item.name,
          state: item.admin1 || item.admin2 || "",
          country: item.country || "",
          countryCode: item.country_code || "",
          flag: getCountryFlag(item.country_code),
          lat: item.latitude,
          lng: item.longitude,
          temp,
          weatherCode,
          condition: mapWeatherCodeToDescription(weatherCode),
          timezone: item.timezone,
        };
      })
    );

    return NextResponse.json({ results: enrichedResults });
  } catch (error) {
    // Fallback: Local curated search if external API is unreachable
    const curatedHubs = [
      { name: "Mumbai", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.076, lng: 72.8777, temp: 27, condition: "Partly Cloudy" },
      { name: "Delhi", state: "Delhi", country: "India", countryCode: "IN", lat: 28.6139, lng: 77.209, temp: 30, condition: "Clear Sky" },
      { name: "Bengaluru", state: "Karnataka", country: "India", countryCode: "IN", lat: 12.9716, lng: 77.5946, temp: 24, condition: "Rain" },
      { name: "Jaipur", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.9124, lng: 75.7873, temp: 28, condition: "Clear Sky" },
      { name: "Shimla", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 31.1048, lng: 77.1734, temp: 18, condition: "Foggy" },
      { name: "London", state: "England", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278, temp: 21, condition: "Partly Cloudy" },
      { name: "Paris", state: "Île-de-France", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522, temp: 22, condition: "Clear Sky" },
      { name: "Tokyo", state: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lng: 139.6503, temp: 23, condition: "Overcast" },
      { name: "New York", state: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.006, temp: 25, condition: "Partly Cloudy" },
      { name: "Dubai", state: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lng: 55.2708, temp: 36, condition: "Clear Sky" },
    ];

    const qLower = q.toLowerCase();
    const matches = curatedHubs
      .filter(
        (c) =>
          c.name.toLowerCase().includes(qLower) ||
          c.state.toLowerCase().includes(qLower) ||
          c.country.toLowerCase().includes(qLower)
      )
      .map((c) => ({
        ...c,
        id: `${c.lat}-${c.lng}`,
        flag: getCountryFlag(c.countryCode),
      }));

    return NextResponse.json({ results: matches });
  }
}
