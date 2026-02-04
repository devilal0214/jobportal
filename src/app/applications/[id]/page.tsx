"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Star, Download, CheckCircle, AlertCircle } from "lucide-react";

interface FormFieldData {
  id: string;
  label: string;
  fieldType: string;
  fieldName?: string;
  value: string | string[];
}

interface Application {
  id: string;
  candidateName: string;
  email: string;
  phone?: string;
  position: string;
  jobTitle: string;
  company: string;
  status: string;
  createdAt: string;
  formData: FormFieldData[];
  portfolioLinks?: string[];
  resumePath?: string;
  resume?: string;
  candidateCity?: string;
  candidateState?: string;
  candidateCountry?: string;
  candidateLatitude?: string;
  candidateLongitude?: string;
  candidateIP?: string;
}

interface BasicInfoItem {
  label: string;
  value: string | string[];
}

interface QAItem {
  question: string;
  answer: string;
}

interface ToastMessage {
  type: "success" | "error";
  message: string;
  show: boolean;
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Change status");
  const [toast, setToast] = useState<ToastMessage>({
    type: "success",
    message: "",
    show: false,
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const resolvedParams = use(params);

  useEffect(() => {
    const updateApplicationStatus = async (apiStatus: string) => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return false;

        const response = await fetch(`/api/applications/${resolvedParams.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: apiStatus }),
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.error("Status update error:", error);
      }
      return false;
    };

    const fetchApplication = async () => {
      try {
        const response = await fetch(`/api/applications/${resolvedParams.id}`);
        if (response.ok) {
          const data = await response.json();
          setApplication(data);

          // Auto-update status from PENDING to UNDER_REVIEW when viewed
          if (data.status === "PENDING") {
            const success = await updateApplicationStatus("UNDER_REVIEW");
            if (success) {
              // Update the local state to reflect the change
              data.status = "UNDER_REVIEW";
              setApplication(data);
            }
            setSelectedStatus("Change status"); // Default to change status option
          } else {
            // Always start with "Change status" option regardless of current status
            setSelectedStatus("Change status");
          }
        } else {
          setError("Application not found");
        }
      } catch {
        setError("Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.id) {
      fetchApplication();
    }
  }, [resolvedParams.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdatingStatus) return;

    // If "Change status" is selected, don't do anything
    if (newStatus === "Change status") {
      return;
    }

    // If "Rejected" is selected, show confirmation dialog
    if (newStatus === "Rejected") {
      setPendingStatus(newStatus);
      setShowConfirmDialog(true);
      return;
    }

    // For other statuses, proceed directly
    await updateStatus(newStatus);
  };

  const updateStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      // Map display status to API status
      let apiStatus = "";
      switch (newStatus) {
        case "Pending":
          apiStatus = "PENDING";
          break;
        case "Under Review":
          apiStatus = "UNDER_REVIEW";
          break;
        case "Shortlisted":
          apiStatus = "SHORTLISTED";
          break;
        case "Selected":
          apiStatus = "SELECTED";
          break;
        case "Rejected":
          apiStatus = "REJECTED";
          break;
        default:
          apiStatus = "PENDING";
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setToast({ type: "error", message: "Not authenticated", show: true });
        setIsUpdatingStatus(false);
        return;
      }

      const response = await fetch(`/api/applications/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: apiStatus }),
      });

      if (response.ok) {
        // Update the application state locally
        setApplication((prev) =>
          prev ? { ...prev, status: apiStatus } : null,
        );
        setSelectedStatus("Change status"); // Reset to default after update
        setToast({
          type: "success",
          message: `Application status updated to "${newStatus}" successfully!`,
          show: true,
        });

        // Hide toast after 3 seconds
        setTimeout(() => {
          setToast((prev) => ({ ...prev, show: false }));
        }, 3000);
      } else {
        const errorData = await response.json();
        setToast({
          type: "error",
          message: errorData.error || "Failed to update status",
          show: true,
        });

        // Hide toast after 5 seconds
        setTimeout(() => {
          setToast((prev) => ({ ...prev, show: false }));
        }, 5000);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setToast({
        type: "error",
        message: "Network error: Failed to update status",
        show: true,
      });

      // Hide toast after 5 seconds
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 5000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmReject = async () => {
    setShowConfirmDialog(false);
    await updateStatus(pendingStatus);
    setPendingStatus("");
  };

  const handleCancelReject = () => {
    setShowConfirmDialog(false);
    setPendingStatus("");
    setSelectedStatus("Change status"); // Reset dropdown to default
  };

  const getBasicInfoFields = (): BasicInfoItem[] => {
    if (!application) return [];
    const basicFields: BasicInfoItem[] = [];
    let experienceAdded = false; // Flag to prevent duplicate experience fields

    // Find relevant fields for basic info
    application.formData.forEach((field) => {
      const label = field.label.toLowerCase();

      // Experience fields with priority order (only add the first one found)
      if (!experienceAdded) {
        if (label.includes("years of") && label.includes("experience")) {
          basicFields.push({
            label: "Years of Experience",
            value: field.value,
          });
          experienceAdded = true;
        } else if (
          label.includes("professional") &&
          label.includes("experience")
        ) {
          basicFields.push({
            label: "Professional Experience",
            value: field.value,
          });
          experienceAdded = true;
        } else if (
          label.includes("work experience") ||
          label.includes("working experience")
        ) {
          basicFields.push({
            label: "Work Experience",
            value: field.value,
          });
          experienceAdded = true;
        } else if (label.includes("total experience")) {
          basicFields.push({
            label: "Total Experience",
            value: field.value,
          });
          experienceAdded = true;
        } else if (
          label.includes("experience") &&
          !label.includes("describe") &&
          !label.includes("explain") &&
          !label.includes("team") &&
          !label.includes("leading")
        ) {
          basicFields.push({
            label: "Experience",
            value: field.value,
          });
          experienceAdded = true;
        }
      }
      // Position/Role fields
      else if (
        label.includes("current position") ||
        label.includes("current role")
      ) {
        basicFields.push({
          label: "Current Position",
          value: field.value,
        });
      } else if (label.includes("position") || label.includes("designation")) {
        basicFields.push({
          label: "Position",
          value: field.value,
        });
      }
      // Education fields
      else if (
        label.includes("education") ||
        label.includes("qualification") ||
        label.includes("degree")
      ) {
        basicFields.push({
          label: "Education",
          value: field.value,
        });
      }
      // Salary fields
      else if (
        label.includes("current salary") ||
        label.includes("present salary")
      ) {
        basicFields.push({
          label: "Current Salary",
          value: field.value,
        });
      } else if (
        label.includes("expected salary") ||
        label.includes("salary expectation")
      ) {
        basicFields.push({
          label: "Expected Salary",
          value: field.value,
        });
      } else if (label.includes("salary")) {
        basicFields.push({
          label: "Salary",
          value: field.value,
        });
      }
      // Location fields - only add from form data if it exists and is not localhost
      else if (
        label.includes("location") ||
        label.includes("city") ||
        (label.includes("address") && !label.includes("email"))
      ) {
        // Only add location from form data if it's a real location (not development environment)
        if (
          typeof field.value === "string" &&
          field.value.trim() !== "" &&
          !field.value.toLowerCase().includes("localhost") &&
          !field.value.toLowerCase().includes("development environment") &&
          !field.value.includes("@")
        ) {
          // Exclude email addresses
          basicFields.push({
            label: "Location",
            value: field.value,
          });
        }
      }
      // Notice period
      else if (label.includes("notice") && label.includes("period")) {
        basicFields.push({
          label: "Notice Period",
          value: field.value,
        });
      }
      // Availability
      else if (label.includes("availability") || label.includes("joining")) {
        basicFields.push({
          label: "Availability",
          value: field.value,
        });
      }
    });

    return basicFields;
  };

  const getSkillsFields = (): FormFieldData[] => {
    if (!application) return [];
    const skillsFields: FormFieldData[] = [];

    application.formData.forEach((field) => {
      // Include fields that are SKILLS type OR contain skill rating data
      if (
        field.fieldType === "SKILLS" ||
        // Check for skills data from embed forms
        (field.label.toLowerCase().includes("skill") &&
          typeof field.value === "string" &&
          (field.value.startsWith("[") || field.value.startsWith("{"))) ||
        // Check for skills with rating data
        (typeof field.value === "string" &&
          field.value.startsWith("[") &&
          field.value.includes("skill") &&
          field.value.includes("rating")) ||
        // Check if there's a corresponding fieldType field indicating this is SKILLS
        application.formData.some(
          (f) => f.label === `${field.label}_fieldType` && f.value === "SKILLS",
        )
      ) {
        // Create a proper FormFieldData object with SKILLS fieldType
        const skillField: FormFieldData = {
          ...field,
          fieldType: "SKILLS",
        };
        skillsFields.push(skillField);
      }
    });

    return skillsFields;
  };

  const getContactAndMetadata = (): BasicInfoItem[] => {
    if (!application) return [];
    const contactFields: BasicInfoItem[] = [];

    // Always show IP-based location data (even localhost for development)
    if (
      application.candidateCity ||
      application.candidateState ||
      application.candidateCountry ||
      application.candidateIP
    ) {
      // Check if this is localhost/development data
      const isLocalhostData =
        application.candidateIP === "::1" ||
        application.candidateIP === "127.0.0.1" ||
        application.candidateCity?.toLowerCase().includes("development") ||
        application.candidateState?.toLowerCase().includes("local") ||
        application.candidateCountry?.toLowerCase().includes("localhost");

      if (
        application.candidateCity ||
        application.candidateState ||
        application.candidateCountry
      ) {
        const locationParts = [];
        if (application.candidateCity)
          locationParts.push(application.candidateCity);
        if (application.candidateState)
          locationParts.push(application.candidateState);
        if (application.candidateCountry)
          locationParts.push(application.candidateCountry);

        if (locationParts.length > 0) {
          contactFields.push({
            label: isLocalhostData
              ? "Location (Dev Environment)"
              : "Location (IP-based)",
            value: locationParts.join(", "),
          });
        }
      }

      // Always show IP address for admin reference
      if (application.candidateIP) {
        contactFields.push({
          label: "IP Address",
          value: isLocalhostData
            ? `${application.candidateIP} (localhost)`
            : application.candidateIP,
        });
      }

      // Show coordinates if available (production only)
      if (
        application.candidateLatitude &&
        application.candidateLongitude &&
        !isLocalhostData
      ) {
        contactFields.push({
          label: "Coordinates",
          value: `${application.candidateLatitude}, ${application.candidateLongitude}`,
        });
      }
    }

    // Check for user-provided location in form data
    let userLocationFound = false;
    application.formData.forEach((field) => {
      const label = field.label.toLowerCase();

      if (
        !userLocationFound &&
        (label.includes("location") ||
          label.includes("city") ||
          label.includes("state") ||
          label.includes("country") ||
          (label.includes("address") && !label.includes("email"))) &&
        !label.includes("email") &&
        !label.includes("portfolio") &&
        typeof field.value === "string" &&
        field.value.trim() !== ""
      ) {
        contactFields.push({
          label: "User Provided Location",
          value: field.value,
        });
        userLocationFound = true;
      }
    });

    application.formData.forEach((field) => {
      const label = field.label.toLowerCase();

      // LinkedIn or social profiles
      if (
        label.includes("linkedin") ||
        (label.includes("social") && !label.includes("security"))
      ) {
        contactFields.push({
          label: "LinkedIn",
          value: field.value,
        });
      }
      // GitHub or professional profiles (from portfolio links)
      else if (
        label.includes("github") ||
        (label.includes("portfolio") && Array.isArray(field.value))
      ) {
        // Handle portfolio links array
        if (Array.isArray(field.value) && field.value.length > 0) {
          field.value.forEach((link, index) => {
            if (typeof link === "string" && link.trim() !== "") {
              const linkLabel = link.includes("github")
                ? "GitHub"
                : link.includes("linkedin")
                  ? "LinkedIn"
                  : `Portfolio ${index + 1}`;
              contactFields.push({
                label: linkLabel,
                value: link,
              });
            }
          });
        }
      }
      // Timezone
      else if (label.includes("timezone") || label.includes("time zone")) {
        contactFields.push({
          label: "Timezone",
          value: field.value,
        });
      }
      // Preferred contact method
      else if (
        label.includes("preferred contact") ||
        label.includes("contact preference")
      ) {
        contactFields.push({
          label: "Preferred Contact",
          value: field.value,
        });
      }
      // Work authorization or visa status
      else if (
        label.includes("work authorization") ||
        label.includes("visa") ||
        label.includes("sponsorship")
      ) {
        contactFields.push({
          label: "Work Authorization",
          value: field.value,
        });
      }
    });

    return contactFields;
  };

  const getQuestionsAndAnswers = (): QAItem[] => {
    if (!application) return [];
    const qaFields: QAItem[] = [];

    application.formData.forEach((field) => {
      const label = field.label.toLowerCase();

      // Skip basic contact info and file fields only
      if (
        (label.includes("name") &&
          (label.includes("full") ||
            label.includes("first") ||
            label.includes("last"))) ||
        label.includes("email") ||
        label.includes("phone") ||
        label.includes("mobile") ||
        label.includes("contact number") ||
        field.fieldType === "FILE"
      ) {
        return;
      }

      // Handle different field types appropriately
      if (typeof field.value === "string") {
        // Skip if it's a file JSON object
        if (field.value.startsWith("{") && field.value.includes("fileName")) {
          return; // Skip file upload JSON
        }

        // Skip if it's skills JSON data (will be handled in skills section)
        if (
          field.fieldType === "SKILLS" ||
          (field.value.startsWith("[") &&
            field.value.includes("skill") &&
            field.value.includes("rating")) ||
          label.includes("skill")
        ) {
          return;
        }

        // Include all meaningful responses (reduced minimum length)
        if (field.value.trim().length > 0) {
          qaFields.push({
            question: field.label,
            answer: field.value,
          });
        }
      } else if (Array.isArray(field.value)) {
        // Handle array values (like multiple selections)
        if (
          field.value.length > 0 &&
          field.fieldType !== "SKILLS" &&
          !label.includes("skill")
        ) {
          qaFields.push({
            question: field.label,
            answer: field.value.join(", "),
          });
        }
      }
    });

    return qaFields;
  };

  const getFileFields = (): FormFieldData[] => {
    if (!application) return [];
    const fileFields: FormFieldData[] = [];

    application.formData.forEach((field) => {
      // Check for FILE field type or fields with file data format
      if (
        field.fieldType === "FILE" ||
        // Check for JSON file data format (new embed format)
        (typeof field.value === "string" &&
          field.value.startsWith("{") &&
          field.value.includes("fileName")) ||
        // Check for resume/upload fields that contain file data
        ((field.label.toLowerCase().includes("resume") ||
          field.label.toLowerCase().includes("upload") ||
          field.label.toLowerCase().includes("cv")) &&
          typeof field.value === "string" &&
          field.value.trim() !== "" &&
          // Make sure it's not just a simple text field
          (field.value.startsWith("{") || field.value.includes(".")))
      ) {
        fileFields.push(field);
      }
    });

    return fileFields;
  };

  const renderFileField = (field: FormFieldData) => {
    if (typeof field.value === "string") {
      // Try to parse as JSON first (new format)
      if (field.value.startsWith("{")) {
        try {
          const fileData = JSON.parse(field.value);
          if (fileData.fileName && fileData.originalName) {
            return (
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-700 text-sm">{field.label}</span>
                <a
                  href={`/api/download/${encodeURIComponent(fileData.fileName)}`}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                  download
                >
                  <Download className="h-4 w-4" />
                  <span>{fileData.originalName}</span>
                </a>
              </div>
            );
          }
        } catch {
          // Fall through to handle as simple filename
        }
      }

      // Handle simple filename format (legacy format or direct filename)
      if (field.value.trim() !== "") {
        // Check if it looks like a timestamp filename (from embed forms)
        const isTimestampFile = /^\d+_/.test(field.value);
        const filename = isTimestampFile ? field.value : field.value;

        // Extract original name - if it's a timestamp filename, extract the part after timestamp
        let displayName = field.value;
        if (isTimestampFile) {
          const parts = field.value.split("_");
          if (parts.length > 1) {
            displayName = parts.slice(1).join("_");
          }
        }

        return (
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700 text-sm">{field.label}</span>
            <a
              href={`/api/download/${encodeURIComponent(filename)}`}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
              download
            >
              <Download className="h-4 w-4" />
              <span>{displayName}</span>
            </a>
          </div>
        );
      }
    }

    // Fallback for any other format
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-gray-700 text-sm">{field.label}</span>
        <span className="text-gray-500 text-sm">File uploaded</span>
      </div>
    );
  };

  const renderSkillRating = (
    skillData: string | { skill: string; rating: number },
  ) => {
    // If it's a skill with rating data
    if (typeof skillData === "object" && skillData.skill && skillData.rating) {
      return (
        <div className="flex items-center space-x-2 py-1">
          <span className="text-sm font-medium text-gray-900 min-w-0 flex-1">
            {skillData.skill}
          </span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${star <= skillData.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            ({skillData.rating}/5)
          </span>
        </div>
      );
    }

    // For simple skill names - try to parse if it's a JSON string
    let skillName = "";
    let rating = 0;

    if (typeof skillData === "string") {
      // Check if it's a JSON string with skill and rating
      if (skillData.startsWith("{") || skillData.startsWith("[")) {
        try {
          const parsed = JSON.parse(skillData);
          if (parsed.skill && parsed.rating) {
            skillName = parsed.skill;
            rating = parsed.rating;
          } else if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            parsed[0].skill
          ) {
            // Handle array of skills - render the first one (this shouldn't happen in this context)
            skillName = parsed[0].skill;
            rating = parsed[0].rating || 0;
          } else {
            skillName = skillData;
            rating = 0;
          }
        } catch {
          skillName = skillData;
          rating = 0;
        }
      } else {
        skillName = skillData;
        rating = 0;
      }
    } else {
      skillName = String(skillData);
      rating = 0;
    }

    return (
      <div className="flex items-center space-x-2 py-1">
        <span className="text-sm font-medium text-gray-900 min-w-0 flex-1">
          {skillName}
        </span>
        {rating > 0 ? (
          <>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              ({rating}/5)
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400">No rating provided</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Not Found
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/applications"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const basicInfo = getBasicInfoFields();
  const skillsFields = getSkillsFields();
  const contactMetadata = getContactAndMetadata();
  const questionsAndAnswers = getQuestionsAndAnswers();
  const fileFields = getFileFields();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center">
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold text-gray-900">Job Portal</h1>
            <nav className="flex space-x-8">
              <Link href="/jobs" className="text-gray-700 hover:text-gray-900">
                Jobs
              </Link>
              <Link
                href="/applications"
                className="text-gray-700 hover:text-gray-900"
              >
                Job Applications
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-gray-900">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Application Header */}
      <div className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-800">
                Apply for:{" "}
                <span className="font-semibold">{application.jobTitle}</span> |{" "}
                {application.company}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Status</span>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  application.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : application.status === "UNDER_REVIEW"
                      ? "bg-blue-100 text-blue-800"
                      : application.status === "SHORTLISTED"
                        ? "bg-green-100 text-green-800"
                        : application.status === "SELECTED"
                          ? "bg-green-100 text-green-800"
                          : application.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                }`}
              >
                {application.status.replace("_", " ")}
              </span>
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="status"
                  className="text-sm font-medium text-gray-700"
                >
                  Update:
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdatingStatus}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="Change status">Change status</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
                {isUpdatingStatus && (
                  <span className="text-xs text-gray-500">Updating...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Candidate Header */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {application.candidateName}
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Applying for {application.jobTitle}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                {application.resumePath && (
                  <a
                    href={`/api/download/${encodeURIComponent(application.resumePath.split("/").pop() || "")}`}
                    className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 flex items-center space-x-2"
                    download
                  >
                    <Download className="h-4 w-4" />
                    <span>Download CV</span>
                  </a>
                )}
                {application.portfolioLinks &&
                  application.portfolioLinks.length > 0 && (
                    <div className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium bg-gray-50">
                      {application.portfolioLinks.length} Portfolio Link
                      {application.portfolioLinks.length > 1 ? "s" : ""}
                    </div>
                  )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Info
              </h3>
              <div className="space-y-3">
                {basicInfo.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-1"
                  >
                    <span className="text-gray-600 text-sm">{item.label}</span>
                    <span className="text-gray-900 font-medium text-sm text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Info
              </h3>
              <div className="space-y-2">
                <p className="text-gray-900 text-sm">{application.email}</p>
                {application.phone && (
                  <p className="text-gray-900 text-sm">{application.phone}</p>
                )}
                {contactMetadata.length > 0 && (
                  <>
                    {contactMetadata.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600 text-sm">
                          {item.label}:
                        </span>
                        <span className="text-gray-900 text-sm text-right">
                          {typeof item.value === "string" &&
                          item.value.startsWith("http") ? (
                            <a
                              href={item.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 break-all"
                            >
                              {item.value}
                            </a>
                          ) : Array.isArray(item.value) ? (
                            item.value.join(", ")
                          ) : (
                            item.value
                          )}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Portfolio Links */}
            {application.portfolioLinks &&
              application.portfolioLinks.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Portfolio Links
                  </h3>
                  <div className="space-y-3">
                    {application.portfolioLinks.map((link, index) => {
                      // Handle both old format (string) and new format (object with name and url)
                      const isOldFormat = typeof link === "string";
                      const linkData = isOldFormat
                        ? { name: "Portfolio Link", url: link }
                        : link;

                      return (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {linkData.name}
                                </span>
                              </div>
                              <a
                                href={linkData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm break-all"
                              >
                                {linkData.url}
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Skills */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Skills
              </h3>
              <div className="space-y-2">
                {skillsFields.length > 0 ? (
                  skillsFields
                    .map((field, index) => {
                      // Handle SKILLS field type with ratings
                      if (
                        field.fieldType === "SKILLS" &&
                        typeof field.value === "string"
                      ) {
                        try {
                          const skillRatings = JSON.parse(field.value);
                          if (Array.isArray(skillRatings)) {
                            return skillRatings.map(
                              (skillRating, skillIndex) => (
                                <div key={`${index}-${skillIndex}`}>
                                  {renderSkillRating(skillRating)}
                                </div>
                              ),
                            );
                          } else {
                            // Single skill object
                            return (
                              <div key={index}>
                                {renderSkillRating(skillRatings)}
                              </div>
                            );
                          }
                        } catch (e) {
                          console.error("Error parsing skills JSON:", e); // Debug log
                          // If parsing fails, treat as regular text
                          return (
                            <div key={index}>
                              {renderSkillRating(field.value)}
                            </div>
                          );
                        }
                      }
                      // Handle string value that might be JSON
                      else if (
                        typeof field.value === "string" &&
                        field.value.startsWith("[")
                      ) {
                        try {
                          const skillRatings = JSON.parse(field.value);
                          console.log("Parsed string skills:", skillRatings); // Debug log
                          if (Array.isArray(skillRatings)) {
                            return skillRatings.map(
                              (skillRating, skillIndex) => (
                                <div key={`${index}-${skillIndex}`}>
                                  {renderSkillRating(skillRating)}
                                </div>
                              ),
                            );
                          }
                        } catch (e) {
                          console.error("Error parsing string skills:", e); // Debug log
                          return (
                            <div key={index}>
                              {renderSkillRating(field.value)}
                            </div>
                          );
                        }
                      }
                      // Handle array of skills (legacy support)
                      else if (Array.isArray(field.value)) {
                        return field.value.map(
                          (skill: string, skillIndex: number) => (
                            <div key={`${index}-${skillIndex}`}>
                              {renderSkillRating(skill)}
                            </div>
                          ),
                        );
                      }
                      // Handle single skill value
                      else {
                        return (
                          <div key={index}>
                            {renderSkillRating(field.value as string)}
                          </div>
                        );
                      }
                    })
                    .flat()
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      No skills information provided in this application.
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      Debug: Found {application?.formData?.length || 0} total
                      form fields
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Questions and Answers */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Questions and Answers
              </h3>
              <div className="space-y-6">
                {questionsAndAnswers.length > 0 ? (
                  questionsAndAnswers.map((qa, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                    >
                      <h4 className="font-semibold text-gray-900 mb-3 text-base">
                        {qa.question}
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {qa.answer}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      No additional questions were answered in this application.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File Uploads */}
            {fileFields.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Uploaded Files
                </h3>
                <div className="space-y-3">
                  {fileFields.map((field, index) => (
                    <div key={index}>{renderFileField(field)}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Rejection */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Confirm Rejection
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Do you really want to reject this application? This action will
                notify the candidate and cannot be easily undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelReject}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Yes, Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
