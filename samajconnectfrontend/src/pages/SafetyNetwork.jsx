import React, { useEffect, useState, useContext } from "react";
import { Shield, AlertTriangle, ShieldCheck, MapPin, Navigation, Eye, Bot, Loader } from "lucide-react";
import TrustedCircleCard from "../components/safety/TrustedCircleCard";
import JourneyTracker from "../components/safety/JourneyTracker";
import SosButton from "../components/safety/SosButton";
import RiskZoneMap from "../components/map/RiskZoneMap";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import Skeleton from "../components/ui/Skeleton";
import Modal from "../components/ui/Modal";
import api from "../services/api";
import toast from "react-hot-toast";
import { AppContext } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";

export default function SafetyNetwork() {
  const { profile } = useAuth();
  const { userLocation, detectedCity, exactAddress, activeDisasters = [], loadingDisasters = false, refreshDisasters } = useContext(AppContext);
  const [circle, setCircle] = useState([]);
  const [loadingCircle, setLoadingCircle] = useState(false);

  const [activeJourney, setActiveJourney] = useState(null);
  const [loadingJourney, setLoadingJourney] = useState(true);

  const [riskZones, setRiskZones] = useState([]);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Form states
  const [from, setFrom] = useState("Current Location");
  const [to, setTo] = useState("");
  const [toCoords, setToCoords] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [minutes, setMinutes] = useState("15");
  const [selectedCircleIds, setSelectedCircleIds] = useState([]);
  const [startingJourney, setStartingJourney] = useState(false);

  // Disaster form states
  const [disasterModalOpen, setDisasterModalOpen] = useState(false);
  const [disasterType, setDisasterType] = useState("fire");
  const [disasterAddress, setDisasterAddress] = useState("");
  const [disasterDesc, setDisasterDesc] = useState("");
  const [reportingDisaster, setReportingDisaster] = useState(false);

  // Route Analysis AI
  const [analyzingRoute, setAnalyzingRoute] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState(null);

  const CITY_LANDMARKS = {
    Latur: [
      { name: "Ganj Golai", lat: 18.4045, lng: 76.5638 },
      { name: "Latur Town Hall", lat: 18.4088, lng: 76.5604 },
      { name: "Latur Bus Stand", lat: 18.3995, lng: 76.5612 },
      { name: "Shahu College Ground", lat: 18.4124, lng: 76.5542 },
      { name: "MIDC Industrial Area", lat: 18.4350, lng: 76.5820 },
      { name: "Nana Nani Park", lat: 18.4012, lng: 76.5750 },
      { name: "Grand Hotel Latur", lat: 18.4055, lng: 76.5582 }
    ],
    Wani: [
      { name: "Wani Bus Stand", lat: 20.0610, lng: 78.9602 },
      { name: "Wani Municipal Council", lat: 20.0578, lng: 78.9641 },
      { name: "Janta Chowk", lat: 20.0545, lng: 78.9620 },
      { name: "Wani Fort & Lake", lat: 20.0680, lng: 78.9710 },
      { name: "Tagore Nagar Market", lat: 20.0490, lng: 78.9550 },
      { name: "Wani General Hospital", lat: 20.0520, lng: 78.9660 }
    ]
  };

  const getSuggestionsForCity = (city, userLoc) => {
    const baseList = CITY_LANDMARKS[city] || [];
    if (baseList.length > 0) return baseList;
    
    // Dynamic fallback suggestions using user coordinate offsets
    const lat = userLoc?.lat || 18.4088;
    const lng = userLoc?.lng || 76.5604;
    const cityName = city || "Latur";
    return [
      { name: `${cityName} Town Center`, lat: lat + 0.005, lng: lng + 0.005 },
      { name: `${cityName} Bus Depot`, lat: lat - 0.008, lng: lng - 0.003 },
      { name: `${cityName} Railway Station`, lat: lat + 0.012, lng: lng - 0.01 },
      { name: `${cityName} Community Ground`, lat: lat - 0.004, lng: lng + 0.007 },
      { name: `${cityName} Main Market Road`, lat: lat + 0.002, lng: lng - 0.001 }
    ];
  };

  const currentSuggestions = getSuggestionsForCity(detectedCity, userLocation).filter(item =>
    item.name.toLowerCase().includes(to.toLowerCase())
  );

  const handleToChange = (val) => {
    setTo(val);
    const suggestions = getSuggestionsForCity(detectedCity, userLocation);
    const matched = suggestions.find(s => s.name.toLowerCase() === val.toLowerCase());
    if (matched) {
      setToCoords({ lat: matched.lat, lng: matched.lng });
    } else {
      if (val.trim().length > 3 && userLocation) {
        let hash = 0;
        for (let i = 0; i < val.length; i++) {
          hash = val.charCodeAt(i) + ((hash << 5) - hash);
        }
        const offsetLat = ((hash % 100) / 5000);
        const offsetLng = (((hash >> 8) % 100) / 5000);
        setToCoords({
          lat: userLocation.lat + offsetLat,
          lng: userLocation.lng + offsetLng
        });
      } else {
        setToCoords(null);
      }
    }
  };

  useEffect(() => {
    if (exactAddress) {
      setFrom(exactAddress);
    } else if (detectedCity) {
      setFrom(`Current Location (${detectedCity})`);
    } else {
      setFrom("Current Location");
    }
  }, [exactAddress, detectedCity]);

  // SOS activation
  const [activeSosId, setActiveSosId] = useState(null);

  const fetchCircle = async () => {
    setLoadingCircle(true);
    try {
      const res = await api.get("/safety/circle");
      setCircle(res.data.circle || res.data || []);
      // Prefill selected circle IDs
      setSelectedCircleIds((res.data.circle || res.data || []).map(c => c.uid));
    } catch (err) {
      console.warn("Failed to fetch trusted circle:", err);
    } finally {
      setLoadingCircle(false);
    }
  };

  const fetchActiveJourney = async () => {
    setLoadingJourney(true);
    try {
      const res = await api.get("/safety/journey/active");
      // Backend may return { journey } or similar
      setActiveJourney(res.data.journey || null);
    } catch (err) {
      console.warn("Failed to fetch active journey:", err);
    } finally {
      setLoadingJourney(false);
    }
  };

  const fetchRiskZones = async () => {
    setLoadingRisk(true);
    try {
      const params = {};
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }
      const res = await api.get("/safety/risk-zones", { params });
      setRiskZones(res.data.riskZones || res.data || []);
    } catch (err) {
      console.warn("Failed to fetch risk zones:", err);
    } finally {
      setLoadingRisk(false);
    }
  };

  useEffect(() => {
    fetchCircle();
    fetchActiveJourney();
  }, []);

  useEffect(() => {
    fetchRiskZones();
  }, [userLocation]);

  useEffect(() => {
    if (disasterModalOpen && detectedCity && !disasterAddress) {
      setDisasterAddress(`${detectedCity}, Maharashtra`);
    }
  }, [disasterModalOpen, detectedCity]);

  const handleReportDisaster = async (e) => {
    e.preventDefault();
    if (!disasterAddress || !disasterDesc) {
      return toast.error("Please fill in all fields.");
    }
    if (!userLocation) {
      return toast.error("Could not determine your location. Please grant location access.");
    }

    setReportingDisaster(true);
    try {
      await api.post("/safety/disasters", {
        type: disasterType,
        description: disasterDesc,
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: disasterAddress,
        city: detectedCity
      });
      toast.success("Disaster alert broadcasted successfully!");
      setDisasterModalOpen(false);
      setDisasterDesc("");
      setDisasterAddress("");
      if (refreshDisasters) refreshDisasters();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to broadcast disaster alert.");
    } finally {
      setReportingDisaster(false);
    }
  };

  const handleResolveDisaster = async (disasterId) => {
    try {
      await api.patch(`/safety/disasters/${disasterId}/resolve`);
      toast.success("Disaster alert resolved.");
      if (refreshDisasters) refreshDisasters();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to resolve disaster alert.");
    }
  };

  const handleStartJourney = async (e) => {
    e.preventDefault();
    if (!to) return toast.error("Please enter a destination");
    
    setStartingJourney(true);
    try {
      const payload = {
        fromAddress: from,
        toAddress: to,
        fromLat: userLocation?.lat || 18.4088,
        fromLng: userLocation?.lng || 76.5604,
        toLat: toCoords?.lat || null,
        toLng: toCoords?.lng || null,
        expectedArrivalMinutes: parseInt(minutes),
        notifyContacts: selectedCircleIds
      };

      const res = await api.post("/safety/journey/start", payload);
      toast.success("Journey started! Tracking is active 🚀");
      // Fallback if backend returned journey directly or nested
      setActiveJourney(res.data.journey || res.data || { fromAddress: from, toAddress: to, expectedArrival: new Date(Date.now() + parseInt(minutes)*60000).toISOString() });
      setRouteAnalysis(null); // Clear analysis
      setTo("");
      setToCoords(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start journey");
    } finally {
      setStartingJourney(false);
    }
  };

  const handleAnalyzeRoute = async () => {
    if (!to) return toast.error("Please enter a destination to analyze");

    setAnalyzingRoute(true);
    setRouteAnalysis(null);
    try {
      const payload = {
        fromAddress: from,
        toAddress: to,
        fromLat: userLocation?.lat || 18.4088,
        fromLng: userLocation?.lng || 76.5604,
        toLat: toCoords?.lat || null,
        toLng: toCoords?.lng || null
      };
      const res = await api.post("/safety/route-analysis", payload);
      setRouteAnalysis(res.data.analysis || res.data);
      toast.success("AI safety analysis complete");
    } catch (err) {
      toast.error(err.response?.data?.error || "Route analysis failed");
    } finally {
      setAnalyzingRoute(false);
    }
  };

  const handleSosActivate = async () => {
    try {
      const res = await api.post("/safety/sos");
      setActiveSosId(res.data.sosId || res.data.id || "current-sos");
      toast.error("EMERGENCY SOS ACTIVATED! Circle members notified.");
    } catch (err) {
      toast.error("Failed to activate SOS");
    }
  };

  const handleSosReset = async () => {
    if (!activeSosId) return;
    try {
      await api.patch(`/safety/sos/${activeSosId}/resolve`);
      setActiveSosId(null);
      toast.success("SOS deactivated. Status restored.");
    } catch (err) {
      toast.error("Failed to resolve SOS");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 items-start">
      
      {/* Left Column: Trusted Circle */}
      <div className="w-full lg:w-[300px] flex-shrink-0">
        <TrustedCircleCard 
          circle={circle} 
          onUpdate={fetchCircle} 
          loading={loadingCircle} 
        />
      </div>

      {/* Center Column: Journey forms and SOS buttons */}
      <div className="space-y-6">
        
        {/* Journey tracker panel */}
        {loadingJourney ? (
          <Skeleton height="180px" />
        ) : activeJourney ? (
          <JourneyTracker journey={activeJourney} onComplete={fetchActiveJourney} />
        ) : (
          /* Start Journey Form */
          <GlassCard className="p-6 bg-white/60 border-white/40 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold font-display text-primary">Start a Protected Journey</h3>
              <p className="text-xs text-muted">Shares live arrival countdowns and geo-tags with your circle.</p>
            </div>

            <form onSubmit={handleStartJourney} className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  label="Starting Location"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  required
                  disabled={startingJourney}
                />
                <div className="relative">
                  <Input
                    type="text"
                    label="Destination"
                    placeholder="e.g. Latur Town Hall"
                    value={to}
                    onChange={(e) => handleToChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    required
                    disabled={startingJourney}
                    autoComplete="off"
                  />
                  {showSuggestions && currentSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white/95 backdrop-blur border border-white/40 shadow-xl rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100 animate-slide-in">
                      {currentSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTo(s.name);
                            setToCoords({ lat: s.lat, lng: s.lng });
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-indigo-50/50 flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <MapPin size={12} className="text-indigo-500 flex-shrink-0" />
                          <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-primary">{s.name}</span>
                            <span className="text-[9px] text-muted">Landmark in {detectedCity}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Expected transit duration (min)"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  required
                  disabled={startingJourney}
                />

                {/* Circle Notify selection */}
                <div className="flex flex-col justify-end pb-1 text-xs text-primary font-semibold space-y-1.5">
                  <span className="text-[10px] font-bold text-muted uppercase block">Select Circle contacts</span>
                  {circle.map(c => (
                    <label key={c.uid} className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedCircleIds.includes(c.uid)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCircleIds([...selectedCircleIds, c.uid]);
                          } else {
                            setSelectedCircleIds(selectedCircleIds.filter(id => id !== c.uid));
                          }
                        }}
                        className="rounded text-indigo-600 border-white/60 focus:ring-indigo-500" 
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleAnalyzeRoute}
                  disabled={analyzingRoute || startingJourney}
                  variant="ghost"
                  className="flex-1 bg-white/40 border-white/60 hover:bg-white/80 text-primary flex items-center justify-center gap-1"
                >
                  {analyzingRoute ? <Loader size={14} className="animate-spin" /> : <Bot size={14} />} 
                  Analyze Route Safety
                </Button>
                <Button
                  type="submit"
                  loading={startingJourney}
                  variant="primary"
                  className="flex-grow text-white"
                >
                  Start Journey 🚀
                </Button>
              </div>
            </form>

            {/* AI Safety Analysis display */}
            {routeAnalysis && (
              <GlassCard className="p-4 border-l-4 border-l-indigo-500 bg-indigo-50/50 border-white/30 space-y-2 text-xs animate-fade-in text-left">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <Bot size={16} />
                  <span>AI Route Safety Analysis</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-indigo-950 block">
                    Overall Risk Level: <span className={`uppercase font-data ${
                      (routeAnalysis.overallRisk || "").toLowerCase() === "high" ? "text-red-600 animate-pulse font-bold" : 
                      (routeAnalysis.overallRisk || "").toLowerCase() === "medium" ? "text-amber-600 font-bold" : "text-emerald-600"
                    }`}>{routeAnalysis.overallRisk || "low"}</span>
                  </span>
                  <p className="text-indigo-800 leading-relaxed font-medium">
                    {routeAnalysis.riskAssessment || routeAnalysis.assessment || routeAnalysis.advice || "No specific safety risks identified. Safe travels!"}
                  </p>
                </div>
                
                {((routeAnalysis.precautions && routeAnalysis.precautions.length > 0) || 
                  (routeAnalysis.riskFactors && routeAnalysis.riskFactors.length > 0)) && (
                  <div className="space-y-1 mt-2">
                    <span className="font-bold text-indigo-950 block">AI Safety Points & Precautions:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-indigo-700">
                      {(routeAnalysis.precautions || routeAnalysis.riskFactors).map((tip, idx) => (
                        <li key={idx} className="leading-tight">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {routeAnalysis.alternateRouteSuggestion && (
                  <div className="mt-2 p-2 bg-white/50 rounded-lg border border-indigo-100/50 text-[10px] text-indigo-950">
                    <span className="font-bold text-indigo-950 block">💡 Alternate Suggestion:</span>
                    <p className="mt-0.5 font-medium leading-relaxed">{routeAnalysis.alternateRouteSuggestion}</p>
                  </div>
                )}
              </GlassCard>
            )}
          </GlassCard>
        )}

        {/* SOS Panel */}
        <GlassCard className="glass-elevated p-6 border border-red-200/50 shadow-md bg-red-50/20 text-center relative overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-bold text-red-600 uppercase font-data tracking-wider">
            <AlertTriangle size={12} className="animate-pulse" /> Live Dispatch
          </div>

          <h3 className="text-base font-bold font-display text-red-900 leading-tight">Emergency SOS</h3>
          <p className="text-xs text-red-700 max-w-sm mx-auto mt-1.5">
            Activating SOS immediately issues alerts to your trusted circle, nearby experts, and police patrols.
          </p>

          <SosButton 
            onActivate={handleSosActivate} 
            onReset={handleSosReset}
            isActivated={!!activeSosId} 
          />

          <Button
            onClick={() => setDisasterModalOpen(true)}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 border-none shadow-md shadow-red-600/10 cursor-pointer"
          >
            <AlertTriangle size={14} className="animate-bounce" /> Report Community Disaster
          </Button>
        </GlassCard>
      </div>

      {/* Right Column: Risk Zones Map */}
      <div className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Risk circles near you</h4>
        
        <div className="h-64">
          <RiskZoneMap 
            riskZones={riskZones} 
            disasters={activeDisasters} 
            center={userLocation ? [userLocation.lat, userLocation.lng] : undefined} 
            toCoords={toCoords}
          />
        </div>

        {/* Active Disasters Section */}
        <div className="space-y-2.5 mt-4">
          <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider px-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block"></span>
            Active Disaster Alerts ({activeDisasters.length})
          </h4>
          {loadingDisasters ? (
            <Skeleton height="80px" />
          ) : activeDisasters.length === 0 ? (
            <div className="p-3 bg-white/40 border border-white/20 rounded-xl text-xs text-muted text-center">
              No active disaster alerts nearby.
            </div>
          ) : (
            activeDisasters.map((d) => (
              <div key={d.id} className="p-3 border-l-4 border-l-red-600 bg-red-50/20 border border-red-200/30 rounded-xl text-xs space-y-1.5 relative overflow-hidden">
                <div className="flex justify-between items-start font-bold text-red-950">
                  <span>🚨 {d.type.toUpperCase().replace("_", " ")}</span>
                  <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-data">
                    {d.distance}m away
                  </span>
                </div>
                <p className="text-red-900 font-medium">{d.description}</p>
                <div className="text-[10px] text-muted flex justify-between items-center mt-1">
                  <span>📍 {d.address}</span>
                </div>
                
                {/* Resolve button for authorities/experts */}
                {(profile?.isAuthority || profile?.isExpert || profile?.tier === "Platinum") && (
                  <Button
                    onClick={() => handleResolveDisaster(d.id)}
                    size="xs"
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 border-none shadow-sm shadow-emerald-600/10 cursor-pointer"
                  >
                    Mark as Resolved & Safe
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Risk Zones Lists */}
        <div className="space-y-2.5">
          {loadingRisk ? (
            <Skeleton height="80px" />
          ) : riskZones.length === 0 ? (
            <span className="text-xs text-muted">No safety risk zones near {detectedCity || "Latur"}.</span>
          ) : (
            riskZones.slice(0, 3).map((zone) => (
              <div key={zone.id} className="p-3 border-l-4 border-l-red-400 bg-white/40 border-white/20 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-start font-bold text-primary">
                  <span>{zone.name}</span>
                  <span className="text-red-600 font-data">{zone.incidentCount || 2} events</span>
                </div>
                <span className="text-[10px] text-muted block">Caution: {zone.cautionHours || "8 PM - 12 PM"}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Disaster Report Modal */}
      {disasterModalOpen && (
        <Modal 
          isOpen={disasterModalOpen} 
          onClose={() => setDisasterModalOpen(false)}
          title="🚨 Report Community Disaster Alert"
        >
          <form onSubmit={handleReportDisaster} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase">Disaster Type</label>
              <Select 
                value={disasterType} 
                onChange={(e) => setDisasterType(e.target.value)}
                className="w-full glass-input text-xs"
              >
                <option value="fire">🔥 Fire Outbreak</option>
                <option value="flood">🌊 Flood / Water Logging</option>
                <option value="earthquake">🌋 Earthquake / Tremors</option>
                <option value="gas_leak">💨 Gas / Chemical Leak</option>
                <option value="storm">⛈️ Severe Storm / Hurricane</option>
                <option value="other">🚨 Other Hazard</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase">Location / Address</label>
              <Input 
                type="text" 
                value={disasterAddress}
                onChange={(e) => setDisasterAddress(e.target.value)}
                placeholder="e.g. Shivaji Chowk Metro Area"
                className="w-full glass-input text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase">Description & Safety Warning</label>
              <textarea 
                value={disasterDesc}
                onChange={(e) => setDisasterDesc(e.target.value)}
                placeholder="Brief description of the disaster and urgent safety advice for neighbors."
                className="w-full glass-input text-xs rounded-xl p-3 border-white/20 focus:outline-none focus:border-indigo-400 bg-white/5"
                rows="3"
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setDisasterModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={reportingDisaster}
                className="bg-red-600 hover:bg-red-700 text-white border-none shadow-md shadow-red-600/10 cursor-pointer"
              >
                {reportingDisaster ? "Broadcasting Alert..." : "Broadcast Alert 📢"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
