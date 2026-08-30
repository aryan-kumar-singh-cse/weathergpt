"""
Test script for climate trend and historical weather analysis features.
Run this to verify the implementation is working correctly.
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.services.climate_service import climate_service
from backend.services.geocoding_service import geocoding_service


async def test_historical_data():
    """Test fetching historical weather data."""
    print("\n" + "="*60)
    print("TEST 1: Historical Weather Data")
    print("="*60)

    try:
        # Mumbai coordinates
        lat, lng = 19.0760, 72.8777

        # Fetch last year's data
        historical_data = await climate_service.fetch_historical_weather(
            lat=lat,
            lng=lng,
            start_date="2025-01-01",
            end_date="2025-12-31",
            metrics=["temperature", "precipitation"]
        )

        print(f"✓ Location: {historical_data['location']}")
        print(f"✓ Period: {historical_data['period']}")

        daily = historical_data.get("daily_data", {})
        dates = daily.get("time", [])
        print(f"✓ Data points: {len(dates)} days")

        if dates:
            print(f"✓ Date range: {dates[0]} to {dates[-1]}")

        print(f"✓ Data source: {historical_data['data_source']}")
        print("\n✅ Historical data fetch: PASSED")

    except Exception as e:
        print(f"\n❌ Historical data fetch: FAILED")
        print(f"Error: {e}")
        raise


async def test_temperature_trend():
    """Test temperature trend analysis."""
    print("\n" + "="*60)
    print("TEST 2: Temperature Trend Analysis")
    print("="*60)

    try:
        # Delhi coordinates
        lat, lng = 28.6139, 77.2090

        trend_data = await climate_service.analyze_temperature_trend(
            lat=lat,
            lng=lng,
            years=5
        )

        print(f"✓ Location: {trend_data['location']}")
        print(f"✓ Period: {trend_data['period']['start_year']}-{trend_data['period']['end_year']}")

        yearly_stats = trend_data.get("yearly_averages", [])
        print(f"✓ Yearly averages: {len(yearly_stats)} years")

        if yearly_stats:
            print("\n  Recent years:")
            for year_data in yearly_stats[-3:]:
                print(f"    {year_data['year']}: {year_data['avg_temperature']}°C")

        trend = trend_data.get("trend", {})
        print(f"\n✓ Trend: {trend.get('trend')}")
        print(f"✓ Change per decade: {trend.get('change_per_decade')}°C")

        print("\n✅ Temperature trend analysis: PASSED")

    except Exception as e:
        print(f"\n❌ Temperature trend analysis: FAILED")
        print(f"Error: {e}")
        raise


async def test_monsoon_comparison():
    """Test monsoon onset comparison."""
    print("\n" + "="*60)
    print("TEST 3: Monsoon Onset Comparison")
    print("="*60)

    try:
        # Mumbai coordinates (good monsoon test location)
        lat, lng = 19.0760, 72.8777

        monsoon_data = await climate_service.compare_monsoon_onset(
            lat=lat,
            lng=lng,
            current_year=2025  # Use 2025 for complete data
        )

        print(f"✓ Location: {monsoon_data['location']}")

        current = monsoon_data.get("current_year", {})
        print(f"\n✓ Current year ({current['year']}):")
        print(f"    Onset date: {current['onset_date']}")
        print(f"    Status: {current['onset_status']}")

        historical = monsoon_data.get("historical_average", {})
        print(f"\n✓ Historical average ({historical['period']}):")
        print(f"    Average onset: {historical['average_onset_date']}")
        print(f"    Sample size: {historical['sample_size']} years")

        print(f"\n✓ Comparison: {monsoon_data.get('comparison')}")

        print("\n✅ Monsoon onset comparison: PASSED")

    except Exception as e:
        print(f"\n❌ Monsoon onset comparison: FAILED")
        print(f"Error: {e}")
        raise


async def test_current_vs_historical():
    """Test current vs historical comparison."""
    print("\n" + "="*60)
    print("TEST 4: Current vs Historical Comparison")
    print("="*60)

    try:
        # Chennai coordinates
        lat, lng = 13.0827, 80.2707

        comparison = await climate_service.compare_current_to_historical(
            lat=lat,
            lng=lng,
            metric="temperature"
        )

        print(f"✓ Location: {comparison['location']}")

        month = comparison.get("month", {})
        print(f"\n✓ Month: {month['name']} {month['year']}")
        print(f"✓ Current average: {comparison['current_average']}°C")
        print(f"✓ Historical average: {comparison['historical_average']}°C")
        print(f"✓ Difference: {comparison['difference']}°C")
        print(f"✓ Comparison: {comparison['comparison']}")
        print(f"✓ Historical period: {comparison['historical_period']}")

        print("\n✅ Current vs historical comparison: PASSED")

    except Exception as e:
        print(f"\n❌ Current vs historical comparison: FAILED")
        print(f"Error: {e}")
        raise


async def test_extreme_events():
    """Test extreme events analysis."""
    print("\n" + "="*60)
    print("TEST 5: Extreme Events Analysis")
    print("="*60)

    try:
        # Bangalore coordinates
        lat, lng = 12.9716, 77.5946

        extreme_data = await climate_service.analyze_extreme_events(
            lat=lat,
            lng=lng,
            year=2025
        )

        print(f"✓ Location: {extreme_data['location']}")
        print(f"✓ Year: {extreme_data['year']}")

        temp_extremes = extreme_data.get("temperature_extremes", {})
        print(f"\n✓ Temperature Extremes:")
        print(f"    Hottest day: {temp_extremes['hottest_day_temp']}°C")
        print(f"    Coldest day: {temp_extremes['coldest_day_temp']}°C")
        print(f"    Extreme heat days: {temp_extremes['extreme_heat_days']}")
        print(f"    Cold days: {temp_extremes['cold_days']}")

        precip_extremes = extreme_data.get("precipitation_extremes", {})
        print(f"\n✓ Precipitation Extremes:")
        print(f"    Max daily rainfall: {precip_extremes['max_daily_rainfall']} mm")
        print(f"    Total annual: {precip_extremes['total_annual_rainfall']} mm")
        print(f"    Heavy rain days: {precip_extremes['heavy_rain_days']}")
        print(f"    Very heavy rain days: {precip_extremes['very_heavy_rain_days']}")

        print("\n✅ Extreme events analysis: PASSED")

    except Exception as e:
        print(f"\n❌ Extreme events analysis: FAILED")
        print(f"Error: {e}")
        raise


async def test_geocoding_integration():
    """Test integration with geocoding service."""
    print("\n" + "="*60)
    print("TEST 6: Geocoding Integration")
    print("="*60)

    try:
        # Test geocoding
        city = "Hyderabad"
        geocode_result = await geocoding_service.geocode(city)

        print(f"✓ City: {city}")
        print(f"✓ Coordinates: {geocode_result['lat']}, {geocode_result['lng']}")

        # Fetch historical data using geocoded coordinates
        historical_data = await climate_service.fetch_historical_weather(
            lat=geocode_result['lat'],
            lng=geocode_result['lng'],
            start_date="2025-06-01",
            end_date="2025-06-30",
            metrics=["temperature", "precipitation"]
        )

        daily = historical_data.get("daily_data", {})
        dates = daily.get("time", [])
        print(f"✓ Historical data fetched: {len(dates)} days")

        print("\n✅ Geocoding integration: PASSED")

    except Exception as e:
        print(f"\n❌ Geocoding integration: FAILED")
        print(f"Error: {e}")
        raise


async def run_all_tests():
    """Run all tests."""
    print("\n" + "="*60)
    print("CLIMATE ANALYSIS FEATURE TEST SUITE")
    print("="*60)
    print("Testing historical weather and climate trend analysis...")

    tests = [
        ("Historical Data", test_historical_data),
        ("Temperature Trend", test_temperature_trend),
        ("Monsoon Comparison", test_monsoon_comparison),
        ("Current vs Historical", test_current_vs_historical),
        ("Extreme Events", test_extreme_events),
        ("Geocoding Integration", test_geocoding_integration),
    ]

    passed = 0
    failed = 0

    for name, test_func in tests:
        try:
            await test_func()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"\n⚠️  Test '{name}' encountered an error")

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Total tests: {len(tests)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")

    if failed == 0:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
