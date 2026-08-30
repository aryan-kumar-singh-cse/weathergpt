import { NextResponse } from "next/server";

// Fallback base for internal Docker / direct network requests
const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/v1";

function mapWeatherCodeToType(code: number): "clear" | "cloudy" | "rainy" {
  if ([0, 1].includes(code)) return "clear";
  if ([2, 3, 45, 48].includes(code)) return "cloudy";
  return "rainy";
}

function mapWeatherCodeToIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

export async function POST(request: Request) {
  try {
    const { message, occupation, language, location } = await request.json();

    // Map UI occupation to backend role
    let role = "citizen";
    if (occupation?.toLowerCase().includes("farmer")) role = "farmer";
    else if (occupation?.toLowerCase().includes("pilot")) role = "pilot";
    else if (occupation?.toLowerCase().includes("disaster")) role = "disaster-manager";

    // Call FastAPI ask endpoint
    const backendRes = await fetch(`${API_BASE}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: message,
        email: "user@weathergpt.local",
        role,
        language: (language || "en").toLowerCase().slice(0, 2),
        location: location || undefined,
      }),
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      const current = data.weather?.current || {};
      const placeInfo = data.weather?.place_info || {};
      const forecastDays = data.weather?.forecast?.days || [];

      const weatherCode = current.weather_code ?? 0;
      const weatherType = mapWeatherCodeToType(weatherCode);

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      const formattedForecast = forecastDays.map((d: any) => {
        let dayName = "Day";
        let dateNum: any = d.date;
        try {
          const dateObj = new Date(d.date);
          dayName = daysOfWeek[dateObj.getDay()];
          dateNum = dateObj.getDate();
        } catch {}

        return {
          date: dateNum,
          day: dayName,
          icon: mapWeatherCodeToIcon(d.weather_code ?? 0),
          highTemp: d.temperature_max ?? 30,
          lowTemp: d.temperature_min ?? 22,
          rainChance: d.precipitation_probability ?? 0,
        };
      });

      return NextResponse.json({
        city: placeInfo.place_name || placeInfo.city || data.intent?.place || "Delhi",
        temp: current.temperature ?? 30,
        feelsLike: current.apparent_temperature ?? current.temperature ?? 30,
        humidity: current.humidity ?? 65,
        windSpeed: current.wind_speed ?? 8,
        pressure: current.pressure ?? 1012,
        condition: current.description || data.intent?.intent || "Partly Cloudy",
        rainChance: forecastDays[0]?.precipitation_probability ?? 0,
        weatherType,
        lat: placeInfo.lat ?? 28.61,
        lng: placeInfo.lng ?? 77.2,
        response: data.response,
        forecast: formattedForecast,
      });
    }

    // Direct fallback if backend ask is offline/rate-limited
    const directRes = await fetch(
      `${API_BASE}/weather/current?city=${encodeURIComponent(location || "Delhi")}`
    );
    const directData = await directRes.json();
    const curr = directData.current || {};
    const days = (directData.forecast?.daily || []).map((d: any) => {
      const dt = new Date(d.date);
      return {
        date: dt.getDate(),
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()],
        icon: mapWeatherCodeToIcon(d.weather_code || 0),
        highTemp: d.temperature_max || 30,
        lowTemp: d.temperature_min || 22,
        rainChance: d.precipitation_probability || 0,
      };
    });

    return NextResponse.json({
      city: directData.location?.city || "Delhi",
      temp: curr.temperature || 30,
      feelsLike: curr.apparent_temperature || 30,
      humidity: curr.humidity || 65,
      windSpeed: curr.wind_speed || 8,
      pressure: curr.pressure || 1012,
      condition: curr.description || "Clear Sky",
      rainChance: days[0]?.rainChance || 0,
      weatherType: mapWeatherCodeToType(curr.weather_code || 0),
      lat: directData.location?.lat || 28.61,
      lng: directData.location?.lng || 77.2,
      response: `Weather update for ${directData.location?.city || "Delhi"}: Current temperature is ${curr.temperature}°C with ${curr.humidity}% humidity.`,
      forecast: days,
    });
  } catch (error) {
    return NextResponse.json({
      city: "Delhi",
      temp: 30,
      feelsLike: 32,
      humidity: 68,
      windSpeed: 10,
      pressure: 1012,
      condition: "Partly Cloudy",
      rainChance: 25,
      weatherType: "cloudy",
      lat: 28.61,
      lng: 77.2,
      response: "Current weather update for Delhi: 30°C with comfortable winds.",
      forecast: [
        { date: "Today", day: "Now", icon: "🌤️", highTemp: 32, lowTemp: 24, rainChance: 20 },
      ],
    });
  }
}
