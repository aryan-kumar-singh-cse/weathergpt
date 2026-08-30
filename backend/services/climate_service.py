"""
WeatherGPT Climate Service
Historical weather data and climate trend analysis using Open-Meteo Archive API
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import httpx
import statistics

logger = logging.getLogger(__name__)


class ClimateService:
    """
    Climate data service using Open-Meteo Historical Archive API.
    Provides historical weather data, trend analysis, and climate comparisons.
    All data is grounded in real API responses - no invented values.
    """

    def __init__(self):
        self.archive_url = "https://archive-api.open-meteo.com/v1/archive"
        self.timeout = 15.0  # seconds (historical queries can be slower)

    async def fetch_historical_weather(
        self,
        lat: float,
        lng: float,
        start_date: str,
        end_date: str,
        metrics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Fetch historical weather data from Open-Meteo Archive API.

        Args:
            lat: Latitude
            lng: Longitude
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            metrics: List of metrics to retrieve (default: temperature, precipitation)

        Returns:
            Dict with historical weather data
        """
        if metrics is None:
            metrics = ["temperature", "precipitation"]

        # Map friendly metric names to Open-Meteo API parameters
        daily_params = []
        if "temperature" in metrics:
            daily_params.extend([
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean"
            ])
        if "precipitation" in metrics:
            daily_params.extend([
                "precipitation_sum",
                "precipitation_hours"
            ])
        if "wind" in metrics:
            daily_params.append("wind_speed_10m_max")
        if "humidity" in metrics:
            daily_params.append("relative_humidity_2m_mean")

        params = {
            "latitude": lat,
            "longitude": lng,
            "start_date": start_date,
            "end_date": end_date,
            "daily": daily_params,
            "timezone": "auto"
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.archive_url, params=params)
                response.raise_for_status()
                data = response.json()

            result = {
                "location": {
                    "lat": lat,
                    "lng": lng,
                    "timezone": data.get("timezone", "UTC")
                },
                "period": {
                    "start": start_date,
                    "end": end_date
                },
                "daily_data": data.get("daily", {}),
                "data_source": "Open-Meteo Historical Archive",
                "timestamp": datetime.utcnow().isoformat()
            }

            return result

        except httpx.TimeoutException:
            logger.error(f"Open-Meteo Archive API timeout for lat={lat}, lng={lng}")
            raise Exception("Historical weather API timeout. Please try again.")
        except httpx.HTTPStatusError as e:
            logger.error(f"Open-Meteo Archive API error: {e}")
            raise Exception(f"Historical weather API returned an error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Failed to fetch historical weather data: {e}")
            raise Exception("Could not fetch historical weather data.")

    async def analyze_temperature_trend(
        self,
        lat: float,
        lng: float,
        years: int = 10
    ) -> Dict[str, Any]:
        """
        Analyze temperature trend over the specified number of years.

        Args:
            lat: Latitude
            lng: Longitude
            years: Number of years to analyze (default: 10)

        Returns:
            Dict with temperature trend analysis
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=years * 365)

        historical_data = await self.fetch_historical_weather(
            lat=lat,
            lng=lng,
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            metrics=["temperature"]
        )

        daily = historical_data.get("daily_data", {})
        dates = daily.get("time", [])
        temp_max = daily.get("temperature_2m_max", [])
        temp_min = daily.get("temperature_2m_min", [])
        temp_mean = daily.get("temperature_2m_mean", [])

        # Calculate yearly averages
        yearly_stats = self._calculate_yearly_stats(dates, temp_mean, temp_max, temp_min)

        # Calculate trend
        trend = self._calculate_trend(yearly_stats)

        return {
            "location": historical_data["location"],
            "period": {
                "start_year": start_date.year,
                "end_year": end_date.year,
                "years_analyzed": years
            },
            "yearly_averages": yearly_stats,
            "trend": trend,
            "data_source": "Open-Meteo Historical Archive"
        }

    async def compare_monsoon_onset(
        self,
        lat: float,
        lng: float,
        current_year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Compare current year's monsoon onset to historical average.
        Monsoon onset is estimated by significant rainfall start (typically June in India).

        Args:
            lat: Latitude
            lng: Longitude
            current_year: Year to analyze (default: current year)

        Returns:
            Dict with monsoon onset comparison
        """
        if current_year is None:
            current_year = datetime.now().year

        # Fetch current year monsoon period (May-July)
        current_start = f"{current_year}-05-01"
        current_end = f"{current_year}-07-31"

        current_data = await self.fetch_historical_weather(
            lat=lat,
            lng=lng,
            start_date=current_start,
            end_date=current_end,
            metrics=["precipitation"]
        )

        # Fetch historical average (past 10 years)
        historical_onsets = []
        for year in range(current_year - 10, current_year):
            hist_start = f"{year}-05-01"
            hist_end = f"{year}-07-31"

            try:
                hist_data = await self.fetch_historical_weather(
                    lat=lat,
                    lng=lng,
                    start_date=hist_start,
                    end_date=hist_end,
                    metrics=["precipitation"]
                )

                onset = self._estimate_monsoon_onset(hist_data.get("daily_data", {}))
                if onset:
                    historical_onsets.append(onset)

            except Exception as e:
                logger.warning(f"Failed to fetch data for year {year}: {e}")

        # Estimate current year onset
        current_onset = self._estimate_monsoon_onset(current_data.get("daily_data", {}))

        # Calculate historical average
        avg_onset = None
        if historical_onsets:
            avg_day = statistics.mean([self._date_to_day_of_year(d) for d in historical_onsets])
            avg_onset = self._day_of_year_to_date(int(avg_day), current_year)

        comparison = None
        if current_onset and avg_onset:
            current_day = self._date_to_day_of_year(current_onset)
            avg_day_num = self._date_to_day_of_year(avg_onset)
            difference = current_day - avg_day_num

            if difference > 0:
                comparison = f"{difference} days later than historical average"
            elif difference < 0:
                comparison = f"{abs(difference)} days earlier than historical average"
            else:
                comparison = "On time with historical average"

        return {
            "location": current_data["location"],
            "current_year": {
                "year": current_year,
                "onset_date": current_onset,
                "onset_status": "detected" if current_onset else "not yet detected"
            },
            "historical_average": {
                "period": f"{current_year - 10}-{current_year - 1}",
                "average_onset_date": avg_onset,
                "sample_size": len(historical_onsets)
            },
            "comparison": comparison,
            "data_source": "Open-Meteo Historical Archive"
        }

    async def analyze_extreme_events(
        self,
        lat: float,
        lng: float,
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Analyze extreme weather events for a specific year.

        Args:
            lat: Latitude
            lng: Longitude
            year: Year to analyze (default: current year)

        Returns:
            Dict with extreme event analysis
        """
        if year is None:
            year = datetime.now().year

        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"

        historical_data = await self.fetch_historical_weather(
            lat=lat,
            lng=lng,
            start_date=start_date,
            end_date=end_date,
            metrics=["temperature", "precipitation"]
        )

        daily = historical_data.get("daily_data", {})
        temp_max = daily.get("temperature_2m_max", [])
        temp_min = daily.get("temperature_2m_min", [])
        precip = daily.get("precipitation_sum", [])

        # Analyze extreme events
        extreme_heat_days = sum(1 for t in temp_max if t is not None and t >= 40)
        cold_days = sum(1 for t in temp_min if t is not None and t <= 10)
        heavy_rain_days = sum(1 for p in precip if p is not None and p >= 50)
        very_heavy_rain_days = sum(1 for p in precip if p is not None and p >= 100)

        # Calculate extremes
        max_temp = max((t for t in temp_max if t is not None), default=None)
        min_temp = min((t for t in temp_min if t is not None), default=None)
        max_rainfall = max((p for p in precip if p is not None), default=None)
        total_rainfall = sum((p for p in precip if p is not None), default=0)

        return {
            "location": historical_data["location"],
            "year": year,
            "temperature_extremes": {
                "hottest_day_temp": max_temp,
                "coldest_day_temp": min_temp,
                "extreme_heat_days": extreme_heat_days,
                "cold_days": cold_days,
                "unit": "°C"
            },
            "precipitation_extremes": {
                "max_daily_rainfall": max_rainfall,
                "total_annual_rainfall": round(total_rainfall, 1),
                "heavy_rain_days": heavy_rain_days,
                "very_heavy_rain_days": very_heavy_rain_days,
                "unit": "mm"
            },
            "data_source": "Open-Meteo Historical Archive"
        }

    async def compare_current_to_historical(
        self,
        lat: float,
        lng: float,
        metric: str = "temperature"
    ) -> Dict[str, Any]:
        """
        Compare current month's weather to historical average for the same month.

        Args:
            lat: Latitude
            lng: Longitude
            metric: Metric to compare (temperature, precipitation)

        Returns:
            Dict with current vs historical comparison
        """
        now = datetime.now()
        current_month = now.month
        current_year = now.year

        # Current month data (from start of month to today)
        current_start = f"{current_year}-{current_month:02d}-01"
        current_end = now.strftime("%Y-%m-%d")

        current_data = await self.fetch_historical_weather(
            lat=lat,
            lng=lng,
            start_date=current_start,
            end_date=current_end,
            metrics=[metric]
        )

        # Historical data for the same month (past 10 years)
        historical_values = []
        for year in range(current_year - 10, current_year):
            hist_start = f"{year}-{current_month:02d}-01"
            hist_end = f"{year}-{current_month:02d}-{now.day:02d}"

            try:
                hist_data = await self.fetch_historical_weather(
                    lat=lat,
                    lng=lng,
                    start_date=hist_start,
                    end_date=hist_end,
                    metrics=[metric]
                )

                values = self._extract_metric_values(hist_data.get("daily_data", {}), metric)
                historical_values.extend(values)

            except Exception as e:
                logger.warning(f"Failed to fetch data for {year}-{current_month:02d}: {e}")

        # Calculate current average
        current_values = self._extract_metric_values(current_data.get("daily_data", {}), metric)
        current_avg = statistics.mean(current_values) if current_values else None

        # Calculate historical average
        historical_avg = statistics.mean(historical_values) if historical_values else None

        # Calculate difference
        difference = None
        percentage_diff = None
        comparison_text = None

        if current_avg is not None and historical_avg is not None:
            difference = round(current_avg - historical_avg, 2)

            if metric == "temperature":
                if difference > 0:
                    comparison_text = f"{difference}°C warmer than historical average"
                elif difference < 0:
                    comparison_text = f"{abs(difference)}°C cooler than historical average"
                else:
                    comparison_text = "On par with historical average"
            elif metric == "precipitation":
                percentage_diff = round((difference / historical_avg * 100), 1) if historical_avg != 0 else 0
                if percentage_diff > 0:
                    comparison_text = f"{percentage_diff}% more rainfall than historical average"
                elif percentage_diff < 0:
                    comparison_text = f"{abs(percentage_diff)}% less rainfall than historical average"
                else:
                    comparison_text = "On par with historical average"

        month_names = ["", "January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"]

        return {
            "location": current_data["location"],
            "metric": metric,
            "month": {
                "number": current_month,
                "name": month_names[current_month],
                "year": current_year
            },
            "current_average": round(current_avg, 2) if current_avg else None,
            "historical_average": round(historical_avg, 2) if historical_avg else None,
            "difference": difference,
            "comparison": comparison_text,
            "historical_period": f"{current_year - 10}-{current_year - 1}",
            "data_source": "Open-Meteo Historical Archive"
        }

    def _calculate_yearly_stats(
        self,
        dates: List[str],
        temp_mean: List[float],
        temp_max: List[float],
        temp_min: List[float]
    ) -> List[Dict[str, Any]]:
        """Calculate yearly statistics from daily data."""
        yearly_data = {}

        for i, date in enumerate(dates):
            year = date.split("-")[0]

            if year not in yearly_data:
                yearly_data[year] = {
                    "mean": [],
                    "max": [],
                    "min": []
                }

            if i < len(temp_mean) and temp_mean[i] is not None:
                yearly_data[year]["mean"].append(temp_mean[i])
            if i < len(temp_max) and temp_max[i] is not None:
                yearly_data[year]["max"].append(temp_max[i])
            if i < len(temp_min) and temp_min[i] is not None:
                yearly_data[year]["min"].append(temp_min[i])

        yearly_stats = []
        for year, data in sorted(yearly_data.items()):
            stats = {
                "year": int(year),
                "avg_temperature": round(statistics.mean(data["mean"]), 2) if data["mean"] else None,
                "avg_max_temperature": round(statistics.mean(data["max"]), 2) if data["max"] else None,
                "avg_min_temperature": round(statistics.mean(data["min"]), 2) if data["min"] else None
            }
            yearly_stats.append(stats)

        return yearly_stats

    def _calculate_trend(self, yearly_stats: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate temperature trend using linear regression."""
        if len(yearly_stats) < 2:
            return {"trend": "insufficient data", "change_per_decade": None}

        years = [stat["year"] for stat in yearly_stats if stat["avg_temperature"]]
        temps = [stat["avg_temperature"] for stat in yearly_stats if stat["avg_temperature"]]

        if len(temps) < 2:
            return {"trend": "insufficient data", "change_per_decade": None}

        # Simple linear regression
        n = len(years)
        mean_year = sum(years) / n
        mean_temp = sum(temps) / n

        numerator = sum((years[i] - mean_year) * (temps[i] - mean_temp) for i in range(n))
        denominator = sum((years[i] - mean_year) ** 2 for i in range(n))

        if denominator == 0:
            return {"trend": "no significant trend", "change_per_decade": 0}

        slope = numerator / denominator
        change_per_decade = round(slope * 10, 2)

        if change_per_decade > 0.5:
            trend_text = f"warming trend: +{change_per_decade}°C per decade"
        elif change_per_decade < -0.5:
            trend_text = f"cooling trend: {change_per_decade}°C per decade"
        else:
            trend_text = "stable (no significant trend)"

        return {
            "trend": trend_text,
            "change_per_decade": change_per_decade,
            "unit": "°C per decade"
        }

    def _estimate_monsoon_onset(self, daily_data: Dict[str, Any]) -> Optional[str]:
        """
        Estimate monsoon onset date based on sustained rainfall.
        Defined as: first date with 3+ consecutive days of 5mm+ rainfall.
        """
        dates = daily_data.get("time", [])
        precip = daily_data.get("precipitation_sum", [])

        consecutive_rain_days = 0
        onset_candidate = None

        for i, rain in enumerate(precip):
            if rain is not None and rain >= 5:
                if consecutive_rain_days == 0:
                    onset_candidate = dates[i]
                consecutive_rain_days += 1

                if consecutive_rain_days >= 3:
                    return onset_candidate
            else:
                consecutive_rain_days = 0
                onset_candidate = None

        return None

    def _date_to_day_of_year(self, date_str: str) -> int:
        """Convert date string to day of year."""
        date = datetime.strptime(date_str, "%Y-%m-%d")
        return date.timetuple().tm_yday

    def _day_of_year_to_date(self, day: int, year: int) -> str:
        """Convert day of year to date string."""
        date = datetime(year, 1, 1) + timedelta(days=day - 1)
        return date.strftime("%Y-%m-%d")

    def _extract_metric_values(self, daily_data: Dict[str, Any], metric: str) -> List[float]:
        """Extract metric values from daily data."""
        if metric == "temperature":
            values = daily_data.get("temperature_2m_mean", [])
        elif metric == "precipitation":
            values = daily_data.get("precipitation_sum", [])
        else:
            values = []

        return [v for v in values if v is not None]


# Global instance
climate_service = ClimateService()


if __name__ == "__main__":
    # Test the service
    import asyncio

    async def test():
        # Mumbai coordinates
        lat, lng = 19.0760, 72.8777

        print("Testing Historical Weather Analysis...")

        # Test 1: Temperature trend analysis
        print("\n=== Temperature Trend (Last 10 Years) ===")
        trend = await climate_service.analyze_temperature_trend(lat, lng, years=5)
        print(f"Period: {trend['period']['start_year']}-{trend['period']['end_year']}")
        print(f"Trend: {trend['trend']['trend']}")

        # Test 2: Monsoon onset comparison
        print("\n=== Monsoon Onset Comparison ===")
        monsoon = await climate_service.compare_monsoon_onset(lat, lng)
        print(f"Current year onset: {monsoon['current_year']['onset_date']}")
        print(f"Historical average: {monsoon['historical_average']['average_onset_date']}")
        print(f"Comparison: {monsoon['comparison']}")

        # Test 3: Current vs historical comparison
        print("\n=== Current vs Historical Comparison ===")
        comparison = await climate_service.compare_current_to_historical(lat, lng, "temperature")
        print(f"Current average: {comparison['current_average']}°C")
        print(f"Historical average: {comparison['historical_average']}°C")
        print(f"Comparison: {comparison['comparison']}")

    asyncio.run(test())
