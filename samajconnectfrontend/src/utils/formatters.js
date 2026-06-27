export function getAqiColor(aqi) {
  if (aqi <= 50) return "#10B981"; // Good
  if (aqi <= 100) return "#EAB308"; // Moderate
  if (aqi <= 150) return "#F59E0B"; // Unhealthy for Sensitive
  if (aqi <= 200) return "#EF4444"; // Unhealthy
  if (aqi <= 300) return "#9333EA"; // Very Unhealthy
  return "#7F1D1D"; // Hazardous
}

export function getAqiLabel(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export function getAqiTextColor(aqi) {
  if (aqi <= 50) return "text-emerald-600";
  if (aqi <= 100) return "text-yellow-600";
  if (aqi <= 150) return "text-orange-600";
  if (aqi <= 200) return "text-red-600";
  if (aqi <= 300) return "text-purple-600";
  return "text-red-950 font-bold";
}

export function getTierColor(tier) {
  switch (tier) {
    case "Bronze":   return "#CD7F32";
    case "Silver":   return "#94A3B8"; // lighter slate grey
    case "Gold":     return "#D97706"; // amber-dark gold
    case "Platinum": return "#818CF8"; // indigo purple glow
    default:         return "#CD7F32";
  }
}

export function getTierNext(tier) {
  switch (tier) {
    case "Bronze":   return "Silver";
    case "Silver":   return "Gold";
    case "Gold":     return "Platinum";
    case "Platinum": return null;
    default:         return "Silver";
  }
}

export function getTierRange(tier) {
  switch (tier) {
    case "Bronze":   return { min: 0, max: 100 };
    case "Silver":   return { min: 100, max: 500 };
    case "Gold":     return { min: 500, max: 2000 };
    case "Platinum": return { min: 2000, max: 10000 };
    default:         return { min: 0, max: 100 };
  }
}

export function formatDistance(meters) {
  if (!meters && meters !== 0) return "Unknown";
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function timeAgo(timestamp) {
  if (!timestamp) return "just now";
  
  let date;
  if (timestamp?.seconds) {
    // Firestore Timestamp object
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return "recently";

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatPrice(amount) {
  if (amount === 0 || amount === "0" || !amount) return "Free";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function formatScore(score) {
  return `${Number(score || 0).toLocaleString("en-IN")} pts`;
}

export function getCategoryEmoji(cat) {
  switch (cat?.toLowerCase()) {
    case "pothole":      return "🕳️";
    case "water_leak":   return "💧";
    case "streetlight":  return "💡";
    case "waste":        return "🗑️";
    case "road_damage":  return "🛣️";
    default:             return "❓";
  }
}

export function getSeverityOrder(sev) {
  switch (sev?.toLowerCase()) {
    case "critical": return 3;
    case "high":     return 2;
    case "medium":   return 1;
    case "low":      return 0;
    default:         return 0;
  }
}
