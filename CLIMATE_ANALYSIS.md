# Climate Trend and Historical Weather Analysis

## Overview

WeatherGPT now includes comprehensive climate trend and historical weather analysis capabilities using the Open-Meteo Historical Archive API. All historical data is **grounded in real API responses** - no LLM-invented values.

## Features

### 1. Historical Weather Data
- Access weather data from 1940 onwards
- Daily temperature (max, min, mean)
- Precipitation (sum, hours)
- Wind speed and humidity
- Timezone-aware queries

### 2. Temperature Trend Analysis
- Multi-year temperature trends (1-20 years)
- Linear regression-based trend calculation
- Year-over-year comparison
- Warming/cooling trend detection

### 3. Monsoon Onset Comparison
- Compare current year monsoon onset to historical average
- 10-year historical baseline
- Monsoon onset detection algorithm (3+ consecutive days with 5mm+ rainfall)
- Early/late onset identification

### 4. Current vs Historical Comparison
- Compare current month to historical average
- Temperature and precipitation comparisons
- Percentage deviation calculations
- Context-aware interpretation

### 5. Extreme Events Analysis
- Extreme heat days (≥40°C)
- Cold days (≤10°C)
- Heavy rain days (≥50mm)
- Very heavy rain days (≥100mm)
- Annual rainfall totals
- Record high/low temperatures

## API Endpoints

### 1. Get Historical Weather Data
```http
GET /api/v1/climate/historical
```

**Parameters:**
- `lat` (float, optional): Latitude
- `lng` (float, optional): Longitude
- `city` (string, optional): City name (geocoded if lat/lng not provided)
- `start_date` (string): Start date in YYYY-MM-DD format
- `end_date` (string): End date in YYYY-MM-DD format
- `metrics` (string): Comma-separated list (temperature, precipitation, wind, humidity)

**Example:**
```bash
curl "http://localhost:8000/api/v1/climate/historical?city=Mumbai&start_date=2023-01-01&end_date=2023-12-31&metrics=temperature,precipitation"
```

**Response:**
```json
{
  "location": {
    "lat": 19.0760,
    "lng": 72.8777,
    "timezone": "Asia/Kolkata"
  },
  "period": {
    "start": "2023-01-01",
    "end": "2023-12-31"
  },
  "daily_data": {
    "time": ["2023-01-01", "2023-01-02", ...],
    "temperature_2m_max": [28.5, 29.2, ...],
    "temperature_2m_min": [20.1, 21.3, ...],
    "precipitation_sum": [0.0, 2.5, ...]
  },
  "data_source": "Open-Meteo Historical Archive"
}
```

### 2. Temperature Trend Analysis
```http
GET /api/v1/climate/trends
```

**Parameters:**
- `lat`, `lng`, or `city`: Location
- `years` (int, 1-20): Number of years to analyze (default: 10)

**Example:**
```bash
curl "http://localhost:8000/api/v1/climate/trends?city=Delhi&years=10"
```

**Response:**
```json
{
  "location": {...},
  "period": {
    "start_year": 2016,
    "end_year": 2026,
    "years_analyzed": 10
  },
  "yearly_averages": [
    {"year": 2016, "avg_temperature": 26.5, "avg_max_temperature": 32.1, "avg_min_temperature": 20.9},
    {"year": 2017, "avg_temperature": 26.8, ...},
    ...
  ],
  "trend": {
    "trend": "warming trend: +0.3°C per decade",
    "change_per_decade": 0.3,
    "unit": "°C per decade"
  }
}
```

### 3. Monsoon Onset Comparison
```http
GET /api/v1/climate/monsoon-comparison
```

**Parameters:**
- `lat`, `lng`, or `city`: Location
- `year` (int, optional): Year to analyze (default: current year)

**Example:**
```bash
curl "http://localhost:8000/api/v1/climate/monsoon-comparison?city=Mumbai"
```

**Response:**
```json
{
  "location": {...},
  "current_year": {
    "year": 2026,
    "onset_date": "2026-06-08",
    "onset_status": "detected"
  },
  "historical_average": {
    "period": "2016-2025",
    "average_onset_date": "2026-06-12",
    "sample_size": 10
  },
  "comparison": "4 days earlier than historical average"
}
```

### 4. Current vs Historical Comparison
```http
GET /api/v1/climate/comparison
```

**Parameters:**
- `lat`, `lng`, or `city`: Location
- `metric` (string): temperature or precipitation

**Example:**
```bash
curl "http://localhost:8000/api/v1/climate/comparison?city=Chennai&metric=temperature"
```

