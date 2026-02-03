"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Plus,
  Edit,
  Pause,
  Play,
  Clock,
  ChevronDown,
  FormInput,
} from "lucide-react";
import { User } from "@/types/user";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  status: string;
  applicationsCount: number;
  createdAt: string;
}

interface Application {
  id: string;
  candidateName: string;
  position: string;
  status: string;
  appliedAt: string;
  email: string;
}

interface DashboardStats {
  pendingApplications: number;
  totalApplications: number;
  underReview: number;
  totalJobs: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    pendingApplications: 0,
    totalApplications: 0,
    underReview: 0,
    totalJobs: 0,
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>(
    [],
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobsDropdown, setShowJobsDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Verify token and get user info
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        // Fetch dashboard stats
        const statsResponse = await fetch("/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch recent applications
        const applicationsResponse = await fetch("/api/applications?limit=5", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          setRecentApplications(applicationsData.applications || []);
        }

        // Fetch jobs
        const jobsResponse = await fetch("/api/jobs?limit=5", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setJobs(jobsData.jobs || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    const init = async () => {
      await checkAuth();
      await fetchDashboardData();
    };
    init();
  }, [router]);

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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SELECTED":
        return "bg-green-100 text-green-800";
      case "SHORTLISTED":
        return "bg-green-100 text-green-800";
      case "INTERVIEW":
        return "bg-blue-100 text-blue-800";
      case "REJECTED":
      case "REJECT":
        return "bg-red-100 text-red-800";
      case "UNDER_REVIEW":
      case "UNDER-REVIEW":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to determine if application is "unread" (new/pending)
  const isUnreadApplication = (status: string) => {
    return status.toUpperCase() === "PENDING";
  };

  // Function to get the row styling based on read/unread status
  const getApplicationRowStyle = (status: string) => {
    if (isUnreadApplication(status)) {
      return "p-4 hover:bg-gray-50 transition-colors bg-blue-50 border-l-4 border-blue-400";
    }
    return "p-4 hover:bg-gray-50 transition-colors";
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Job Portal
              </h1>
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
                className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
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
                  Welcome, {user.name} ({user.role?.name || "Guest"})
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

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/applications?status=PENDING" className="group">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 cursor-pointer group-hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    Pending Applications
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.pendingApplications}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-blue-600 group-hover:text-blue-700">
                  View pending →
                </p>
              </div>
            </div>
          </Link>

          <Link href="/applications" className="group">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 cursor-pointer group-hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    Total Applications
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalApplications}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-green-600 group-hover:text-green-700">
                  View all →
                </p>
              </div>
            </div>
          </Link>

          <Link href="/applications?status=UNDER_REVIEW" className="group">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 cursor-pointer group-hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    Under Review
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.underReview}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-yellow-600 group-hover:text-yellow-700">
                  Review queue →
                </p>
              </div>
            </div>
          </Link>

          <Link href="/jobs" className="group">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 cursor-pointer group-hover:scale-105">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Briefcase className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    Total Jobs
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalJobs}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-purple-600 group-hover:text-purple-700">
                  Manage jobs →
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Recent Applications
              </h2>
              <Link
                href="/applications"
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {recentApplications.map((application) => (
                <div
                  key={application.id}
                  className={getApplicationRowStyle(application.status)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {isUnreadApplication(application.status) && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                            <Link
                              href={`/applications/${application.id}`}
                              className={`text-sm font-medium hover:text-indigo-600 transition-colors block truncate ${
                                isUnreadApplication(application.status)
                                  ? "text-gray-900 font-semibold"
                                  : "text-gray-700"
                              }`}
                            >
                              {application.candidateName}
                            </Link>
                          </div>
                          <p
                            className={`text-xs truncate ${
                              isUnreadApplication(application.status)
                                ? "text-gray-600"
                                : "text-gray-500"
                            }`}
                          >
                            {application.email}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}
                          >
                            {application.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <p
                          className={`text-xs truncate pr-2 ${
                            isUnreadApplication(application.status)
                              ? "text-gray-600 font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {application.position}
                        </p>
                        <Link
                          href={`/applications/${application.id}`}
                          className={`flex-shrink-0 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white transition-colors ${
                            isUnreadApplication(application.status)
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          {isUnreadApplication(application.status)
                            ? "Review"
                            : "View"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {recentApplications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm">No applications yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Job Openings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Job Openings
              </h2>
              <div className="flex space-x-2">
                {((user.role &&
                  Array.isArray(user.role.permissions) &&
                  user.role.permissions.some(
                    (p) =>
                      p.module === "jobs" && p.action === "create" && p.granted,
                  )) ||
                  user.role?.name === "Administrator") && (
                  <Link
                    href="/jobs/new"
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Job</span>
                  </Link>
                )}
                <Link
                  href="/jobs"
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors block truncate"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {job.department && `${job.department} • `}
                        {job.location}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-600">
                            {job.applicationsCount} application
                            {job.applicationsCount !== 1 ? "s" : ""}
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              job.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {((user.role &&
                            Array.isArray(user.role.permissions) &&
                            user.role.permissions.some(
                              (p) =>
                                p.module === "jobs" &&
                                p.action === "update" &&
                                p.granted,
                            )) ||
                            user.role?.name === "Administrator") && (
                            <>
                              <Link
                                href={`/jobs/${job.id}/edit`}
                                className="text-yellow-600 hover:text-yellow-700 transition-colors"
                                title="Edit job"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                className="text-gray-600 hover:text-gray-700 transition-colors"
                                title={
                                  job.status === "ACTIVE"
                                    ? "Pause job"
                                    : "Resume job"
                                }
                              >
                                {job.status === "ACTIVE" ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                          <Link
                            href={`/jobs/${job.id}`}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm">No jobs posted yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
