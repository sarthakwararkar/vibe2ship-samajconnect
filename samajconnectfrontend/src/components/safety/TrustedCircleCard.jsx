import React, { useState } from "react";
import { UserPlus, Trash2, Heart, ShieldAlert } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { Input, Select } from "../ui/Input";
import Modal from "../ui/Modal";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function TrustedCircleCard({ circle = [], onUpdate, loading = false }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("Family");
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter email");

    setAdding(true);
    try {
      const res = await api.post("/safety/circle", { email, relationship });
      toast.success(res.data.message || "Contact added to circle!");
      setEmail("");
      setModalOpen(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || "User not found or already in circle");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (contactUid) => {
    try {
      await api.delete(`/safety/circle/${contactUid}`);
      toast.success("Contact removed from circle");
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error("Failed to remove contact");
    }
  };

  return (
    <GlassCard className="p-5 flex flex-col gap-4 bg-white/60 border-white/40 shadow-sm h-full">
      <div className="flex justify-between items-center pb-2 border-b border-white/30">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Heart size={16} className="text-indigo-600" />
          <span>Trusted Circle</span>
        </h3>
        <span className="text-[10px] font-bold text-muted uppercase font-data">{circle.length} members</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-1">
        {loading ? (
          <span className="text-xs text-muted">Loading circle...</span>
        ) : circle.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted italic">
            Your circle is empty. Add family members or friends to alert them during emergencies.
          </div>
        ) : (
          circle.map((member) => (
            <div key={member.uid} className="flex items-center gap-3 p-2 bg-white/40 border border-white/20 rounded-xl">
              <Avatar name={member.name} tier={member.tier || "Bronze"} size="sm" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-primary truncate leading-tight">{member.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-semibold text-indigo-700 uppercase tracking-wider">
                    {member.relationship || "Friend"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Online" />
                </div>
              </div>
              
              <button
                onClick={() => handleRemove(member.uid)}
                className="p-1 text-muted hover:text-red-500 transition-colors cursor-pointer"
                title="Remove Contact"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <Button
        onClick={() => setModalOpen(true)}
        variant="ghost"
        size="sm"
        className="w-full bg-white/40 border-white/60 text-primary flex items-center justify-center gap-1.5 mt-2"
      >
        <UserPlus size={14} /> Add Contact
      </Button>

      {/* Add Contact Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add to Trusted Circle"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            type="email"
            label="Contact's Email"
            placeholder="family@latur.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={adding}
          />

          <Select
            label="Relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            disabled={adding}
          >
            <option value="Family">Family Member</option>
            <option value="Friend">Close Friend</option>
            <option value="Neighbor">Neighbor</option>
            <option value="Doctor">Personal Physician</option>
          </Select>

          <Button
            type="submit"
            loading={adding}
            variant="primary"
            className="w-full text-white mt-2"
          >
            Save Contact to Circle
          </Button>
        </form>
      </Modal>

    </GlassCard>
  );
}