**Response:**
```json
{
  "location": {...},
  "metric": "temperature",
  "month": {
    "number": 8,
    "name": "August",
    "year": 2026
  },
  "current_average": 29.5,
  "historical_average": 28.2,
  "difference": 1.3,
  "comparison": "1.3°C warmer than historical average",
  "historical_period": "2016-2025"
}
```

### 5. Extreme Events Analysis
```http
GET /api/v1/climate/extreme-events
```

**Parameters:**
- `lat`, `lng`, or `city`: Location
- `year` (int, optional): Year to analyze (default: current year)

**Example:**
```bash
curl "http://localhost:8000/api/v1/climate/extreme-events?city=Bangalore&year=2025"
```

**Response:**
```json
{
  "location": {...},
  "year": 2025,
  "temperature_extremes": {
    "hottest_day_temp": 38.5,
    "coldest_day_temp": 14.2,
    "extreme_heat_days": 12,
    "cold_days": 3,
    "unit": "°C"
  },
  "precipitation_extremes": {
    "max_daily_rainfall": 145.3,
    "total_annual_rainfall": 967.5,
    "heavy_rain_days": 8,
    "very_heavy_rain_days": 2,
    "unit": "mm"
  }
}
```

## Chat Integration

Historical and climate queries are automatically detected and routed through the climate service. The conversational AI generates natural language responses based on real historical data.

### Example Queries

#### 1. Monsoon Comparison
**Query:** "Compare this year's monsoon onset to historical average for Mumbai"

**Response:**
```
The monsoon arrived in Mumbai on June 8th this year, which is actually 4 days earlier than the historical average onset date of June 12th (based on data from 2016-2025). This early arrival is good news for the region, as it means an earlier start to the rainy season.
```

#### 2. Temperature Trends
**Query:** "Show temperature trend for Delhi over past 10 years"

**Response:**
```
Looking at Delhi's temperature data from 2016 to 2026, there's a clear warming trend. The average annual temperature has increased by approximately 0.3°C per decade. 

Here are the recent yearly averages:
- 2022: 26.5°C
- 2023: 26.7°C
- 2024: 26.9°C
- 2025: 27.1°C
- 2026: 27.2°C

This warming trend is consistent with broader climate patterns affecting the region.
```

#### 3. Current vs Historical
**Query:** "How does this month's temperature in Chennai compare to normal?"

**Response:**
```
This August in Chennai has been warmer than usual. The average temperature so far this month is 29.5°C, which is 1.3°C warmer than the historical average of 28.2°C for August (based on data from 2016-2025). The weather has been noticeably hotter than typical August conditions.
```

#### 4. Extreme Events
**Query:** "What were the extreme weather events in Bangalore this year?"

**Response:**
```
Here's a summary of extreme weather events in Bangalore in 2025:

Temperature Extremes:
- Hottest day reached 38.5°C
- Coldest day dropped to 14.2°C
- We experienced 12 days with extreme heat (40°C or above)
- There were 3 cold days with temperatures at or below 10°C

Rainfall Extremes:
- The heaviest single-day rainfall was 145.3mm
- Total rainfall for the year: 967.5mm
- 8 days with heavy rain (50mm or more)
- 2 days with very heavy rain (100mm or more)

Overall, 2025 saw some significant weather extremes with both hot spells and heavy rainfall events.
```

#### 5. Climate Change Context
**Query:** "Is it warmer this year than the historical average in Kolkata?"

**Response:**
```
Yes, Kolkata is experiencing warmer conditions this year. Looking at this August specifically, the average temperature is 30.2°C, which is 1.5°C above the historical average of 28.7°C for this month. This continues a broader warming trend observed over the past decade in the region.
```

#### 6. Rainfall Patterns
**Query:** "How has rainfall changed in Hyderabad over the last decade?"

**Response:**
```
Analyzing Hyderabad's rainfall patterns from 2016 to 2026 shows interesting trends. While year-to-year variability is normal, there's been a slight increase in the frequency of heavy rainfall events, with more days exceeding 50mm of rain compared to the earlier part of the decade. Total annual rainfall has fluctuated between 750mm and 1100mm, with no clear long-term trend in total amounts, but a shift toward more intense rainfall concentrated in fewer days.
```

## Technical Implementation

### Architecture

```
User Query
    ↓
Intent Extraction (chat_service)
    ↓
Historical Intent Detected?
    ├─ Yes → Climate Service (climate_service)
    │         ↓
    │    Open-Meteo Historical Archive API
    │         ↓
    │    Historical Data Processing
    │         ↓
    │    Natural Language Response Generation
    │
    └─ No → Weather Service (weather_service)
              ↓
         Open-Meteo Forecast API
              ↓
         Current/Forecast Response
```

### Data Flow

