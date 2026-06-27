import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Filter, MessageSquare, HeartHandshake, BookOpen, Trash2, Calendar } from "lucide-react";
import ListingCard from "../components/marketplace/ListingCard";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { Input, Select, Switch } from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { formatPrice, formatDistance, timeAgo } from "../utils/formatters";
import toast from "react-hot-toast";

const CATEGORY_CHIPS = ["all", "books", "electronics", "furniture", "clothing", "appliances", "tools"];
const CONDITIONS = ["all", "Like New", "Good", "Fair"];

export default function Marketplace() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Search & Filter states
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all"); // all, sell, donate, borrow
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [myListings, setMyListings] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");

  // Listing Data
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {
        city: profile?.city || "Latur"
      };
      if (category !== "all") params.category = category;
      if (type !== "all") params.type = type;

      const res = await api.get("/marketplace/listings", { params });
      setListings(res.data.listings || res.data || []);
    } catch (err) {
      console.warn("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, type, profile]);

  const handleClearFilters = () => {
    setSearch("");
    setType("all");
    setCategory("all");
    setCondition("all");
    setMinPrice("");
    setMaxPrice("");
    setMyListings(false);
  };

  // Client-side filtering
  const filteredListings = listings.filter((item) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = (item.title || "") + " " + (item.description || "") + " " + (item.category || "");
      if (!match.toLowerCase().includes(q)) return false;
    }

    // Condition
    if (condition !== "all" && item.condition !== condition) {
      return false;
    }

    // Price range (Sell only)
    if (item.type === "sell" || item.type === "Sell") {
      const priceVal = parseFloat(item.price || 0);
      if (minPrice && priceVal < parseFloat(minPrice)) return false;
      if (maxPrice && priceVal > parseFloat(maxPrice)) return false;
    }

    // My listings
    if (myListings && item.sellerId !== user?.uid) {
      return false;
    }

    return true;
  });

  // Client-side sorting
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === "createdAt") {
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return bTime - aTime;
    }
    if (sortBy === "priceAsc") {
      return parseFloat(a.price || 0) - parseFloat(b.price || 0);
    }
    if (sortBy === "priceDesc") {
      return parseFloat(b.price || 0) - parseFloat(a.price || 0);
    }
    return 0;
  });

  const handleClaim = async (item) => {
    setActionLoading(true);
    try {
      if (item.type === "donate") {
        await api.post(`/marketplace/listings/${item.id}/claim`);
        toast.success("Free donation claimed! Seller notified.");
      } else if (item.type === "borrow") {
        await api.post(`/marketplace/listings/${item.id}/borrow`);
        toast.success("Borrow request submitted! Seller notified.");
      } else {
        await api.post(`/marketplace/listings/${item.id}/claim`);
        toast.success("Purchase claim submitted! Contact details shared.");
      }
      setSelectedItem(null);
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSold = async (itemId) => {
    setActionLoading(true);
    try {
      await api.post(`/marketplace/listings/${itemId}/sold`);
      toast.success("Item marked as sold successfully!");
      setSelectedItem(null);
      fetchListings();
    } catch (err) {
      toast.error("Failed to mark sold");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    setActionLoading(true);
    try {
      await api.delete(`/marketplace/listings/${itemId}`);
      toast.success("Listing deleted successfully");
      setSelectedItem(null);
      fetchListings();
    } catch (err) {
      toast.error("Failed to delete listing");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      
      {/* Left Filter Sidebar */}
      <div className="w-full lg:w-[260px] flex-shrink-0">
        <GlassCard className="p-5 flex flex-col gap-4 bg-white/60 border-white/40 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-white/30">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Store Filters</h3>
            <button 
              onClick={handleClearFilters}
              className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold cursor-pointer transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-9 py-2 glass-input text-xs"
            />
          </div>

          {/* Type Select */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Listing Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="glass-input py-2 text-xs bg-white/45 border-white/60"
            >
              <option value="all">All Types</option>
              <option value="sell">🏷️ For Sell</option>
              <option value="donate">🎁 Free / Donate</option>
              <option value="borrow">📤 For Borrow</option>
            </select>
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Category</span>
            <div className="flex flex-col gap-1">
              {CATEGORY_CHIPS.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    category === cat
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-white/40 border-white/60 text-primary hover:bg-white/65"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Condition selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Condition</span>
            <div className="flex flex-wrap gap-1">
              {CONDITIONS.map((cond) => (
                <button
                  type="button"
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-semibold uppercase transition-all cursor-pointer ${
                    condition === cond
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range inputs (Only Sell mode) */}
          {(type === "sell" || type === "all") && (
            <div className="space-y-1.5 pt-2 border-t border-white/20">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Price Range (INR)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="glass-input py-1.5 text-xs text-center"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="glass-input py-1.5 text-xs text-center"
                />
              </div>
            </div>
          )}

          {/* My Listings Toggle */}
          <div className="pt-2 border-t border-white/20">
            <Switch
              label="Show my listings only"
              checked={myListings}
              onChange={(e) => setMyListings(e.target.checked)}
            />
          </div>

        </GlassCard>
      </div>

      {/* Right Grid Area */}
      <div className="flex-1 w-full space-y-4">
        
        {/* Header row */}
        <div className="flex justify-between items-center bg-white/60 border border-white/40 p-4 rounded-2xl shadow-sm">
          <div className="text-xs text-muted font-bold">
            {sortedListings.length} listings found
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass-input py-1.5 px-3 text-xs w-36 bg-white/40 border-white/60"
            >
              <option value="createdAt">Newest First</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>

            <Link to="/marketplace/create">
              <Button variant="primary" size="sm" className="flex items-center gap-1 text-white">
                <Plus size={15} /> List Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton height="220px" />
            <Skeleton height="220px" />
            <Skeleton height="220px" />
          </div>
        ) : sortedListings.length === 0 ? (
          <EmptyState 
            icon={<HeartHandshake size={32} />} 
            title="No listings found" 
            description="Be the first to list a second-hand item or request to borrow!"
            actionLabel="List an Item"
            onAction={() => navigate("/marketplace/create")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedListings.map((item) => (
              <div 
                key={item.id} 
                onClick={(e) => { e.preventDefault(); setSelectedItem(item); }}
                className="cursor-pointer"
              >
                <ListingCard listing={item} />
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── ITEM DETAILS MODAL ── */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || "Item Details"}
      >
        {selectedItem && (
          <div className="space-y-4">
            {selectedItem.photoUrl && (
              <div className="w-full h-48 rounded-xl overflow-hidden shadow-sm">
                <img src={selectedItem.photoUrl} alt={selectedItem.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-white/20">
              <div className="flex gap-2">
                <Badge variant={selectedItem.type} />
                <Badge variant={selectedItem.category} />
              </div>
              <span className="text-sm font-bold font-data text-indigo-700">
                {selectedItem.type === "donate" ? "FREE" : formatPrice(selectedItem.price)}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Description</span>
              <p className="text-xs text-primary leading-relaxed">{selectedItem.description}</p>
            </div>

            {/* Condition & distance info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-2.5 rounded-xl bg-white/40 border border-white/20">
                <span className="text-muted block text-[10px]">Condition</span>
                <span className="font-bold text-primary">{selectedItem.condition || "Good"}</span>
              </div>
              {selectedItem.distance !== undefined && (
                <div className="p-2.5 rounded-xl bg-white/40 border border-white/20">
                  <span className="text-muted block text-[10px]">Distance</span>
                  <span className="font-bold text-primary font-data">{formatDistance(selectedItem.distance)}</span>
                </div>
              )}
            </div>

            {/* Seller profile */}
            <div className="flex items-center gap-3 p-3 bg-white/50 border border-white/30 rounded-2xl">
              <Avatar name={selectedItem.sellerName} tier={selectedItem.sellerTier || "Bronze"} size="sm" />
              <div>
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Listed By</span>
                <span className="text-xs font-bold text-primary">{selectedItem.sellerName}</span>
              </div>
              <Badge variant={selectedItem.sellerTier || "Bronze"} className="ml-auto" />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t border-white/20">
              {selectedItem.sellerId === user?.uid ? (
                <>
                  <Button
                    onClick={() => handleMarkSold(selectedItem.id)}
                    loading={actionLoading}
                    variant="yellow"
                    className="flex-1 text-white py-2"
                  >
                    Mark Sold
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedItem.id)}
                    loading={actionLoading}
                    variant="danger"
                    className="py-2"
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleClaim(selectedItem)}
                  loading={actionLoading}
                  variant="primary"
                  className="w-full text-white py-2.5"
                >
                  {selectedItem.type === "borrow" ? "Request to Borrow Item 📤" : selectedItem.type === "donate" ? "Claim Free Item 🎁" : "Confirm Buy Claim 🏷️"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
