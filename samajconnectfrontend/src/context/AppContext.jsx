import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import api from "../services/api";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [aqiData, setAqiData] = useState(null);
  const [loadingAqi, setLoadingAqi] = useState(true);
  
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [detectedCity, setDetectedCity] = useState("Latur");
  const [exactAddress, setExactAddress] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  const [activeDisasters, setActiveDisasters] = useState([]);
  const [loadingDisasters, setLoadingDisasters] = useState(false);
  const knownNotificationIds = useRef(new Set());

  const fetchAqi = async (coords = null) => {
    setLoadingAqi(true);
    try {
      const activeCoords = coords || userLocation;
      const params = {};
      if (activeCoords) {
        params.lat = activeCoords.lat;
        params.lng = activeCoords.lng;
      }
      const res = await api.get("/aqi/current", { params });
      setAqiData(res.data);
      if (res.data.city) {
        setDetectedCity(res.data.city);
      }
    } catch (err) {
      console.warn("Failed to fetch live AQI:", err);
      // Fallback Latur AQI data
      setAqiData({
        aqi: 72,
        city: "Latur",
        pollutant: "PM2.5",
        pm25: 22,
        pm10: 45,
        temp: 28,
        humidity: 62,
        wind: 12,
        timestamp: new Date().toISOString(),
        alertZones: [],
        forecast: [
          { day: "Today", aqi: 75 },
          { day: "Tomorrow", aqi: 82 },
          { day: "Day after", aqi: 68 }
        ]
      });
    } finally {
      setLoadingAqi(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const res = await api.get("/auth/notifications");
      const rawList = res.data.notifications || res.data || [];
      const list = rawList.map(n => ({
        ...n,
        read: n.isRead !== undefined ? n.isRead : n.read
      }));

      // Check for brand new unread disaster alerts to fire native push notifications
      if (knownNotificationIds.current.size > 0) {
        list.forEach(n => {
          if (!n.read && n.type === "disaster_alert" && !knownNotificationIds.current.has(n.id)) {
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification(n.title, {
                body: n.body,
                tag: n.id,
                requireInteraction: true
              });
            }
          }
        });
      }

      // Add all to known set
      list.forEach(n => knownNotificationIds.current.add(n.id));

      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchActiveDisasters = async (coords = null) => {
    const activeCoords = coords || userLocation;
    if (!activeCoords) return;
    setLoadingDisasters(true);
    try {
      const res = await api.get("/safety/disasters/active", {
        params: {
          lat: activeCoords.lat,
          lng: activeCoords.lng,
          radius: 5000 // 5km
        }
      });
      setActiveDisasters(res.data.disasters || []);
    } catch (err) {
      console.warn("Failed to fetch active disasters:", err);
    } finally {
      setLoadingDisasters(false);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    try {
      await api.patch("/auth/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("Failed to mark notifications as read:", err);
    }
  };

  const triggerGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          fetchAqi(coords);
          fetchActiveDisasters(coords);
          
          // Reverse geocode coordinate to exact address/place
          try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&accept-language=en`;
            const res = await fetch(url, {
              headers: {
                "User-Agent": "SamajConnectCivicApp/1.0 (contact: support@samajconnect.org)"
              }
            });
            const data = await res.json();
            if (data) {
              const addr = data.address || {};
              const parts = [];
              const place = addr.amenity || addr.building || addr.shop || addr.tourism || addr.historic;
              if (place) parts.push(place);
              if (addr.road) parts.push(addr.road);
              if (addr.suburb || addr.neighbourhood || addr.village_district) parts.push(addr.suburb || addr.neighbourhood || addr.village_district);
              if (addr.town || addr.city || addr.village) parts.push(addr.town || addr.city || addr.village);
              
              const formatted = parts.length > 0 ? parts.join(", ") : data.display_name;
              setExactAddress(formatted);

              const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb;
              if (city) {
                setDetectedCity(city);
                // Also update fallback aqiData city name if it was set to default Latur
                setAqiData(prev => {
                  if (prev && prev.city === "Latur") {
                    return { ...prev, city: city };
                  }
                  return prev;
                });
              }
            }
          } catch (e) {
            console.warn("Failed to reverse geocode exact address:", e);
          }
          
          toast.success("Location retrieved successfully!");
        },
        (error) => {
          console.warn("Geolocation query failed or denied, using default Latur:", error);
          let errorMsg = "Could not fetch current location automatically.";
          if (error.code === 1) {
            errorMsg = "Location permission denied. Please allow location access in your browser settings to run locally.";
          }
          toast.error(errorMsg);
          
          const defaultCoords = { lat: 18.4088, lng: 76.5604 };
          setUserLocation(defaultCoords);
          fetchAqi(defaultCoords);
          fetchActiveDisasters(defaultCoords);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
      const defaultCoords = { lat: 18.4088, lng: 76.5604 };
      setUserLocation(defaultCoords);
      fetchAqi(defaultCoords);
      fetchActiveDisasters(defaultCoords);
    }
  };

  useEffect(() => {
    triggerGeolocation();
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchActiveDisasters();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchActiveDisasters();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setActiveDisasters([]);
    }
  }, [user, userLocation]);

  const value = {
    aqiData,
    loadingAqi,
    refreshAqi: fetchAqi,
    userLocation,
    detectedCity,
    exactAddress,
    requestUserLocation: triggerGeolocation,
    
    notifications,
    unreadCount,
    loadingNotifications,
    notificationDrawerOpen,
    setNotificationDrawerOpen,
    refreshNotifications: fetchNotifications,
    markAllNotificationsRead,

    activeDisasters,
    loadingDisasters,
    refreshDisasters: fetchActiveDisasters
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
