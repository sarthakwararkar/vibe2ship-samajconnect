import React from "react";
import { Star, Video, MapPin, Calendar, Check, AlertCircle } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import toast from "react-hot-toast";

export default function DoctorCard({ doctor }) {
  const isAvailable = doctor?.isAvailable !== false;
  const isSurge = doctor?.isSurgeMode === true;

  const handleVideoConsult = () => {
    toast.success(`Booking video consult with ${doctor.name}... ID token verified!`);
  };

  const handleBookVisit = () => {
    toast.success(`Walk-in slot requested at ${doctor.clinicName || "clinic"}!`);
  };

  // Specialization color scheme
  const getSpecColor = (spec) => {
    switch (spec) {
      case "Pulmonologist": return "#EF4444"; // red (lungs)
      case "Cardiologist":  return "#DB2777"; // pink (heart)
      case "Pediatrician":  return "#F59E0B"; // orange (kids)
      case "ENT Specialist": return "#3B82F6"; // blue
      case "General Physician": return "#6366F1"; // indigo
      default: return "#10B981"; // emerald
    }
  };

  return (
    <GlassCard 
      className={`p-4.5 flex items-center gap-4 bg-white/60 border-white/40 shadow-sm transition-all duration-300 relative ${
        !isAvailable ? "opacity-60" : ""
      } ${isSurge ? "border-l-4 border-l-emerald-500" : ""}`}
    >
      {/* Left: Avatar with specialization color ring */}
      <div className="flex-shrink-0 relative">
        <Avatar 
          src={doctor.photoUrl} 
          name={doctor.name} 
          tier="Bronze" // Dummy tier for avatar border placeholder
          size="md" 
          style={{ borderColor: getSpecColor(doctor.specialization) }}
        />
        {isAvailable ? (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border border-white" />
        ) : (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gray-400 border border-white" />
        )}
      </div>

      {/* Center: Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-bold text-primary truncate leading-tight">{doctor.name}</h4>
          {isSurge && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              🟢 SURGE READY
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-indigo-700 leading-tight mt-0.5">{doctor.specialization}</p>
        <p className="text-[11px] text-muted truncate mt-1 flex items-center gap-1">
          <MapPin size={11} /> {doctor.clinicName || "Latur General Clinic"}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3.5 text-[10px] text-muted font-semibold mt-2.5">
          <span className="flex items-center gap-0.5 text-yellow-600">
            <Star size={11} fill="currentColor" />
            <span className="font-data">{doctor.rating || 4.8}</span>
          </span>
          <span className="font-data">
            {doctor.aqiConsultCount || 12} consultations
          </span>
          <span className="font-data">
            Fee: ₹{doctor.consultationFee || 250}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-col gap-2 flex-shrink-0 items-end">
        {isAvailable ? (
          <>
            {doctor.offersVideo && (
              <Button 
                onClick={handleVideoConsult}
                variant="ghost" 
                size="sm"
                className="py-1 px-3 text-[11px] h-7 w-28 bg-white/40 border-white/60 text-indigo-800"
              >
                <Video size={12} /> Video Call
              </Button>
            )}
            {doctor.offersWalkIn && (
              <Button 
                onClick={handleBookVisit}
                variant="primary" 
                size="sm"
                className="py-1 px-3 text-[11px] h-7 w-28 text-white"
              >
                Book Visit
              </Button>
            )}
          </>
        ) : (
          <>
            <span className="text-[10px] font-bold text-muted flex items-center gap-1">
              <AlertCircle size={12} /> Available at {doctor.availableFrom || "9 PM"}
            </span>
            <Button
              onClick={() => toast.success(`Reminding you when ${doctor.name} is online.`)}
              variant="ghost"
              size="sm"
              className="py-1 px-3 text-[11px] h-7 w-28 bg-white/30 border-white/50"
            >
              Remind Me
            </Button>
          </>
        )}
      </div>
    </GlassCard>
  );
}
