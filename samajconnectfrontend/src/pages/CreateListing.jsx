import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import Button from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/Input";
import GlassCard from "../components/ui/GlassCard";
import PriceSuggestionChip from "../components/marketplace/PriceSuggestionChip";
import { suggestItemPrice } from "../../src/services/gemini";
import api from "../../src/services/api";
import toast from "react-hot-toast";

const CATEGORIES = ["Books", "Electronics", "Furniture", "Clothing", "Appliances", "Tools"];
const CONDITIONS = ["Like New", "Good", "Fair", "Needs Repair"];
const WARDS = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5", "Ward 6", "Ward 7", "Ward 8", "Ward 9", "Ward 10", "Ward 11", "Ward 12"];

export default function CreateListing() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Books");
  const [condition, setCondition] = useState("Good");
  const [type, setType] = useState("sell"); // sell, donate, borrow
  const [price, setPrice] = useState("");

  // Sub-fields by type
  const [recipientPreference, setRecipientPreference] = useState("Anyone");
  const [borrowDuration, setBorrowDuration] = useState("7");
  const [borrowDeposit, setBorrowDeposit] = useState("");

  // Photo states
  const [imagePreview, setImagePreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);

  // AI Suggest Price states
  const [aiPrice, setAiPrice] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setImagePreview(null);
    setPhotoBase64(null);
  };

  const handleGetAiPrice = async () => {
    if (!title) return toast.error("Please enter a title first to evaluate price range");

    setAiLoading(true);
    setAiPrice(null);
    try {
      const suggest = await suggestItemPrice(title, condition, category);
      if (suggest) {
        setAiPrice(suggest);
        toast.success("AI fair price evaluation complete");
      } else {
        toast.error("Could not estimate price range. Try adding more title details.");
      }
    } catch (err) {
      console.warn("AI Price Suggestion failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return toast.error("Please fill in title and description");
    if (type === "sell" && !price) return toast.error("Please set a price");

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        category,
        condition,
        type,
        price: type === "sell" ? parseFloat(price) : 0,
        photoBase64: photoBase64 || null,
        city: "Latur",
        ward: "Ward 12",
        // Additional properties for Donate & Borrow
        recipientPreference: type === "donate" ? recipientPreference : null,
        borrowDurationDays: type === "borrow" ? parseInt(borrowDuration) : null,
        depositAmount: type === "borrow" && borrowDeposit ? parseFloat(borrowDeposit) : null
      };

      // Add AI price metrics if available
      if (type === "sell" && aiPrice) {
        payload.aiMinPrice = aiPrice.minPrice;
        payload.aiMaxPrice = aiPrice.maxPrice;
      }

      await api.post("/marketplace/listings", payload);
      toast.success("Item listed successfully! +40 pts earned ⭐");
      navigate("/marketplace");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      
      <div className="space-y-1">
        <h2 className="text-2xl font-bold font-display text-primary">List an Item</h2>
        <p className="text-xs text-muted">Share books, tools, or household items with your neighborhood.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        
        {/* Left Column: Image upload */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider block px-1">Item Photo</span>
          
          <GlassCard className="p-4 bg-white/60 border-white/40 shadow-sm">
            {imagePreview ? (
              <div className="relative aspect-square w-full rounded-xl overflow-hidden group">
                <img src={imagePreview} alt="Item Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-2 bg-red-600 rounded-full text-white cursor-pointer hover:bg-red-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl aspect-square flex flex-col justify-center items-center gap-2 cursor-pointer transition-colors bg-white/40 text-center p-4">
                <Upload size={28} className="text-indigo-600" />
                <span className="text-xs font-bold text-primary">Add Photo</span>
                <span className="text-[9px] text-muted">JPEG/PNG up to 10MB</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </label>
            )}
          </GlassCard>

          {imagePreview && (
            <GlassCard className="p-3 bg-indigo-50/50 border border-white/30 text-[10px] text-indigo-900 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-600" />
              <span>🤖 AI Condition Check: {condition}</span>
            </GlassCard>
          )}
        </div>

        {/* Right Column: Listing fields */}
        <div className="space-y-4">
          
          {/* General info */}
          <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-4">
            <Input
              type="text"
              label="Item Name / Title"
              placeholder="e.g. NCERT Chemistry Class 12 textbook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>

              <Select
                label="Condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                disabled={loading}
              >
                {CONDITIONS.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Description / Condition details"
              placeholder="Detail item specifications, any missing parts, and pickup instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              disabled={loading}
            />
          </GlassCard>

          {/* Listing type toggles */}
          <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Listing Type</span>
              <div className="flex gap-2 p-1 bg-white/40 border border-white/20 rounded-xl">
                {["sell", "donate", "borrow"].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg uppercase transition-all cursor-pointer ${
                      type === t
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Render conditional inputs */}
            {type === "sell" && (
              <div className="space-y-3 pt-2 border-t border-white/20">
                <div className="grid grid-cols-2 gap-4 items-end">
                  <Input
                    type="number"
                    label="Asking Price (INR)"
                    placeholder="e.g. 150"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required={type === "sell"}
                    disabled={loading}
                  />

                  <Button
                    type="button"
                    onClick={handleGetAiPrice}
                    disabled={aiLoading || loading}
                    variant="ghost"
                    className="py-2.5 bg-white/40 border-white/60 text-indigo-800"
                  >
                    <Sparkles size={14} className="text-amber-500 mr-1" /> Suggest Price
                  </Button>
                </div>

                {/* AI Price Suggestion details */}
                {aiPrice && (
                  <div className="animate-fade-in">
                    <PriceSuggestionChip
                      minPrice={aiPrice.minPrice}
                      maxPrice={aiPrice.maxPrice}
                      onClick={() => setPrice(aiPrice.suggestedPrice.toString())}
                    />
                  </div>
                )}
              </div>
            )}

            {type === "donate" && (
              <div className="pt-2 border-t border-white/20">
                <Select
                  label="Preferred Recipient Profile"
                  value={recipientPreference}
                  onChange={(e) => setRecipientPreference(e.target.value)}
                  disabled={loading}
                >
                  <option value="Anyone">Open to anyone</option>
                  <option value="Students">Students only</option>
                  <option value="Families">Low-income families</option>
                  <option value="NGOs">Verified charities / NGOs</option>
                </Select>
              </div>
            )}

            {type === "borrow" && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/20">
                <Input
                  type="number"
                  label="Max Borrow Duration (Days)"
                  value={borrowDuration}
                  onChange={(e) => setBorrowDuration(e.target.value)}
                  required={type === "borrow"}
                  disabled={loading}
                />
                <Input
                  type="number"
                  label="Refundable Security Deposit (INR - Optional)"
                  placeholder="e.g. 500"
                  value={borrowDeposit}
                  onChange={(e) => setBorrowDeposit(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}
          </GlassCard>

          {/* Location details */}
          <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm grid grid-cols-2 gap-4">
            <Input
              type="text"
              label="Location Town"
              value="Latur"
              disabled
            />

            <Select
              label="Ward"
              defaultValue="Ward 12"
              disabled
            >
              <option value="Ward 12">Ward 12</option>
            </Select>
          </GlassCard>

          <Button 
            type="submit" 
            loading={loading} 
            variant="primary" 
            className="w-full py-3 text-white"
          >
            Create Store Listing 🚀
          </Button>

        </div>

      </form>
    </div>
  );
}
