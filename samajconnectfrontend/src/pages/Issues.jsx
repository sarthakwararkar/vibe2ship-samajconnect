import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, List, Map, Plus } from "lucide-react";
import IssueFilters from "../components/issues/IssueFilters";
import IssueCard from "../components/issues/IssueCard";
import IssueMap from "../components/map/IssueMap";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { AppContext } from "../context/AppContext";

export default function Issues() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { userLocation, detectedCity } = useContext(AppContext);

  // Tab State
  const [activeTab, setActiveTab] = useState("list"); // list or map

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [myReports, setMyReports] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");

  // Data states
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {
        city: detectedCity || profile?.city || "Latur",
        limit: 100 // Fetch a larger batch to filter on client-side
      };
      
      if (status !== "all") params.status = status;
      if (category !== "all") params.category = category;
      
      const res = await api.get("/issues", { params });
      setIssues(res.data.issues || []);
    } catch (err) {
      console.warn("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [status, category, profile, detectedCity]);

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setCategory("all");
    setSeverity("all");
    setMyReports(false);
    setSortBy("createdAt");
  };

  // Client-side filtering
  const filteredIssues = issues.filter((issue) => {
    // 1. Text Search (description, category, address)
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchText = (issue.description || "") + " " + (issue.category || "") + " " + (issue.address || "");
      if (!matchText.toLowerCase().includes(q)) return false;
    }
    
    // 2. Severity
    if (severity !== "all" && issue.severity !== severity) {
      return false;
    }

    // 3. My Reports
    if (myReports && issue.reporterId !== user?.uid) {
      return false;
    }

    return true;
  });

  // Client-side sorting
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === "createdAt") {
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return bTime - aTime;
    }
    if (sortBy === "upvotes") {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    if (sortBy === "severity") {
      const getWeight = (s) => {
        if (s === "critical") return 4;
        if (s === "high") return 3;
        if (s === "medium") return 2;
        return 1;
      };
      return getWeight(b.severity) - getWeight(a.severity);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedIssues.length / itemsPerPage) || 1;
  const paginatedIssues = sortedIssues.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleUpdateIssue = (updated) => {
    setIssues(prev => prev.map(iss => iss.id === updated.id ? updated : iss));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      
      {/* Left Filter Sidebar */}
      <div className="w-full lg:w-[280px] flex-shrink-0">
        <IssueFilters
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          category={category}
          setCategory={setCategory}
          severity={severity}
          setSeverity={setSeverity}
          myReports={myReports}
          setMyReports={setMyReports}
          onClear={handleClearFilters}
        />
      </div>

      {/* Right Content Panel */}
      <div className="flex-1 w-full space-y-4">
        
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 border border-white/40 p-4 rounded-2xl shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("list")}
              className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "list"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
              }`}
            >
              <List size={15} /> List View
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all ${
                activeTab === "map"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
              }`}
            >
              <Map size={15} /> Map View
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {activeTab === "list" && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="glass-input py-2 px-3 text-xs w-36 bg-white/40 border-white/60"
              >
                <option value="createdAt">Newest First</option>
                <option value="upvotes">Most Voted</option>
                <option value="severity">Highest Severity</option>
              </select>
            )}

            <Link to="/issues/report">
              <Button variant="primary" size="sm" className="flex items-center gap-1 text-white">
                <Plus size={15} /> Report Issue
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "list" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center text-xs text-muted font-semibold px-1">
              <span>{sortedIssues.length} issues found in Latur</span>
              <span>Page {page} of {totalPages}</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton height="160px" />
                <Skeleton height="160px" />
                <Skeleton height="160px" />
                <Skeleton height="160px" />
              </div>
            ) : paginatedIssues.length === 0 ? (
              <EmptyState 
                icon={<AlertCircle size={32} />} 
                title="No issues found" 
                description="Try clearing your filters or report a new issue."
                actionLabel="Report an Issue"
                onAction={() => navigate("/issues/report")}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedIssues.map((issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={issue} 
                    onUpdate={handleUpdateIssue}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(prev => prev - 1)}
                  className="bg-white/40 border-white/60"
                >
                  Previous
                </Button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      page === i + 1
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => prev + 1)}
                  className="bg-white/40 border-white/60"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Map View */
          <div className="space-y-2">
            <div className="text-xs text-muted font-semibold px-1 mb-2">
              Showing {filteredIssues.filter(i => i.lat && i.lng).length} geotagged issues on map
            </div>
            <IssueMap issues={filteredIssues} height="520px" center={userLocation ? [userLocation.lat, userLocation.lng] : undefined} />
          </div>
        )}

      </div>
      
    </div>
  );
}
