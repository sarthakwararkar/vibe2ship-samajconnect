import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, MapPin, AlertCircle, Bot } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import Button from "../components/ui/Button";
import { Textarea, Input } from "../components/ui/Input";
import GlassCard from "../components/ui/GlassCard";
import Modal from "../components/ui/Modal";
import { classifyIssueImage } from "../../src/services/gemini";
import api from "../../src/services/api";
import toast from "react-hot-toast";
import { AppContext } from "../context/AppContext";

const CATEGORY_CHIPS = [
  { value: "pothole", emoji: "🕳️", label: "Pothole" },
  { value: "water_leak", emoji: "💧", label: "Water Leak" },
  { value: "streetlight", emoji: "💡", label: "Streetlight" },
  { value: "waste", emoji: "🗑️", label: "Waste Overflow" },
  { value: "road_damage", emoji: "🛣️", label: "Road Damage" },
  { value: "other", emoji: "❓", label: "Other" }
];

const SEVERITY_CHIPS = [
  { value: "low", label: "🟢 Low" },
  { value: "medium", label: "🟡 Medium" },
  { value: "high", label: "🔴 High" },
  { value: "critical", label: "🚨 Critical" }
];

export default function ReportIssue() {
  const navigate = useNavigate();
  const { userLocation, detectedCity } = useContext(AppContext);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [severity, setSeverity] = useState("medium");
  const [isManuallySet, setIsManuallySet] = useState(false);
  
  // Photo states
  const [imagePreview, setImagePreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  
  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDetected, setAiDetected] = useState(null);

  // Location states
  const [address, setAddress] = useState("📍 Loading location...");
  const [lat, setLat] = useState(18.4088);
  const [lng, setLng] = useState(76.5604);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  // Sync with geolocation
  React.useEffect(() => {
    if (userLocation) {
      setLat(userLocation.lat);
      setLng(userLocation.lng);
      setAddress(`📍 Auto-detected Location (${detectedCity || "Latur"})`);
    } else {
      setAddress("📍 Shivaji Chowk, near SBI Bank, Latur");
    }
  }, [userLocation, detectedCity]);

  const handleDescriptionChange = (val) => {
    setDescription(val.slice(0, 500));
    if (isManuallySet) return;
    
    // Simple local classification based on description
    const desc = val.toLowerCase();
    let detectedCat = null;
    let detectedSev = null;
    
    if (desc.includes("pothole") || desc.includes("hole") || desc.includes("pit")) {
      detectedCat = "pothole";
      detectedSev = "high";
    } else if (desc.includes("water") || desc.includes("leak") || desc.includes("pipe") || desc.includes("burst")) {
      detectedCat = "water_leak";
      detectedSev = "high";
    } else if (desc.includes("light") || desc.includes("street") || desc.includes("dark") || desc.includes("lamp")) {
      detectedCat = "streetlight";
      detectedSev = "medium";
    } else if (desc.includes("garbage") || desc.includes("waste") || desc.includes("trash") || desc.includes("bin") || desc.includes("overflow")) {
      detectedCat = "waste";
      detectedSev = "medium";
    } else if (desc.includes("damage") || desc.includes("road") || desc.includes("crack") || desc.includes("asphalt")) {
      detectedCat = "road_damage";
      detectedSev = "high";
    }
    
    if (detectedCat) {
      setCategory(detectedCat);
      setSeverity(detectedSev);
      setAiDetected({
        category: detectedCat,
        severity: detectedSev,
        reason: `Auto-detected from description text: "${val.slice(0, 30)}..."`,
        confidence: 0.8
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    setImagePreview(URL.createObjectURL(file));

    // Convert to base64 for Gemini API
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setPhotoBase64(base64);

      setAiLoading(true);
      try {
        const result = await classifyIssueImage(base64, description, file.name);
        setAiDetected(result);
        if (result.category) setCategory(result.category);
        if (result.severity) setSeverity(result.severity);
        toast.success(`AI detected: ${result.category.replace("_", " ")}`);
      } catch (err) {
        console.warn("AI Classification failed:", err);
      } finally {
        setAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setImagePreview(null);
    setPhotoBase64(null);
    setAiDetected(null);
  };

  // Leaflet component to handle clicks on the map modal
  function MapClickEvent() {
    useMapEvents({
      click(e) {
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
        setAddress(`📍 Geotagged: Lat ${e.latlng.lat.toFixed(4)}, Lng ${e.latlng.lng.toFixed(4)} · Ward 12`);
      }
    });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) return toast.error("Please enter a description");

    setLoading(true);
    try {
      const payload = {
        description,
        category,
        severity,
        lat,
        lng,
        address,
        city: detectedCity || "Latur",
        ward: "Ward 1",
        photoBase64: photoBase64 || null
      };

      await api.post("/issues", payload);
      toast.success("Issue reported! +50 pts earned ⭐");
      navigate("/issues");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      
      <div className="space-y-1">
        <h2 className="text-2xl font-bold font-display text-primary">Report a Civic Issue</h2>
        <p className="text-xs text-muted">Upload a photo to let our AI auto-route and categorize your report.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Upload Photo */}
        <GlassCard className="p-6 bg-white/60 border-white/40 shadow-sm">
          {imagePreview ? (
            <div className="relative w-full h-[280px] rounded-xl overflow-hidden group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-3 bg-red-600 rounded-full text-white cursor-pointer hover:bg-red-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl h-[280px] flex flex-col justify-center items-center gap-2 cursor-pointer transition-colors bg-white/40">
              <Upload size={32} className="text-indigo-600 animate-bounce" />
              <span className="text-sm font-bold text-primary">Drag photo here or click to browse</span>
              <span className="text-[10px] text-muted font-medium">JPEG, PNG up to 10MB</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="hidden" 
              />
            </label>
          )}
        </GlassCard>

        {/* Section 2: AI Classification Indicator */}
        {(aiLoading || aiDetected) && (
          <GlassCard className="p-4 border-l-4 border-l-indigo-500 bg-indigo-50/50 border-white/30 flex items-center gap-3 animate-fade-in">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Bot size={18} />
            </div>
            <div className="flex-1 text-xs">
              {aiLoading ? (
                <span>🤖 AI is analyzing your photo and description...</span>
              ) : (
                <div>
                  <span className="font-bold text-indigo-900">
                    AI Detected: {aiDetected.category?.replace("_", " ").toUpperCase()} — {aiDetected.severity?.toUpperCase()}
                  </span>
                  <p className="text-indigo-700 mt-0.5">{aiDetected.reason}</p>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Section 3: Categories selection */}
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-3">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">Select Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_CHIPS.map((chip) => {
              const isSelected = category === chip.value;
              return (
                <button
                  type="button"
                  key={chip.value}
                  onClick={() => {
                    setCategory(chip.value);
                    setIsManuallySet(true);
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
                  }`}
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Section 4: Severity selection */}
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-3">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">Set Severity</span>
          <div className="flex flex-wrap gap-2">
            {SEVERITY_CHIPS.map((chip) => {
              const isSelected = severity === chip.value;
              return (
                <button
                  type="button"
                  key={chip.value}
                  onClick={() => {
                    setSeverity(chip.value);
                    setIsManuallySet(true);
                  }}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Section 5: Description text */}
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-muted uppercase">
            <span>Description</span>
            <span className="font-data">{description.length}/500</span>
          </div>
          <Textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Tell us what the issue is, exact landmark details, and impact..."
            rows={4}
            required
          />
        </GlassCard>

        {/* Section 6: Geotagged Location */}
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Report Location</span>
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Adjust Pin Location
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={address}
              disabled
              className="bg-white/40 border-white/60"
            />
          </div>
        </GlassCard>

        {/* Submit */}
        <Button 
          type="submit" 
          loading={loading} 
          variant="yellow" 
          className="w-full py-3 text-white"
        >
          Submit Civic Report 🚀
        </Button>

      </form>

      {/* Location Modal map */}
      <Modal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        title="Adjust report coordinates"
      >
        <div className="h-72 w-full rounded-xl overflow-hidden border border-gray-300">
          <MapContainer center={[lat, lng]} zoom={15} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={[lat, lng]} />
            <MapClickEvent />
          </MapContainer>
        </div>
        <p className="text-xs text-muted text-center italic mt-2">
          Click anywhere on the map to place the issue pin.
        </p>
        <Button 
          onClick={() => setLocationModalOpen(false)} 
          variant="primary" 
          className="w-full mt-4 text-white"
        >
          Confirm Location Coordinates
        </Button>
      </Modal>

    </div>
  );
}
