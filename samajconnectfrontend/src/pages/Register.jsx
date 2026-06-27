import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import { Input, Select, Switch } from "../components/ui/Input";
import Divider from "../components/ui/Divider";
import GlassCard from "../components/ui/GlassCard";
import toast from "react-hot-toast";
import api from "../services/api";

const WARD_OPTIONS = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5", "Ward 6", "Ward 7", "Ward 8", "Ward 9", "Ward 10", "Ward 11", "Ward 12"];
const LANGUAGE_OPTIONS = ["Marathi", "Hindi", "English"];
const EXPERT_CATEGORIES = [
  { value: "agriculture", label: "🌱 Agriculture" },
  { value: "legal", label: "⚖️ Legal" },
  { value: "medical", label: "🩺 Medical" },
  { value: "plumbing", label: "🔧 Plumbing" },
  { value: "electrical", label: "⚡ Electrical" },
  { value: "education", label: "🎓 Education" },
  { value: "financial", label: "💰 Financial" },
  { value: "technology", label: "💻 Technology" }
];
const DOCTOR_SPECIALIZATIONS = [
  "General Physician",
  "Pulmonologist",
  "Cardiologist",
  "Pediatrician",
  "ENT Specialist",
  "Allergist",
  "Dermatologist"
];

export default function Register() {
  const { registerFirebase, setProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we came from Google login redirection
  const googleData = location.state || null;
  const isGoogle = !!googleData;

  const [step, setStep] = useState(isGoogle ? 2 : 1);
  const [loading, setLoading] = useState(false);

  // Form State
  // Step 1: Credentials
  const [email, setEmail] = useState(googleData?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Location Profile
  const [name, setName] = useState(googleData?.name || "");
  const [city, setCity] = useState("Latur");
  const [state, setState] = useState("Maharashtra");
  const [ward, setWard] = useState("Ward 12");
  const [lat, setLat] = useState(18.4088);
  const [lng, setLng] = useState(76.5604);

  // Step 3: Languages
  const [languages, setLanguages] = useState(["Marathi", "Hindi"]);

  // Step 4: Expert/Doctor roles
  const [isExpert, setIsExpert] = useState(false);
  const [selectedExpertCategories, setSelectedExpertCategories] = useState([]);
  
  const [isDoctor, setIsDoctor] = useState(false);
  const [doctorSpecialization, setDoctorSpecialization] = useState("General Physician");
  const [doctorClinic, setDoctorClinic] = useState("");
  const [doctorFee, setDoctorFee] = useState("");
  const [doctorOffersVideo, setDoctorOffersVideo] = useState(false);
  const [doctorOffersWalkIn, setDoctorOffersWalkIn] = useState(true);

  // Handle language click
  const toggleLanguage = (lang) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  // Handle expert categories
  const toggleExpertCategory = (cat) => {
    if (selectedExpertCategories.includes(cat)) {
      setSelectedExpertCategories(selectedExpertCategories.filter(c => c !== cat));
    } else {
      setSelectedExpertCategories([...selectedExpertCategories, cat]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!email || !password || !confirmPassword) return toast.error("All credentials are required");
      if (password !== confirmPassword) return toast.error("Passwords do not match");
      if (password.length < 6) return toast.error("Password must be at least 6 characters");
    }
    if (step === 2) {
      if (!name || !ward) return toast.error("Name and Ward are required");
    }
    if (step === 3) {
      if (languages.length === 0) return toast.error("Please select at least one language");
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 2 && isGoogle) return; // Cannot go back to credentials step
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Firebase Auth (if not Google)
      if (!isGoogle) {
        await registerFirebase(email, password);
      }

      // 2. Profile Creation on Express Backend
      // The Axios interceptor might not have the ID token immediately if state is resolving,
      // but Firebase Auth will trigger client state refresh.
      // To be safe, wait 500ms or retry if needed.
      await new Promise(r => setTimeout(r, 600));

      const regPayload = {
        name,
        ward,
        city,
        state,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        languages
      };

      const regRes = await api.post("/auth/register", regPayload);
      const userProfile = regRes.data.user;

      // 3. Expert Registration if checked
      if (isExpert && selectedExpertCategories.length > 0) {
        await api.post("/auth/expert-register", { expertCategories: selectedExpertCategories });
      }

      // 4. Doctor Registration if checked
      if (isDoctor && doctorSpecialization) {
        const docPayload = {
          specialization: doctorSpecialization,
          clinicName: doctorClinic || null,
          consultationFee: doctorFee ? parseFloat(doctorFee) : null,
          offersVideo: doctorOffersVideo,
          offersWalkIn: doctorOffersWalkIn
        };
        await api.post("/auth/doctor-register", docPayload);
      }

      toast.success("Account registered successfully! Welcome ⭐");
      
      // Update global context profile
      if (refreshProfile) {
        await refreshProfile();
      } else {
        setProfile(userProfile);
      }

      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(err.response?.data?.error || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const stepsCount = isGoogle ? 3 : 4;
  const activeDotIndex = isGoogle ? step - 2 : step - 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mid relative">
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-purple-300/40 via-lavender-200/20 to-blue-200/40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[500px] z-10"
      >
        <GlassCard className="glass-elevated p-8 flex flex-col gap-6 bg-white/65 shadow-2xl border-white/50">
          
          {/* Step Indicator Dots */}
          <div className="flex justify-between items-center select-none mb-2">
            <span className="text-xs font-bold text-muted uppercase">Step {activeDotIndex + 1} of {stepsCount}</span>
            <div className="flex gap-1.5">
              {Array.from({ length: stepsCount }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeDotIndex ? "w-6 bg-indigo-600" : "w-2 bg-indigo-600/25"
                  }`} 
                />
              ))}
            </div>
          </div>

          <form onSubmit={step === 4 || (isGoogle && step === 4) ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Credentials */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-lg font-bold text-primary">Create your credentials</h2>
                    <p className="text-xs text-muted">Use your email address to secure your community profile.</p>
                  </div>
                  
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="name@latur.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    label="Password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </motion.div>
              )}

              {/* STEP 2: Location Profile */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-lg font-bold text-primary">Tell us about yourself</h2>
                    <p className="text-xs text-muted">Set up your name and neighborhood ward for relevant civic updates.</p>
                  </div>

                  <Input
                    type="text"
                    label="Full Name"
                    placeholder="e.g. Ramesh Patil"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Ward Number"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                    >
                      {WARD_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Select>

                    <Input
                      type="text"
                      label="City"
                      value={city}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      step="any"
                      label="Latitude"
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value))}
                    />
                    <Input
                      type="number"
                      step="any"
                      label="Longitude"
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value))}
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Languages */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-lg font-bold text-primary">Languages Spoken</h2>
                    <p className="text-xs text-muted">Which languages do you speak? We use this to route expert discussions.</p>
                  </div>

                  <div className="flex flex-wrap gap-3 py-2">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isSelected = languages.includes(lang);
                      return (
                        <button
                          type="button"
                          key={lang}
                          onClick={() => toggleLanguage(lang)}
                          className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                            isSelected 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "bg-white/40 border-white/60 text-primary hover:bg-white/70"
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Optional Roles */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-lg font-bold text-primary">Specialized Roles (Optional)</h2>
                    <p className="text-xs text-muted">Earn higher trust scores by offering expertise or consultations.</p>
                  </div>

                  {/* Expert Toggle */}
                  <div className="glass p-4 border border-white/40 bg-white/40 rounded-2xl space-y-3">
                    <Switch
                      label="Are you a Community Expert?"
                      checked={isExpert}
                      onChange={(e) => setIsExpert(e.target.checked)}
                    />
                    
                    {isExpert && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-white/20">
                        <span className="text-xs font-semibold text-muted block mb-1">Select Expert Categories</span>
                        <div className="flex flex-wrap gap-2">
                          {EXPERT_CATEGORIES.map((cat) => {
                            const isSelected = selectedExpertCategories.includes(cat.value);
                            return (
                              <button
                                type="button"
                                key={cat.value}
                                onClick={() => toggleExpertCategory(cat.value)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                  isSelected 
                                    ? "bg-indigo-600 border-indigo-600 text-white" 
                                    : "bg-white/50 border-white/40 text-primary"
                                }`}
                              >
                                {cat.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Doctor Toggle */}
                  <div className="glass p-4 border border-white/40 bg-white/40 rounded-2xl space-y-3">
                    <Switch
                      label="Are you a Medical Doctor?"
                      checked={isDoctor}
                      onChange={(e) => setIsDoctor(e.target.checked)}
                    />

                    {isDoctor && (
                      <div className="space-y-3 mt-2 pt-2 border-t border-white/20">
                        <Select
                          label="Medical Specialization"
                          value={doctorSpecialization}
                          onChange={(e) => setDoctorSpecialization(e.target.value)}
                        >
                          {DOCTOR_SPECIALIZATIONS.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </Select>
                        
                        <Input
                          type="text"
                          label="Clinic/Hospital Name"
                          placeholder="e.g. Latur Care Hospital"
                          value={doctorClinic}
                          onChange={(e) => setDoctorClinic(e.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            label="Consultation Fee (INR)"
                            placeholder="e.g. 300"
                            value={doctorFee}
                            onChange={(e) => setDoctorFee(e.target.value)}
                          />
                          <div className="flex flex-col justify-end pb-1 gap-2 text-xs font-semibold text-primary">
                            <label className="flex items-center gap-1.5">
                              <input 
                                type="checkbox" 
                                checked={doctorOffersVideo} 
                                onChange={(e) => setDoctorOffersVideo(e.target.checked)} 
                                className="rounded text-indigo-600 border-white/60 focus:ring-indigo-500"
                              />
                              Offers Video consultations
                            </label>
                            <label className="flex items-center gap-1.5">
                              <input 
                                type="checkbox" 
                                checked={doctorOffersWalkIn} 
                                onChange={(e) => setDoctorOffersWalkIn(e.target.checked)}
                                className="rounded text-indigo-600 border-white/60 focus:ring-indigo-500"
                              />
                              Offers Clinic visits
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-3 select-none">
              {step > (isGoogle ? 2 : 1) ? (
                <Button type="button" onClick={handleBack} variant="ghost" className="flex-1">
                  Back
                </Button>
              ) : (
                <div className="flex-1" /> // Placeholder to keep Next right-aligned
              )}

              {step < 4 ? (
                <Button type="button" onClick={handleNext} variant="primary" className="flex-1">
                  Next
                </Button>
              ) : (
                <Button type="submit" loading={loading} variant="yellow" className="flex-1 py-2.5">
                  Create Account 🚀
                </Button>
              )}
            </div>
          </form>

          <Divider label="" />

          <p className="text-center text-xs text-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 font-bold hover:underline">
              Sign in →
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
