import { NextResponse } from "next/server";

// Comprehensive catalog of Indian Districts and global hubs with exact coordinates
const DISTRICT_CATALOG: Array<{
  name: string;
  district: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}> = [
  // Delhi NCR Localities & Districts
  { name: "Modinagar", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.7695, lng: 77.5750 },
  { name: "Baghpat", district: "Baghpat District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.9447, lng: 77.2244 },
  { name: "Meerut", district: "Meerut District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.9845, lng: 77.7064 },
  { name: "Hapur", district: "Hapur District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.7306, lng: 77.7759 },
  { name: "Mohan Nagar", district: "Sahibabad", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6780, lng: 77.3890 },
  { name: "Sahibabad", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6811, lng: 77.3787 },
  { name: "Indirapuram", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6415, lng: 77.3745 },
  { name: "Vaishali", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6480, lng: 77.3411 },
  { name: "Vasundhara", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6601, lng: 77.3683 },
  { name: "Raj Nagar", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6947, lng: 77.4475 },
  { name: "Ghaziabad", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6692, lng: 77.4538 },
  { name: "Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.5355, lng: 77.3910 },
  { name: "Greater Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.4744, lng: 77.5040 },
  { name: "Gurugram", district: "Gurugram District", state: "Haryana", country: "India", countryCode: "IN", lat: 28.4595, lng: 77.0266 },
  { name: "Faridabad", district: "Faridabad District", state: "Haryana", country: "India", countryCode: "IN", lat: 28.4089, lng: 77.3178 },
  { name: "Delhi", district: "Central Delhi", state: "Delhi", country: "India", countryCode: "IN", lat: 28.6139, lng: 77.2090 },
  { name: "New Delhi", district: "New Delhi District", state: "Delhi", country: "India", countryCode: "IN", lat: 28.6139, lng: 77.2090 },

  // Kerala Districts
  { name: "Wayanad", district: "Wayanad District", state: "Kerala", country: "India", countryCode: "IN", lat: 11.6854, lng: 76.1320 },
  { name: "Ernakulam", district: "Ernakulam District", state: "Kerala", country: "India", countryCode: "IN", lat: 9.9816, lng: 76.2999 },
  { name: "Kozhikode", district: "Kozhikode District", state: "Kerala", country: "India", countryCode: "IN", lat: 11.2588, lng: 75.7804 },
  { name: "Thiruvananthapuram", district: "Thiruvananthapuram District", state: "Kerala", country: "India", countryCode: "IN", lat: 8.5241, lng: 76.9366 },
  { name: "Palakkad", district: "Palakkad District", state: "Kerala", country: "India", countryCode: "IN", lat: 10.7867, lng: 76.6548 },
  { name: "Thrissur", district: "Thrissur District", state: "Kerala", country: "India", countryCode: "IN", lat: 10.5276, lng: 76.2144 },
  { name: "Malappuram", district: "Malappuram District", state: "Kerala", country: "India", countryCode: "IN", lat: 11.0510, lng: 76.0711 },
  { name: "Kollam", district: "Kollam District", state: "Kerala", country: "India", countryCode: "IN", lat: 8.8932, lng: 76.6141 },
  { name: "Alappuzha", district: "Alappuzha District", state: "Kerala", country: "India", countryCode: "IN", lat: 9.4981, lng: 76.3388 },
  { name: "Idukki", district: "Idukki District", state: "Kerala", country: "India", countryCode: "IN", lat: 9.8494, lng: 76.9804 },
  { name: "Kannur", district: "Kannur District", state: "Kerala", country: "India", countryCode: "IN", lat: 11.8745, lng: 75.3704 },
  { name: "Kasaragod", district: "Kasaragod District", state: "Kerala", country: "India", countryCode: "IN", lat: 12.5102, lng: 74.9852 },
  { name: "Kottayam", district: "Kottayam District", state: "Kerala", country: "India", countryCode: "IN", lat: 9.5916, lng: 76.5222 },

  // Maharashtra Districts
  { name: "Mumbai", district: "Mumbai City", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.0760, lng: 72.8777 },
  { name: "Thane", district: "Thane District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.2183, lng: 72.9781 },
  { name: "Pune", district: "Pune District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 18.5204, lng: 73.8567 },
  { name: "Nagpur", district: "Nagpur District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 21.1458, lng: 79.0882 },
  { name: "Nashik", district: "Nashik District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.9975, lng: 73.7898 },

  // Karnataka & South
  { name: "Bengaluru", district: "Bangalore Urban", state: "Karnataka", country: "India", countryCode: "IN", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", district: "Chennai District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 13.0827, lng: 80.2707 },
  { name: "Hyderabad", district: "Hyderabad District", state: "Telangana", country: "India", countryCode: "IN", lat: 17.3850, lng: 78.4867 },
  { name: "Kolkata", district: "Kolkata District", state: "West Bengal", country: "India", countryCode: "IN", lat: 22.5726, lng: 88.3639 },
  { name: "Jaipur", district: "Jaipur District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.9124, lng: 75.7873 },
];

function getCountryFlag(countryCode?: string): string {
  if (!countryCode) return "📍";
  const code = countryCode.toUpperCase();
  if (code === "IN") return "🇮🇳";
  if (code === "US") return "🇺🇸";
  if (code === "GB") return "🇬🇧";
  if (code === "CA") return "🇨🇦";
  if (code === "AU") return "🇦🇺";
  if (code === "AE") return "🇦🇪";
  if (code === "JP") return "🇯🇵";
  if (code === "DE") return "🇩🇪";
  if (code === "FR") return "🇫🇷";
  return "🌍";
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
  return "Partly Cloudy";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");

  // A. HYPER-LOCAL REVERSE GEOCODING (GPS Coordinates -> Locality / Suburb / City)
  if (latStr && lngStr) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    try {
      // 1. Try BigDataCloud reverse geocode API (ultra fast <200ms)
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const bdcRes = await fetch(bdcUrl, { signal: controller.signal, next: { revalidate: 3600 } });
      clearTimeout(timer);
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const locality = bdcData.locality || bdcData.city || bdcData.principalSubdivision;
        if (locality) {
          return NextResponse.json({
            city: locality,
            state: bdcData.principalSubdivision || "",
            country: bdcData.countryName || "India",
            lat,
            lng,
          });
        }
      }
    } catch {}

    try {
      // 2. Fallback to OpenStreetMap Nominatim
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
      const osmRes = await fetch(osmUrl, {
        headers: { "User-Agent": "WeatherGPT/1.0" },
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
      clearTimeout(timer);

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const addr = osmData.address || {};

        const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential;
        const suburb = addr.suburb || addr.city_district || addr.town;
        const city = addr.city || addr.municipality || addr.county || addr.state_district;
        const state = addr.state || "";
        const country = addr.country || "India";

        let primaryLabel = "Live Location";
        if (neighbourhood && suburb && neighbourhood !== suburb) {
          primaryLabel = `${neighbourhood}, ${suburb}`;
        } else if (neighbourhood && city && neighbourhood !== city) {
          primaryLabel = `${neighbourhood}, ${city}`;
        } else if (suburb && city && suburb !== city) {
          primaryLabel = `${suburb}, ${city}`;
        } else if (neighbourhood) {
          primaryLabel = neighbourhood;
        } else if (suburb) {
          primaryLabel = suburb;
        } else if (city) {
          primaryLabel = city;
        }

        return NextResponse.json({
          city: primaryLabel,
          neighbourhood,
          suburb,
          macro_city: city,
          state,
          country,
          display_name: osmData.display_name || `${primaryLabel}, ${state}`,
          lat,
          lng,
        });
      }
    } catch {}

    return NextResponse.json({
      city: "Sahibabad, Ghaziabad",
      state: "Uttar Pradesh",
      country: "India",
      lat,
      lng,
    });
  }

  // B. FORWARD SEARCH GEOCODING
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cleanQuery = q.replace(/\b(district|dist|zila|city|town|region)\b/gi, "").trim() || q;
  const qLower = cleanQuery.toLowerCase();

  // 1. Check matching districts/localities from catalog
  const catalogMatches = DISTRICT_CATALOG.filter(
    (c) =>
      c.name.toLowerCase().includes(qLower) ||
      c.district.toLowerCase().includes(qLower) ||
      c.state.toLowerCase().includes(qLower)
  ).slice(0, 5);

  let results: any[] = [];

  // 2. Fetch Open-Meteo Geocoding results with 1.5s timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleanQuery
    )}&count=8&language=en&format=json`;

    const geoRes = await fetch(geoUrl, { signal: controller.signal, next: { revalidate: 3600 } });
    clearTimeout(timer);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const rawApiResults = geoData.results || [];

      for (const item of rawApiResults) {
        const alreadyMatched = catalogMatches.some(
          (m) => m.name.toLowerCase() === item.name.toLowerCase() && m.countryCode === item.country_code
        );
        if (!alreadyMatched) {
          results.push({
            id: `${item.latitude}-${item.longitude}`,
            name: item.name,
            district: item.admin2 || (item.admin3 ? item.admin3 : ""),
            state: item.admin1 || "",
            country: item.country || "",
            countryCode: item.country_code || "",
            lat: item.latitude,
            lng: item.longitude,
          });
        }
      }
    }
  } catch {}

  const allPlaces = [
    ...catalogMatches.map((c) => ({
      id: `${c.lat}-${c.lng}`,
      ...c,
    })),
    ...results,
  ].slice(0, 8);

  if (allPlaces.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // 3. Fetch live mini-weather for the places in parallel with 1.2s timeout
  const enrichedResults = await Promise.all(
    allPlaces.map(async (item) => {
      let temp: number | null = null;
      let weatherCode = 0;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1200);
        const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${item.lat}&longitude=${item.lng}&current=temperature_2m,weather_code`;
        const wRes = await fetch(wUrl, { signal: controller.signal, next: { revalidate: 300 } });
        clearTimeout(timer);
        if (wRes.ok) {
          const wData = await wRes.json();
          temp = Math.round(wData.current?.temperature_2m ?? 25);
          weatherCode = wData.current?.weather_code ?? 0;
        }
      } catch {}

      return {
        id: item.id,
        name: item.name,
        district: item.district && item.district !== item.name ? item.district : "",
        state: item.state || "",
        country: item.country || "India",
        countryCode: item.countryCode,
        flag: getCountryFlag(item.countryCode),
        lat: item.lat,
        lng: item.lng,
        temp,
        weatherCode,
        condition: mapWeatherCodeToDescription(weatherCode),
      };
    })
  );

  return NextResponse.json({ results: enrichedResults });
}
