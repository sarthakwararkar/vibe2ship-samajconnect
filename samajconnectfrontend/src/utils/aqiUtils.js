export function getPollutantLabel(pollutant) {
  switch (pollutant?.toLowerCase()) {
    case "pm25": return "PM2.5";
    case "pm10": return "PM10";
    case "o3": return "O3";
    case "no2": return "NO2";
    case "so2": return "SO2";
    case "co": return "CO";
    default: return pollutant || "PM2.5";
  }
}

export function getAqiPercentage(aqi) {
  // Map 0 to 500 AQI to a 0% to 100% value
  const numericAqi = Number(aqi || 0);
  return Math.min(100, Math.max(0, (numericAqi / 500) * 100));
}

export function getAqiHealthTips(aqi) {
  if (aqi <= 50) {
    return [
      "Perfect day for outdoor exercise and activities.",
      "Keep windows open to ventilate indoor spaces.",
      "No special health precautions needed."
    ];
  }
  if (aqi <= 100) {
    return [
      "Extremely sensitive people should limit prolonged outdoor exertion.",
      "Ventilation is generally safe, but monitor updates.",
      "Observe for symptoms like cough or throat irritation."
    ];
  }
  if (aqi <= 150) {
    return [
      "Sensitive groups (children, elderly, asthmatics) should reduce outdoor time.",
      "Consider closing windows if you feel discomfort.",
      "Keep inhalers and quick-relief medication handy."
    ];
  }
  if (aqi <= 200) {
    return [
      "Everyone should reduce heavy outdoor exertion.",
      "Wear N95/N99 respirators when going outdoors.",
      "Close windows to avoid letting polluted air inside."
    ];
  }
  if (aqi <= 300) {
    // Very Unhealthy
    return [
      "Avoid all outdoor activities. Stay indoors.",
      "Run air purifiers if available in sealed rooms.",
      "Close all windows and doors completely."
    ];
  }
  // Hazardous
  return [
    "HEALTH WARNING: Serious risk of respiratory injury.",
    "Remain indoors, in air-filtered environments.",
    "Strictly avoid any physical activity or exposure."
  ];
}
