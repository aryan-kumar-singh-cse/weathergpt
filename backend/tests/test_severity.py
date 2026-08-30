"""
Severity Classification Tests
Tests weather severity thresholds and alert generation
Validates classification logic with known input values
"""

import pytest
from backend.services.weather_service import weather_service


class TestSeverityClassification:
    """
    Test suite for weather severity classification.
    Tests threshold boundaries and multi-condition scenarios.
    """

    def test_normal_conditions(self, mock_weather_data):
        """
        Test that normal weather conditions result in 'normal' severity.
        Temperature: 27°C, Wind: 15 km/h, No heavy rain.
        """
        weather = mock_weather_data(temperature=27, wind_speed=15, humidity=65)
        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "normal"
        assert severity["alert_count"] == 0
        assert len(severity["alerts"]) == 0

    def test_extreme_heat_threshold(self, mock_weather_data):
        """
        Test extreme heat classification (≥ 45°C).
        Threshold boundary: 45°C exactly should trigger extreme.
        """
        weather = mock_weather_data(temperature=45, wind_speed=15)
        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "extreme"
        assert any("Extreme heat" in alert for alert in severity["alerts"])
        assert any("45" in alert for alert in severity["alerts"])

    def test_extreme_heat_above_threshold(self, mock_weather_data):
        """
        Test extreme heat well above threshold (50°C).
        """
        weather = mock_weather_data(temperature=50, wind_speed=15)
        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "extreme"
        assert any("Extreme heat" in alert for alert in severity["alerts"])

    def test_high_heat_warning(self, mock_weather_data):
        """
        Test high heat classification (≥ 40°C, < 45°C).
        """
        weather = mock_weather_data(temperature=40, wind_speed=15)
        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "warning"
        assert any("High heat" in alert for alert in severity["alerts"])

    def test_frost_warning(self, mock_weather_data):
        """
        Test frost/freeze warning (≤ 0°C).
        Threshold boundary: 0°C exactly should trigger warning.
        """
        weather = mock_weather_data(temperature=0, wind_speed=15)
        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "warning"
        assert any("Frost" in alert or "freeze" in alert for alert in severity["alerts"])

    def test_below_freezing(self, mock_weather_data):
        """
        Test below freezing temperature (-5°C).
        """
        weather = mock_weather_data(temperature=-5, wind_speed=15)
        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "warning"
        assert any("Frost" in alert or "freeze" in alert for alert in severity["alerts"])

    def test_high_wind_warning(self, mock_weather_data):
        """
        Test high wind warning (≥ 62 km/h).
        Threshold boundary: 62 km/h exactly should trigger severe.
        """
        weather = mock_weather_data(temperature=27, wind_speed=62)
        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "severe"
        assert any("High wind warning" in alert for alert in severity["alerts"])
        assert any("62" in alert for alert in severity["alerts"])

    def test_strong_winds(self, mock_weather_data):
        """
        Test strong winds classification (≥ 40 km/h, < 62 km/h).
        """
        weather = mock_weather_data(temperature=27, wind_speed=40)
        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "warning"
        assert any("Strong winds" in alert for alert in severity["alerts"])

    def test_heavy_rain_warning(self, mock_weather_data):
        """
        Test heavy rain warning (≥ 80% probability AND ≥ 100mm).
        Both conditions must be met for severe classification.
        """
        weather = mock_weather_data(temperature=27, wind_speed=15)

        # Modify forecast to include heavy rain
        weather["forecast"]["days"][0]["precipitation_probability"] = 80
        weather["forecast"]["days"][0]["precipitation_sum"] = 100

        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "severe"
        assert any("Heavy rain warning" in alert for alert in severity["alerts"])
        assert any("80%" in alert and "100mm" in alert for alert in severity["alerts"])

    def test_moderate_rain_expected(self, mock_weather_data):
        """
        Test moderate rain classification (≥ 70% probability AND ≥ 50mm).
        """
        weather = mock_weather_data(temperature=27, wind_speed=15)

        weather["forecast"]["days"][0]["precipitation_probability"] = 70
        weather["forecast"]["days"][0]["precipitation_sum"] = 50

        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "warning"
        assert any("Moderate rain" in alert for alert in severity["alerts"])

    def test_high_rain_probability_low_amount_no_alert(self, mock_weather_data):
        """
        Test that high probability alone (without high accumulation) doesn't trigger alert.
        80% probability but only 20mm should not create heavy rain alert.
        """
        weather = mock_weather_data(temperature=27, wind_speed=15)

        weather["forecast"]["days"][0]["precipitation_probability"] = 80
        weather["forecast"]["days"][0]["precipitation_sum"] = 20

        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "normal"
        assert not any("Heavy rain" in alert for alert in severity["alerts"])

    def test_low_rain_probability_high_amount_no_alert(self, mock_weather_data):
        """
        Test that high accumulation alone (without high probability) doesn't trigger alert.
        30% probability with 100mm should not create heavy rain alert.
        """
        weather = mock_weather_data(temperature=27, wind_speed=15)

        weather["forecast"]["days"][0]["precipitation_probability"] = 30
        weather["forecast"]["days"][0]["precipitation_sum"] = 100

        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "normal"
        assert not any("Heavy rain" in alert for alert in severity["alerts"])

    def test_multiple_conditions_max_severity(self, mock_weather_data):
        """
        Test that multiple conditions result in highest severity level.
        Extreme heat + High winds should result in 'extreme' severity.
        """
        weather = mock_weather_data(temperature=45, wind_speed=62)
        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "extreme"
        assert severity["alert_count"] >= 2
        assert any("Extreme heat" in alert for alert in severity["alerts"])
        assert any("High wind" in alert for alert in severity["alerts"])

    def test_all_hazards_combined(self, mock_weather_data):
        """
        Test worst-case scenario with all hazards present.
        Extreme heat + High winds + Heavy rain.
        """
        weather = mock_weather_data(temperature=45, wind_speed=62)

        weather["forecast"]["days"][0]["precipitation_probability"] = 80
        weather["forecast"]["days"][0]["precipitation_sum"] = 100

        severity = weather_service.classify_severity(weather)

        assert severity["severity"] == "extreme"
        assert severity["alert_count"] >= 3
        assert any("heat" in alert.lower() for alert in severity["alerts"])
        assert any("wind" in alert.lower() for alert in severity["alerts"])
        assert any("rain" in alert.lower() for alert in severity["alerts"])

    def test_edge_case_just_below_threshold(self, mock_weather_data):
        """
        Test values just below thresholds should NOT trigger alerts.
        """
        # Temperature 44°C (just below 45°C extreme threshold)
        weather = mock_weather_data(temperature=44, wind_speed=15)
        severity = weather_service.classify_severity(weather)
        assert severity["severity"] == "warning"  # Should still be high heat warning
        assert not any("Extreme heat" in alert for alert in severity["alerts"])

        # Wind 61 km/h (just below 62 km/h threshold)
        weather = mock_weather_data(temperature=27, wind_speed=61)
        severity = weather_service.classify_severity(weather)
        assert not any("High wind warning" in alert for alert in severity["alerts"])

    def test_forecast_beyond_3_days_not_checked(self, mock_weather_data):
        """
        Test that only first 3 days of forecast are checked for rain alerts.
        Heavy rain on day 5 should not trigger alert.
        """
        weather = mock_weather_data(temperature=27, wind_speed=15, forecast_days=7)

        # Heavy rain on day 5 (index 4)
        weather["forecast"]["days"][4]["precipitation_probability"] = 80
        weather["forecast"]["days"][4]["precipitation_sum"] = 100

        severity = weather_service.classify_severity(weather)

        # Should be normal since we only check first 3 days
        assert severity["severity"] == "normal"
        assert not any("Heavy rain" in alert for alert in severity["alerts"])

    @pytest.mark.parametrize("temperature,wind_speed,rain_prob,rain_mm,expected_severity", [
        (27, 15, 20, 5, "normal"),
        (40, 15, 20, 5, "warning"),
        (45, 15, 20, 5, "extreme"),
        (27, 40, 20, 5, "warning"),
        (27, 62, 20, 5, "severe"),
        (0, 15, 20, 5, "warning"),
        (-5, 15, 20, 5, "warning"),
    ])
    def test_severity_thresholds_parameterized(self, mock_weather_data, temperature, wind_speed, rain_prob, rain_mm, expected_severity):
        """
        Parameterized test for various severity threshold combinations.
        Tests multiple scenarios efficiently.
        """
        weather = mock_weather_data(temperature=temperature, wind_speed=wind_speed)

        if rain_prob >= 70:
            weather["forecast"]["days"][0]["precipitation_probability"] = rain_prob
            weather["forecast"]["days"][0]["precipitation_sum"] = rain_mm

        severity = weather_service.classify_severity(weather)
        assert severity["severity"] == expected_severity


class TestWeatherCodeDescriptions:
    """Test weather code to description mapping."""

    def test_common_weather_codes(self):
        """Test that common WMO weather codes map to descriptions."""
        assert weather_service.get_weather_description(0) == "Clear sky"
        assert weather_service.get_weather_description(1) == "Mainly clear"
        assert weather_service.get_weather_description(3) == "Overcast"
        assert weather_service.get_weather_description(61) == "Slight rain"
        assert weather_service.get_weather_description(65) == "Heavy rain"
        assert weather_service.get_weather_description(95) == "Thunderstorm"

    def test_unknown_weather_code(self):
        """Test that unknown weather code returns default description."""
        assert weather_service.get_weather_description(999) == "Unknown conditions"
        assert weather_service.get_weather_description(-1) == "Unknown conditions"
