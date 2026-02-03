"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  LogOut,
  Briefcase,
  Settings,
  Archive,
  ArchiveX,
  ChevronDown,
  Plus,
  FormInput,
  Loader2,
  Trash2,
  Users,
} from "lucide-react";
import { User } from "@/types/user";

interface Application {
  id: string;
  candidateName: string;
  position: string;
  status: string;
  appliedAt: string;
  email: string;
  opened?: boolean; // Track if application has been viewed
  isArchived?: boolean; // Archive status
}

export default function ApplicationsContent() {
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApplications, setSelectedApplications] = useState<string[]>(
    [],
  );
  const [archiveMode, setArchiveMode] = useState<"normal" | "archive">(
    "normal",
  );
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showJobsDropdown, setShowJobsDropdown] = useState(false);
  const itemsPerPage = 10;
  const router = useRouter();

  // Infinite scroll state
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const currentPageRef = useRef(1); // Use ref to avoid stale closure issues
  const [totalApplications, setTotalApplications] = useState(0);

  // Fetch function for infinite scroll
  const fetchApplicationsData = useCallback(
    async (page: number, limit: number) => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token");
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const endpoint =
        archiveMode === "archive"
          ? `/api/applications/archive?${params.toString()}`
          : `/api/applications?${params.toString()}`;

      console.log(
        "fetchApplicationsData called with archiveMode:",
        archiveMode,
        "endpoint:",
        endpoint,
      );

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await response.json();

      // Set "opened" status based on application status
      // Pending = Not opened (unread), Other statuses = opened (read)
      const applicationsWithOpenedStatus = (data.applications || []).map(
        (app: Application) => ({
          ...app,
          opened: app.status !== "pending", // If status is not pending, it means it has been opened/viewed
        }),
      );

      return {
        items: applicationsWithOpenedStatus,
        total: data.total || 0,
        hasMore: (data.page || 1) < (data.totalPages || 1), // Current page < total pages means more data available
      };
    },
    [statusFilter, archiveMode],
  );

  // Load more applications for infinite scroll
  const loadMoreApplications = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    const nextPage = currentPageRef.current;
    setLoading(true);
    try {
      const data = await fetchApplicationsData(nextPage, itemsPerPage);

      if (data.items.length > 0) {
        setApplications((prev) => [...prev, ...data.items]);
        currentPageRef.current = nextPage + 1;
      }

      setTotalApplications(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchApplicationsData, itemsPerPage, loading, hasMore]);

  // Refresh function - resets and loads first page
  const refreshApplications = useCallback(async () => {
    setLoading(true);
    setApplications([]);
    currentPageRef.current = 1;
    setHasMore(true);

    try {
      const data = await fetchApplicationsData(1, itemsPerPage);
      setApplications(data.items);
      currentPageRef.current = 2; // Set to 2 so next load fetches page 2
      setTotalApplications(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to refresh applications:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [fetchApplicationsData, itemsPerPage]);

  // Scroll handler for infinite scroll - REMOVED to prevent page distortion
  // Using manual "Load More" button instead of automatic scroll detection

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);

          // Inline initial data load to avoid dependency issues
          setLoading(true);
          setApplications([]);
          setHasMore(true);

          try {
            const params = new URLSearchParams({
              limit: itemsPerPage.toString(),
              page: "1",
            });

            if (statusFilter) {
              params.append("status", statusFilter);
            }

            const endpoint =
              archiveMode === "archive"
                ? `/api/applications/archive?${params.toString()}`
                : `/api/applications?${params.toString()}`;

            const appsResponse = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (appsResponse.ok) {
              const data = await appsResponse.json();

              // Set "opened" status based on application status
              const applicationsWithOpenedStatus = (
                data.applications || []
              ).map((app: Application) => ({
                ...app,
                opened: app.status !== "pending",
              }));

              setApplications(applicationsWithOpenedStatus);
              currentPageRef.current = 2; // Set to 2 so next load fetches page 2
              setTotalApplications(data.total || 0);
              setHasMore((data.page || 1) < (data.totalPages || 1));
            }
          } catch (appsError) {
            console.error("Failed to load initial applications:", appsError);
          } finally {
            setLoading(false);
          }
        } else {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Only router dependency - statusFilter/archiveMode should NOT trigger re-auth

  // Handle URL parameters for filtering (e.g., ?status=PENDING)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const statusParam = urlParams.get("status");

      if (statusParam) {
        // Validate the status parameter against valid values
        const validStatuses = [
          "PENDING",
          "UNDER_REVIEW",
          "SHORTLISTED",
          "SELECTED",
          "REJECTED",
        ];
        if (validStatuses.includes(statusParam.toUpperCase())) {
          console.log(
            "Setting status filter from URL:",
            statusParam.toUpperCase(),
          );
          setStatusFilter(statusParam.toUpperCase());
        }
      }
    }
  }, []); // Run once on component mount

  // Watch for status filter changes and refresh data
  useEffect(() => {
    if (user && !initialLoading) {
      console.log(
        "Status filter changed to:",
        statusFilter,
        "Refreshing data...",
      );
      // Clear applications immediately to show loading state
      setApplications([]);
      setLoading(true);
      currentPageRef.current = 1;
      setHasMore(true);

      // Load data with new filter
      const loadFilteredData = async () => {
        try {
          const data = await fetchApplicationsData(1, itemsPerPage);
          setApplications(data.items);
          currentPageRef.current = 2;
          setTotalApplications(data.total);
          setHasMore(data.hasMore);
        } catch (error) {
          console.error("Failed to load filtered applications:", error);
        } finally {
          setLoading(false);
        }
      };

      loadFilteredData();
    }
  }, [statusFilter, user, initialLoading, fetchApplicationsData, itemsPerPage]);

  // Remove the automatic archive mode useEffect to avoid conflicts - button handles it directly

  // This will be triggered manually when needed
  /*
  useEffect(() => {
    console.log('useEffect triggered - user:', !!user, 'initialLoading:', initialLoading, 'archiveMode:', archiveMode, 'statusFilter:', statusFilter)
    if (user && !initialLoading) {
      // Inline fetch logic to avoid dependency loops
      const loadInitialData = async () => {
        console.log('Loading initial data...')
        setLoading(true)
        setApplications([])
        setHasMore(true)
        
        try {
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('No authentication token')
          }

          const params = new URLSearchParams({
            limit: itemsPerPage.toString(),
            page: '1'
          })
          
          if (statusFilter) {
            params.append('status', statusFilter)
          }

          const endpoint = archiveMode === 'archive' 
            ? `/api/applications/archive?${params.toString()}`
            : `/api/applications?${params.toString()}`

          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (!response.ok) {
            throw new Error('Failed to fetch applications')
          }

          const data = await response.json()
          
          // Set "opened" status based on application status
          const applicationsWithOpenedStatus = (data.applications || []).map((app: Application) => ({
            ...app,
            opened: app.status !== 'pending'
          }))
          
          setApplications(applicationsWithOpenedStatus)
          currentPageRef.current = 2 // Set to 2 so next load fetches page 2
          setTotalApplications(data.total || 0)
          setHasMore((data.page || 1) < (data.totalPages || 1))
        } catch (error) {
          console.error('Failed to load initial applications:', error)
        } finally {
          setLoading(false)
          setInitialLoading(false)
        }
      }
      
      loadInitialData()
    }
  }, [user, initialLoading, archiveMode, statusFilter])
  */

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showJobsDropdown) {
        const target = event.target as Element;
        if (!target.closest(".relative")) {
          setShowJobsDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showJobsDropdown]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  const handleDeleteApplication = async (
    applicationId: string,
    candidateName: string,
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete the application from "${candidateName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh the applications list
        await refreshApplications();
      } else {
        console.error("Failed to delete application");
        alert("Failed to delete application. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting application:", error);
      alert("An error occurred while deleting the application.");
    }
  };

  const handleArchiveApplication = async (
    applicationId: string,
    isArchived: boolean,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/archive`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isArchived: !isArchived }),
        },
      );

      if (response.ok) {
        // Refresh the applications list
        await refreshApplications();
      } else {
        console.error("Failed to archive/unarchive application");
        alert("Failed to update application. Please try again.");
      }
    } catch (error) {
      console.error("Error archiving application:", error);
      alert("An error occurred while updating the application.");
    }
  };

  const handleBulkAction = async (
    action: "archive" | "unarchive" | "delete",
  ) => {
    if (selectedApplications.length === 0) {
      alert("Please select applications first.");
      return;
    }

    const message =
      action === "archive"
        ? `Are you sure you want to archive ${selectedApplications.length} application(s)?`
        : action === "unarchive"
          ? `Are you sure you want to unarchive ${selectedApplications.length} application(s)?`
          : `Are you sure you want to delete ${selectedApplications.length} application(s)? This action cannot be undone.`;

    if (!confirm(message)) {
      return;
    }

    setBulkActionLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const promises = selectedApplications.map((id) => {
        if (action === "archive") {
          return fetch(`/api/applications/${id}/archive`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isArchived: true }),
          });
        } else if (action === "unarchive") {
          return fetch(`/api/applications/${id}/archive`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isArchived: false }),
          });
        } else {
          return fetch(`/api/applications/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      });

      await Promise.all(promises);
      setSelectedApplications([]);
      await refreshApplications();
    } catch (error) {
      console.error(`Error ${action}ing applications:`, error);
      alert(`An error occurred while ${action}ing applications.`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Mark application as opened when viewed - changes status from pending to under_review
  const markAsOpened = useCallback(async (applicationId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Update local state immediately for better UX
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                opened: true,
                status: app.status === "pending" ? "under_review" : app.status,
              }
            : app,
        ),
      );

      // Send API request to mark as opened and update status
      await fetch(`/api/applications/${applicationId}/mark-opened`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "under_review",
        }),
      });
    } catch (error) {
      console.error("Failed to mark application as opened:", error);
    }
  }, []);

  // Filter applications
  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      !searchTerm ||
      application.candidateName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      application.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Debug log the current state
  console.log(
    "Rendering with archiveMode:",
    archiveMode,
    "Applications count:",
    applications.length,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                Job Portal
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <div className="relative">
                <button
                  onClick={() => setShowJobsDropdown(!showJobsDropdown)}
                  className="text-gray-700 hover:text-gray-900 flex items-center space-x-1 focus:outline-none"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Jobs</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showJobsDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        href="/jobs"
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => setShowJobsDropdown(false)}
                      >
                        <Briefcase className="h-4 w-4" />
                        <span>View All Jobs</span>
                      </Link>
                      {((user.role &&
                        Array.isArray(user.role.permissions) &&
                        user.role.permissions.some(
                          (p) =>
                            p.module === "jobs" &&
                            p.action === "create" &&
                            p.granted,
                        )) ||
                        user.role?.name === "Administrator") && (
                        <Link
                          href="/jobs/new"
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setShowJobsDropdown(false)}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Job</span>
                        </Link>
                      )}
                      {((user.role &&
                        Array.isArray(user.role.permissions) &&
                        user.role.permissions.some(
                          (p) =>
                            p.module === "forms" &&
                            p.action === "create" &&
                            p.granted,
                        )) ||
                        user.role?.name === "Administrator") && (
                        <Link
                          href="/admin/form-builder"
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          onClick={() => setShowJobsDropdown(false)}
                        >
                          <FormInput className="h-4 w-4" />
                          <span>Create Form</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="/applications"
                className="text-indigo-600 font-medium flex items-center space-x-1"
              >
                <FileText className="h-4 w-4" />
                <span>Applications</span>
              </Link>
              {((user.role &&
                Array.isArray(user.role.permissions) &&
                user.role.permissions.some(
                  (p) =>
                    (p.module === "roles" ||
                      p.module === "users" ||
                      p.module === "settings" ||
                      p.module === "dashboard" ||
                      p.module === "email" ||
                      p.module === "forms") &&
                    p.action === "read" &&
                    p.granted,
                )) ||
                user.role?.name === "Administrator") && (
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user.name} ({user.role?.name || "Guest"})
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="mt-2 text-gray-600">
              Review and manage job applications
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={async () => {
                const newMode = archiveMode === "normal" ? "archive" : "normal";
                console.log(
                  "Button clicked - switching from:",
                  archiveMode,
                  "to:",
                  newMode,
                );

                // Update state immediately
                setArchiveMode(newMode);

                // Clear current applications immediately
                setApplications([]);
                setLoading(true);
                currentPageRef.current = 1;
                setHasMore(true);

                // Fetch data for the new mode directly
                try {
                  const token = localStorage.getItem("token");
                  if (!token) return;

                  const params = new URLSearchParams({
                    limit: itemsPerPage.toString(),
                    page: "1",
                  });

                  if (statusFilter) {
                    params.append("status", statusFilter);
                  }

                  const endpoint =
                    newMode === "archive"
                      ? `/api/applications/archive?${params.toString()}`
                      : `/api/applications?${params.toString()}`;

                  console.log("Fetching from endpoint:", endpoint);

                  const response = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                  });

                  if (response.ok) {
                    const data = await response.json();
                    const applicationsWithOpenedStatus = (
                      data.applications || []
                    ).map((app: Application) => ({
                      ...app,
                      opened: app.status !== "PENDING",
                    }));

                    setApplications(applicationsWithOpenedStatus);
                    setTotalApplications(data.total || 0);
                    setHasMore((data.page || 1) < (data.totalPages || 1));
                    currentPageRef.current = 2;

                    console.log(
                      "Data loaded successfully:",
                      applicationsWithOpenedStatus.length,
                      "applications",
                    );
                  }
                } catch (error) {
                  console.error("Error switching archive mode:", error);
                } finally {
                  setLoading(false);
                }
              }}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                archiveMode === "archive"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {archiveMode === "archive" ? (
                <>
                  <ArchiveX className="h-4 w-4 mr-2" />
                  View Active
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  View Archive
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-indigo-700">
                {selectedApplications.length} application(s) selected
              </span>
              <div className="flex space-x-2">
                {archiveMode === "normal" && (
                  <button
                    onClick={() => handleBulkAction("archive")}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center"
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Archive className="h-3 w-3 mr-1" />
                    )}
                    Archive Selected
                  </button>
                )}
                {archiveMode === "archive" && (
                  <button
                    onClick={() => handleBulkAction("unarchive")}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <ArchiveX className="h-3 w-3 mr-1" />
                    )}
                    Unarchive Selected
                  </button>
                )}
                {user.role?.name === "Administrator" && (
                  <button
                    onClick={() => handleBulkAction("delete")}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1" />
                    )}
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={() => setSelectedApplications([])}
                  className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Heading */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            {archiveMode === "archive" ? (
              <>
                <Archive className="h-6 w-6 text-orange-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Archived Applications
                </h1>
                <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  Archive View
                </span>
              </>
            ) : (
              <>
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Active Applications
                </h1>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  Active View
                </span>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Applications
              </label>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, position, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <Filter className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    console.log("Dropdown changed to:", e.target.value);
                    setStatusFilter(e.target.value);
                    // Remove manual refresh - useEffect will handle it automatically
                  }}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="SELECTED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <span className="text-sm text-gray-600">
                {filteredApplications.length}{" "}
                {archiveMode === "archive" ? "archived" : "active"} applications
              </span>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {initialLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">
                Loading applications...
              </span>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No applications found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {applications.length === 0
                  ? "No applications have been submitted yet."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedApplications.length ===
                            filteredApplications.length &&
                          filteredApplications.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApplications(
                              filteredApplications.map((app) => app.id),
                            );
                          } else {
                            setSelectedApplications([]);
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => {
                    const isArchived = application.isArchived || false; // Use actual archived status from application
                    const isUnread = application.status === "PENDING"; // PENDING = Unread (uppercase)
                    return (
                      <tr
                        key={application.id}
                        className={`hover:bg-gray-50 ${
                          isUnread
                            ? "bg-blue-50 border-l-4 border-blue-400"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(
                              application.id,
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedApplications((prev) => [
                                  ...prev,
                                  application.id,
                                ]);
                              } else {
                                setSelectedApplications((prev) =>
                                  prev.filter((id) => id !== application.id),
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="flex items-center">
                                <div
                                  className={`text-sm ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-900"}`}
                                >
                                  {application.candidateName}
                                </div>
                                {isUnread && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-sm ${isUnread ? "font-medium text-gray-600" : "text-gray-500"}`}
                              >
                                {application.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm ${isUnread ? "font-bold text-gray-900" : "text-gray-900"}`}
                          >
                            {application.position}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${
                              application.status === "PENDING"
                                ? "bg-blue-500 text-white border-blue-600"
                                : application.status === "UNDER_REVIEW"
                                  ? "bg-yellow-500 text-black border-yellow-600"
                                  : application.status === "SHORTLISTED"
                                    ? "bg-purple-500 text-white border-purple-600"
                                    : application.status === "SELECTED"
                                      ? "bg-green-500 text-white border-green-600"
                                      : application.status === "REJECTED"
                                        ? "bg-red-500 text-white border-red-600"
                                        : "bg-gray-500 text-white border-gray-600"
                            }`}
                          >
                            {application.status === "UNDER_REVIEW"
                              ? "UNDER REVIEW"
                              : application.status === "REJECTED"
                                ? "REJECTED"
                                : application.status === "PENDING"
                                  ? "PENDING"
                                  : application.status === "SELECTED"
                                    ? "SELECTED"
                                    : application.status === "SHORTLISTED"
                                      ? "SHORTLISTED"
                                      : application.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm ${isUnread ? "font-bold text-gray-900" : "text-gray-900"}`}
                          >
                            {new Date(
                              application.appliedAt,
                            ).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Link
                            href={`/applications/${application.id}`}
                            onClick={() => markAsOpened(application.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View Details
                          </Link>

                          <button
                            onClick={() =>
                              handleArchiveApplication(
                                application.id,
                                isArchived,
                              )
                            }
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            {isArchived ? "Unarchive" : "Archive"}
                          </button>

                          {user?.id && (
                            <button
                              onClick={() =>
                                handleDeleteApplication(
                                  application.id,
                                  application.candidateName,
                                )
                              }
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Manual Load More Section */}
              {applications.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {applications.length} of {totalApplications}{" "}
                      applications
                    </div>
                    <div className="flex items-center space-x-3">
                      {loading && (
                        <div className="flex items-center">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          <span className="ml-2 text-sm text-gray-600">
                            Loading...
                          </span>
                        </div>
                      )}
                      {hasMore && !loading && (
                        <button
                          onClick={loadMoreApplications}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Load More Applications
                        </button>
                      )}
                      {!hasMore && (
                        <span className="text-sm text-gray-500">
                          All applications loaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
