"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Save, ArrowLeft } from "lucide-react";
import TiptapEditor from "@/components/TiptapEditor";
import Header from "@/components/Header";
import { User } from "@/types/user";
import { useCallback } from "react";

export default function NewJobPage() {
  interface Form {
    id: string;
    name: string;
    isDefault: boolean;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    position: "",
    description: "",
    status: "DRAFT",
    formId: "",
    imageUrl: "",
    bannerImageUrl: "",
    salary: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string>("");
  const [availableForms, setAvailableForms] = useState([]);
  const [user, setUser] = useState<User | null>(null);

  const entryLevels = [
    "Entry Level",
    "Junior Level",
    "Mid Level",
    "Managerial Level",
    "Senior / Strategic Level",
    "Leadership / C-Suite",
  ];
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const [meRes, formsRes] = await Promise.all([
          fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/forms", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (meRes.ok) {
          const userData = await meRes.json();
          setUser(userData);
        }

        if (formsRes.ok) {
          const forms = await formsRes.json();
          setAvailableForms(forms);
          const defaultForm = forms.find((form: Form) => form.isDefault);
          if (defaultForm)
            setFormData((prev) => ({ ...prev, formId: defaultForm.id }));
        }
      } catch (error) {
        console.error("Failed to fetch forms or user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/svg+xml",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(
          "Invalid file type. Only PNG, JPG, JPEG, and SVG images are allowed.",
        );
        e.target.value = "";
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/svg+xml",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(
          "Invalid file type. Only PNG, JPG, JPEG, and SVG images are allowed.",
        );
        e.target.value = "";
        return;
      }

      setBannerImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Validate form data
    if (
      !formData.title.trim() ||
      !formData.position ||
      !formData.description.trim() ||
      !formData.formId
    ) {
      setError("Please fill in all required fields");
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Upload job card image if provided
      let uploadedImageUrl = formData.imageUrl;
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);

        const uploadResponse = await fetch("/api/upload/job-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: imageFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedImageUrl = uploadData.imageUrl;
        }
      }

      // Upload banner image if provided
      let uploadedBannerImageUrl = formData.bannerImageUrl;
      if (bannerImageFile) {
        const bannerFormData = new FormData();
        bannerFormData.append("image", bannerImageFile);

        const bannerUploadResponse = await fetch("/api/upload/job-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: bannerFormData,
        });

        if (bannerUploadResponse.ok) {
          const bannerUploadData = await bannerUploadResponse.json();
          uploadedBannerImageUrl = bannerUploadData.imageUrl;
        }
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: uploadedImageUrl,
          bannerImageUrl: uploadedBannerImageUrl,
        }),
      });

      if (response.ok) {
        const job = await response.json();
        router.push(`/jobs/${job.id}`);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create job");
      }
    } catch (error) {
      console.error("Create job error:", error);
      setError("An error occurred while creating the job");
    } finally {
      setSaving(false);
    }
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

  return (
    <>
      <Header
        title="Create New Job - Job Portal"
        description="Create a new job posting with detailed requirements and application form."
        keywords="create job, job posting, employment, hiring"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Page Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href="/jobs"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New Job</h1>
            <p className="mt-2 text-gray-600">
              Fill out the form below to create a new job opening
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Job Information
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Job Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter job title (e.g., Senior React Developer, Marketing Manager)"
                />
              </div>

              <div>
                <label
                  htmlFor="position"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Entry Level *
                </label>
                <select
                  id="position"
                  name="position"
                  required
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select an entry level</option>
                  {entryLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="salary"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Salary Range
                </label>
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="₹50,000 - ₹80,000 or $60,000 - $90,000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the salary range with currency symbol (e.g., ₹50,000 -
                  ₹80,000). Leave blank if not applicable.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Card Image <span className="text-gray-500 font-normal ml-1">(1579 x 1053 px)</span>
                </label>
                {imagePreview && (
                  <div className="relative w-full h-48 mb-3 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Job preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Upload Card Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  This image will appear on the job card in the careers page.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Details Banner Image <span className="text-gray-500 font-normal ml-1">(1200 x 160 px)</span>
                </label>
                {bannerImagePreview && (
                  <div className="relative w-full h-48 mb-3 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={bannerImagePreview}
                      alt="Banner preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerImagePreview("");
                        setBannerImageFile(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Upload Banner Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  This image will appear as the banner on the job details page
                  (similar to careers page banner).
                </p>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Job Role *
                </label>
                <div className="mt-1">
                  <TiptapEditor
                    value={formData.description || ""}
                    onChange={(value: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: value || "",
                      }))
                    }
                    placeholder="Enter detailed job description with requirements, responsibilities, and benefits..."
                    height={250}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Use the toolbar to format your job description with headings,
                  lists, and styling.
                </p>
              </div>

              <div>
                <label
                  htmlFor="formId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Assign Job Form *
                </label>
                <select
                  id="formId"
                  name="formId"
                  required
                  value={formData.formId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, formId: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select application form</option>
                  {availableForms.map((form: Form) => (
                    <option key={form.id} value={form.id}>
                      {form.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the application form that candidates will fill out for
                  this position.
                  {user &&
                  user.role &&
                  Array.isArray(user.role.permissions) &&
                  user.role.permissions.some(
                    (p) =>
                      p.module === "forms" &&
                      p.action === "create" &&
                      p.granted,
                  ) ? (
                    <span>
                      {" "}
                      Create{" "}
                      <Link
                        href="/admin/form-builder"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        a new form
                      </Link>
                    </span>
                  ) : null}
                </p>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Job Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border text-gray-600 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="DRAFT">Draft (Not Published)</option>
                  <option value="ACTIVE">
                    Published (Accepting Applications)
                  </option>
                  <option value="PAUSED">Paused (Temporarily Closed)</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <Link
                href="/jobs"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Creating..." : "Create Job"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