1. **Intent Detection**: Chat service analyzes query for historical keywords (trend, monsoon, compare, historical, past, years, etc.)

2. **Data Fetching**: Climate service calls Open-Meteo Historical Archive API with appropriate parameters

3. **Analysis**: Climate service processes raw data:
   - Calculates yearly averages
   - Performs trend analysis (linear regression)
   - Detects monsoon onset using precipitation patterns
   - Identifies extreme events based on thresholds

4. **Response Generation**: LLM generates natural language response grounded in the analyzed data

### Key Files

- `/backend/services/climate_service.py` - Historical data fetching and analysis
- `/backend/api/routes/climate.py` - Climate API endpoints
- `/backend/services/chat_service.py` - Intent detection and response generation
- `/backend/api/routes/ask.py` - Main conversational endpoint with historical support

## Data Grounding

All historical data comes from **Open-Meteo Historical Archive API**:
- Data availability: 1940-present
- Updates: Daily
- Resolution: Daily values
- Coverage: Global
- No LLM-invented values - all numbers are from real weather observations

### Data Quality Notes

- Historical data before 1950 may have gaps depending on location
- Indian Meteorological Department (IMD) stations have excellent coverage since 1950s
- Coastal and urban areas have better historical coverage than remote regions
- Monsoon onset detection is heuristic-based (3+ consecutive days with 5mm+ rainfall)

## Testing

### Manual Testing

```bash
# Test historical data endpoint
curl "http://localhost:8000/api/v1/climate/historical?city=Mumbai&start_date=2023-01-01&end_date=2023-12-31"

# Test temperature trends
curl "http://localhost:8000/api/v1/climate/trends?city=Delhi&years=5"

# Test monsoon comparison
curl "http://localhost:8000/api/v1/climate/monsoon-comparison?city=Mumbai"

# Test current vs historical
curl "http://localhost:8000/api/v1/climate/comparison?city=Chennai&metric=temperature"

# Test extreme events
curl "http://localhost:8000/api/v1/climate/extreme-events?city=Bangalore&year=2025"
```

### Chat Integration Testing

```bash
# Test historical query via chat endpoint
curl -X POST "http://localhost:8000/api/v1/ask" \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session" \
  -d '{
    "query": "Compare this year'\''s monsoon onset to historical average for Mumbai",
    "email": "test@example.com",
    "language": "en",
    "role": "citizen"
  }'
```

### Python Testing

```python
# Test climate service directly
import asyncio
from backend.services.climate_service import climate_service

async def test():
    # Mumbai coordinates
    lat, lng = 19.0760, 72.8777
    
    # Test temperature trend
    trend = await climate_service.analyze_temperature_trend(lat, lng, years=10)
    print(f"Trend: {trend['trend']['trend']}")
    
    # Test monsoon comparison
    monsoon = await climate_service.compare_monsoon_onset(lat, lng)
    print(f"Monsoon comparison: {monsoon['comparison']}")

asyncio.run(test())
```

## Limitations

1. **Historical Data Availability**: Data quality and availability vary by location and time period
2. **Monsoon Detection**: Uses a simplified algorithm (3+ days with 5mm+ rain) - actual monsoon onset is more complex
3. **Trend Analysis**: Linear regression may oversimplify complex climate patterns
4. **API Limits**: Open-Meteo Archive API may have rate limits or timeout for very large date ranges
5. **Processing Time**: Historical queries take longer than current weather queries (3-10 seconds vs <1 second)

## Future Enhancements

1. **Climate Projections**: Add future climate scenarios from CMIP6 models
2. **Seasonal Analysis**: Add seasonal climate normals (DJF, MAM, JJA, SON)
3. **Climate Indices**: Add El Niño/La Niña, IOD, monsoon indices
4. **Visualization**: Add charts and graphs for trends and comparisons
5. **Agricultural Metrics**: Growing degree days, frost days, dry spell analysis
6. **Extreme Event Detection**: More sophisticated algorithms for heatwaves, cold spells, droughts
7. **Multi-location Comparison**: Compare climate across multiple cities
8. **Export Options**: CSV/JSON export of historical data

## References

- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- [Open-Meteo Documentation](https://open-meteo.com/en/docs)
- [WMO Weather Codes](https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM)
- [Indian Monsoon](https://en.wikipedia.org/wiki/Monsoon_of_South_Asia)

## Support

For issues or questions about climate analysis features:
1. Check API endpoint responses for error messages
2. Verify location geocoding is working correctly
3. Ensure date ranges are valid (YYYY-MM-DD format)
4. Check logs for Open-Meteo API errors
5. Try smaller date ranges if queries timeout

---

**Last Updated**: August 29, 2026
