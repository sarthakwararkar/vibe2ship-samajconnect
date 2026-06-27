const axios = require("axios");

/**
 * Fetch current AQI from WAQI (World Air Quality Index) API.
 */
async function fetchWaqiAqi(lat, lng) {
  try {
    const token = process.env.WAQI_TOKEN;
    if (!token || token.startsWith("mock-")) {
      throw new Error("Using mock WAQI token");
    }
    const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${token}`;
    const res = await axios.get(url);
    if (res.data.status !== "ok") throw new Error("WAQI API error");

    const data = res.data.data;
    return {
      aqi: data.aqi,
      dominantPollutant: data.dominantPol,
      pm25: data.iaqi?.pm25?.v || null,
      pm10: data.iaqi?.pm10?.v || null,
      o3: data.iaqi?.o3?.v || null,
      no2: data.iaqi?.no2?.v || null,
      stationName: data.city?.name,
      recordedAt: new Date(data.time?.iso || Date.now())
    };
  } catch (err) {
    console.log("ℹ️ [AQI Service] Falling back to mock AQI data for Latur");
    // Realistic fallback data for Latur, Maharashtra
    return {
      aqi: 84,
      dominantPollutant: "pm25",
      pm25: 28,
      pm10: 55,
      o3: 12,
      no2: 8,
      stationName: "Latur Shivaji Nagar, India",
      recordedAt: new Date()
    };
  }
}

/**
 * Fetch weather data from OpenWeatherMap API.
 */
async function fetchWeather(lat, lng) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey || apiKey.startsWith("mock-")) {
      throw new Error("Using mock OpenWeatherMap key");
    }
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    const res = await axios.get(url);
    return {
      temperature: Math.round(res.data.main.temp),
      feelsLike: Math.round(res.data.main.feels_like),
      humidity: res.data.main.humidity,
      windSpeed: res.data.wind.speed,
      description: res.data.weather[0].description,
      icon: res.data.weather[0].icon,
      cityName: res.data.name
    };
  } catch (err) {
    console.log("ℹ️ [Weather Service] Falling back to mock weather data for Latur");
    return {
      temperature: 32,
      feelsLike: 35,
      humidity: 58,
      windSpeed: 4.2,
      description: "partly cloudy",
      icon: "03d",
      cityName: "Latur"
    };
  }
}

/**
 * Get AQI alert level string based on AQI value.
 */
function getAlertLevel(aqi) {
  if (aqi <= 50)  return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very_unhealthy";
  return "hazardous";
}

/**
 * Simple AQI prediction based on time-of-day multiplier.
 * Evening hours (17:00–21:00) tend to have higher pollution.
 */
function predictAqi(currentAqi, hour) {
  const eveningMultiplier = (hour >= 17 && hour <= 21) ? 1.2 : 1.0;
  return Math.round(currentAqi * eveningMultiplier);
}

module.exports = { fetchWaqiAqi, fetchWeather, getAlertLevel, predictAqi };
