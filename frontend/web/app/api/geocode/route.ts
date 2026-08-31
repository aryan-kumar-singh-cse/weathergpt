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
  { name: "Pathanamthitta", district: "Pathanamthitta District", state: "Kerala", country: "India", countryCode: "IN", lat: 9.2648, lng: 76.7870 },

  // Gujarat Districts
  { name: "Kutch", district: "Kutch District", state: "Gujarat", country: "India", countryCode: "IN", lat: 23.7337, lng: 69.8597 },
  { name: "Ahmedabad", district: "Ahmedabad District", state: "Gujarat", country: "India", countryCode: "IN", lat: 23.0225, lng: 72.5714 },
  { name: "Surat", district: "Surat District", state: "Gujarat", country: "India", countryCode: "IN", lat: 21.1702, lng: 72.8311 },
  { name: "Vadodara", district: "Vadodara District", state: "Gujarat", country: "India", countryCode: "IN", lat: 22.3072, lng: 73.1812 },
  { name: "Rajkot", district: "Rajkot District", state: "Gujarat", country: "India", countryCode: "IN", lat: 22.3039, lng: 70.8022 },
  { name: "Bhavnagar", district: "Bhavnagar District", state: "Gujarat", country: "India", countryCode: "IN", lat: 21.7645, lng: 72.1519 },
  { name: "Jamnagar", district: "Jamnagar District", state: "Gujarat", country: "India", countryCode: "IN", lat: 22.4707, lng: 70.0577 },

  // Uttar Pradesh Districts
  { name: "Ghaziabad", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6692, lng: 77.4538 },
  { name: "Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.5355, lng: 77.3910 },
  { name: "Lucknow", district: "Lucknow District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 26.8467, lng: 80.9462 },
  { name: "Kanpur", district: "Kanpur Nagar", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 26.4499, lng: 80.3319 },
  { name: "Varanasi", district: "Varanasi District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 25.3176, lng: 82.9739 },
  { name: "Prayagraj", district: "Prayagraj District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 25.4358, lng: 81.8463 },
  { name: "Agra", district: "Agra District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 27.1767, lng: 78.0081 },
  { name: "Meerut", district: "Meerut District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.9845, lng: 77.7064 },
  { name: "Gorakhpur", district: "Gorakhpur District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 26.7606, lng: 83.3732 },
  { name: "Aligarh", district: "Aligarh District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 27.8974, lng: 78.0880 },
  { name: "Bareilly", district: "Bareilly District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.3670, lng: 79.4304 },
  { name: "Moradabad", district: "Moradabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.8386, lng: 78.7733 },
  { name: "Jhansi", district: "Jhansi District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 25.4484, lng: 78.5685 },
  { name: "Mathura", district: "Mathura District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 27.4924, lng: 77.6737 },
  { name: "Ayodhya", district: "Ayodhya District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 26.7922, lng: 82.1998 },
  { name: "Muzaffarnagar", district: "Muzaffarnagar District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 29.4727, lng: 77.7085 },

  // Maharashtra Districts
  { name: "Mumbai", district: "Mumbai City", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.0760, lng: 72.8777 },
  { name: "Thane", district: "Thane District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.2183, lng: 72.9781 },
  { name: "Pune", district: "Pune District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 18.5204, lng: 73.8567 },
  { name: "Nagpur", district: "Nagpur District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 21.1458, lng: 79.0882 },
  { name: "Nashik", district: "Nashik District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.9975, lng: 73.7898 },
  { name: "Aurangabad", district: "Chhatrapati Sambhajinagar", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.8762, lng: 75.3433 },
  { name: "Solapur", district: "Solapur District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 17.6599, lng: 75.9064 },
  { name: "Kolhapur", district: "Kolhapur District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 16.7050, lng: 74.2433 },

  // Rajasthan Districts
  { name: "Jaipur", district: "Jaipur District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.9124, lng: 75.7873 },
  { name: "Jodhpur", district: "Jodhpur District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.2389, lng: 73.0243 },
  { name: "Udaipur", district: "Udaipur District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 24.5854, lng: 73.7125 },
  { name: "Kota", district: "Kota District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 25.2138, lng: 75.8648 },
  { name: "Bikaner", district: "Bikaner District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 28.0229, lng: 73.3119 },
  { name: "Ajmer", district: "Ajmer District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.4499, lng: 74.6399 },
  { name: "Alwar", district: "Alwar District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 27.5530, lng: 76.6346 },
  { name: "Sikar", district: "Sikar District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 27.6094, lng: 75.1398 },
  { name: "Barmer", district: "Barmer District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 25.7521, lng: 71.3967 },
  { name: "Jaisalmer", district: "Jaisalmer District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.9157, lng: 70.9083 },

  // Karnataka Districts
  { name: "Bengaluru", district: "Bangalore Urban", state: "Karnataka", country: "India", countryCode: "IN", lat: 12.9716, lng: 77.5946 },
  { name: "Mysore", district: "Mysuru District", state: "Karnataka", country: "India", countryCode: "IN", lat: 12.2958, lng: 76.6394 },
  { name: "Mangalore", district: "Dakshina Kannada", state: "Karnataka", country: "India", countryCode: "IN", lat: 12.9141, lng: 74.8560 },
  { name: "Belagavi", district: "Belagavi District", state: "Karnataka", country: "India", countryCode: "IN", lat: 15.8497, lng: 74.4977 },
  { name: "Hubli", district: "Dharwad District", state: "Karnataka", country: "India", countryCode: "IN", lat: 15.3647, lng: 75.1240 },
  { name: "Ballari", district: "Ballari District", state: "Karnataka", country: "India", countryCode: "IN", lat: 15.1394, lng: 76.9214 },
  { name: "Tumakuru", district: "Tumakuru District", state: "Karnataka", country: "India", countryCode: "IN", lat: 13.3379, lng: 77.1173 },
  { name: "Udupi", district: "Udupi District", state: "Karnataka", country: "India", countryCode: "IN", lat: 13.3409, lng: 74.7421 },
  { name: "Shivamogga", district: "Shivamogga District", state: "Karnataka", country: "India", countryCode: "IN", lat: 13.9299, lng: 75.5681 },

  // Tamil Nadu Districts
  { name: "Chennai", district: "Chennai District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 13.0827, lng: 80.2707 },
  { name: "Coimbatore", district: "Coimbatore District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 11.0168, lng: 76.9558 },
  { name: "Madurai", district: "Madurai District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 9.9252, lng: 78.1198 },
  { name: "Salem", district: "Salem District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 11.6643, lng: 78.1460 },
  { name: "Tiruchirappalli", district: "Tiruchirappalli District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 10.7905, lng: 78.7047 },
  { name: "Tirunelveli", district: "Tirunelveli District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 8.7139, lng: 77.7567 },

  // Chhattisgarh & MP & Bihar & Others
  { name: "Bastar", district: "Bastar District", state: "Chhattisgarh", country: "India", countryCode: "IN", lat: 19.0760, lng: 82.0298 },
  { name: "Raipur", district: "Raipur District", state: "Chhattisgarh", country: "India", countryCode: "IN", lat: 21.2514, lng: 81.6296 },
  { name: "Bhopal", district: "Bhopal District", state: "Madhya Pradesh", country: "India", countryCode: "IN", lat: 23.2599, lng: 77.4126 },
  { name: "Indore", district: "Indore District", state: "Madhya Pradesh", country: "India", countryCode: "IN", lat: 22.7196, lng: 75.8577 },
  { name: "Gwalior", district: "Gwalior District", state: "Madhya Pradesh", country: "India", countryCode: "IN", lat: 26.2183, lng: 78.1828 },
  { name: "Patna", district: "Patna District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.5941, lng: 85.1376 },
  { name: "Gaya", district: "Gaya District", state: "Bihar", country: "India", countryCode: "IN", lat: 24.7914, lng: 85.0002 },
  { name: "Muzaffarpur", district: "Muzaffarpur District", state: "Bihar", country: "India", countryCode: "IN", lat: 26.1209, lng: 85.3647 },
  { name: "Bhagalpur", district: "Bhagalpur District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.2425, lng: 86.9842 },
  { name: "Darbhanga", district: "Darbhanga District", state: "Bihar", country: "India", countryCode: "IN", lat: 26.1542, lng: 85.8918 },
  { name: "Purnia", district: "Purnia District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.7771, lng: 87.4753 },
  { name: "Leh", district: "Leh District", state: "Ladakh", country: "India", countryCode: "IN", lat: 34.1526, lng: 77.5771 },
  { name: "Shimla", district: "Shimla District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 31.1048, lng: 77.1734 },
  { name: "Dehradun", district: "Dehradun District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 30.3165, lng: 78.0322 },
  { name: "Srinagar", district: "Srinagar District", state: "Jammu and Kashmir", country: "India", countryCode: "IN", lat: 34.0837, lng: 74.7973 },
  { name: "Guwahati", district: "Kamrup Metropolitan", state: "Assam", country: "India", countryCode: "IN", lat: 26.1445, lng: 91.7362 },
  { name: "Bhubaneswar", district: "Khurda District", state: "Odisha", country: "India", countryCode: "IN", lat: 20.2961, lng: 85.8245 },
  { name: "Visakhapatnam", district: "Visakhapatnam District", state: "Andhra Pradesh", country: "India", countryCode: "IN", lat: 17.6868, lng: 83.2185 },

  // Global Metros
  { name: "London", district: "Greater London", state: "England", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", district: "Paris Department", state: "Île-de-France", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522 },
  { name: "Tokyo", district: "Tokyo Metropolis", state: "Kanto", country: "Japan", countryCode: "JP", lat: 35.6762, lng: 139.6503 },
  { name: "New York", district: "New York County", state: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.0060 },
  { name: "Dubai", district: "Dubai Emirate", state: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lng: 55.2708 },
  { name: "Singapore", district: "Central Region", state: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lng: 103.8198 },
];

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

  const cleanQuery = q.replace(/\b(district|dist|zila|city|town|region)\b/gi, "").trim() || q;
  const qLower = cleanQuery.toLowerCase();

  // 1. Check matching districts from the high-precision catalog
  const catalogMatches = DISTRICT_CATALOG.filter(
    (c) =>
      c.name.toLowerCase().includes(qLower) ||
      c.district.toLowerCase().includes(qLower) ||
      c.state.toLowerCase().includes(qLower)
  ).slice(0, 5);

  let results: any[] = [];

  // 2. Fetch Open-Meteo Geocoding results
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleanQuery
    )}&count=8&language=en&format=json`;

    const geoRes = await fetch(geoUrl, { next: { revalidate: 3600 } });
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const rawApiResults = geoData.results || [];

      for (const item of rawApiResults) {
        // Skip if already in catalog matches
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

  // Merge catalog matches at the top + api results
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

  // 3. Fetch live mini-weather for the places in parallel
  const enrichedResults = await Promise.all(
    allPlaces.map(async (item) => {
      let temp: number | null = null;
      let weatherCode = 0;

      try {
        const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${item.lat}&longitude=${item.lng}&current=temperature_2m,weather_code`;
        const wRes = await fetch(wUrl, { next: { revalidate: 300 } });
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
