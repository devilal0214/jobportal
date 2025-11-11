"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Briefcase, MapPin, Clock, Send } from "lucide-react";
import TagsInput from "@/components/TagsInput";
import SkillsWithRatings from "@/components/SkillsWithRatings";

interface FormField {
  id: string;
  label: string;
  fieldType: string;
  placeholder?: string;
  options?: string[] | string | null;
  cssClass?: string;
  fieldId?: string;
  isRequired: boolean;
  order: number;
}

interface SkillRating {
  skill: string;
  rating: number;
}

interface Job {
  id: string;
  title: string;
  position: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  experienceLevel: string;
  createdAt: string;
  form?: {
    id: string;
    name: string;
    description?: string;
    fields: FormField[];
  } | null;
}

function parseOptions(options: unknown): string[] {
  if (!options) return [];
  if (Array.isArray(options)) return options as string[];
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      
      return options
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export default function EmbedJobPage() {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<
    Record<string, string | string[] | SkillRating[]>
  >({});
  const [fileData, setFileData] = useState<Record<string, File>>({});
  const [portfolioLinks, setPortfolioLinks] = useState<
    { name: string; url: string }[]
  >([{ name: "", url: "" }]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // -------- Load job --------
  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) {
          setError("Job not found");
          return;
        }
        const data = await res.json();

        // Ensure form fields sorted
        if (data.form?.fields?.length) {
          data.form.fields = [...data.form.fields].sort(
            (a: FormField, b: FormField) => a.order - b.order
          );
        }

        setJob(data);

        
        if (data.form?.fields) {
          const initial: Record<string, string | string[] | SkillRating[]> = {};
          data.form.fields.forEach((field: FormField) => {
            if (field.fieldType === "TAGS" || field.fieldType === "CHECKBOX") {
              initial[field.id] = [];
            } else if (field.fieldType === "SKILLS") {
              initial[field.id] = [];
            } else {
              initial[field.id] = "";
            }
          });
          setFormData(initial);
        }
      } catch {
        setError("Failed to load job");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

 
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!job?.form?.fields) return errs;

    job.form.fields.forEach((field) => {
      if (!field.isRequired) return;

      const value = formData[field.id];

      if (field.fieldType === "SKILLS") {
        const skills = value as SkillRating[] | undefined;
        if (!skills || skills.length === 0) {
          errs[field.id] = `${field.label} is required`;
        } else if (skills.some((s) => !s.rating || s.rating === 0)) {
          errs[field.id] = `Please rate all skills in ${field.label}`;
        }
        return;
      }

      const empty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0);

      if (empty) {
        errs[field.id] = `${field.label} is required`;
      }
    });

    return errs;
  };

  
  const updateFormData = (
    fieldId: string,
    value: string | string[] | SkillRating[]
  ) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => ({ ...prev, [fieldId]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length) {
      setValidationErrors(errs);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const sourceInfo = {
        domain:
          typeof window !== "undefined"
            ? document.referrer || window.location.hostname
            : "",
        pageUrl:
          typeof window !== "undefined"
            ? document.referrer || window.location.href
            : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      };

      const fieldLabels: Record<string, string> = {};
      job?.form?.fields.forEach((f) => {
        fieldLabels[f.id] = f.label;
      });

      const fd = new FormData();
      fd.append("jobId", String(id));
      fd.append("formData", JSON.stringify(formData));
      fd.append("sourceInfo", JSON.stringify(sourceInfo));
      fd.append("fieldLabels", JSON.stringify(fieldLabels));

      const validPortfolio = portfolioLinks.filter(
        (l) => l.name.trim() && l.url.trim()
      );
      fd.append("portfolioLinks", JSON.stringify(validPortfolio));

      Object.entries(fileData).forEach(([fieldId, file]) => {
        fd.append(`file_${fieldId}`, file);
      });

      const res = await fetch("/api/applications/embed", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit application");
      }

      setSuccess(true);
      setFormData({});
      setFileData({});
      setPortfolioLinks([{ name: "", url: "" }]);
    } catch (err: any) {
      setError(err?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  
  const renderField = (field: FormField) => {
    const rawVal = formData[field.id];
    const value =
      rawVal ??
      (field.fieldType === "TAGS" ||
      field.fieldType === "CHECKBOX" ||
      field.fieldType === "SKILLS"
        ? []
        : "");
    const hasError = !!validationErrors[field.id];
    const base =
      `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ` +
      (hasError ? "border-red-500 " : "border-gray-300 ") +
      (field.cssClass || "");
    const opts = parseOptions(field.options);

    switch (field.fieldType) {
      case "TEXT":
        return (
          <input
            type="text"
            id={field.fieldId || field.id}
            value={value as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={base}
            required={field.isRequired}
          />
        );
      case "EMAIL":
        return (
          <input
            type="email"
            id={field.fieldId || field.id}
            value={value as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={base}
            required={field.isRequired}
          />
        );
      case "PHONE":
        return (
          <input
            type="tel"
            id={field.fieldId || field.id}
            value={value as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={base}
            required={field.isRequired}
          />
        );
      case "TEXTAREA":
        return (
          <textarea
            id={field.fieldId || field.id}
            value={value as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={base}
            rows={3}
            required={field.isRequired}
          />
        );
      case "SELECT":
        return (
          <select
            id={field.fieldId || field.id}
            value={value as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={base}
            required={field.isRequired}
          >
            <option value="">{field.placeholder || "Select an option"}</option>
            {opts.map((o, i) => (
              <option key={i} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case "RADIO":
        return (
          <div className={`space-y-2 ${field.cssClass || ""}`}>
            {opts.map((o, i) => (
              <label key={i} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={o}
                  checked={value === o}
                  onChange={() => updateFormData(field.id, o)}
                  className="mr-2 w-4 h-4 text-blue-600"
                  required={field.isRequired}
                />
                <span className="text-sm text-gray-700">{o}</span>
              </label>
            ))}
          </div>
        );
      case "CHECKBOX":
        return (
          <div className={`space-y-2 ${field.cssClass || ""}`}>
            {opts.map((o, i) => {
              const arr = (value as string[]) || [];
              const checked = arr.includes(o);
              return (
                <label key={i} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value={o}
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...arr, o]
                        : arr.filter((v) => v !== o);
                      updateFormData(field.id, next);
                    }}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{o}</span>
                </label>
              );
            })}
          </div>
        );
      case "TAGS":
        return (
          <TagsInput
            value={(value as string[]) || []}
            onChange={(tags) => updateFormData(field.id, tags)}
            options={opts}
            placeholder={field.placeholder || "Type to add tags..."}
            className={field.cssClass || ""}
            id={field.fieldId || field.id}
          />
        );
      case "DATE":
        return (
          <input
            type="date"
            id={field.fieldId || field.id}
            value={value as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className={base}
            required={field.isRequired}
          />
        );
      case "NUMBER":
        return (
          <input
            type="number"
            id={field.fieldId || field.id}
            value={value as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={base}
            required={field.isRequired}
          />
        );
      case "FILE":
        return (
          <div className="space-y-2">
            <input
              type="file"
              id={field.fieldId || field.id}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  updateFormData(field.id, file.name);
                  setFileData((prev) => ({ ...prev, [field.id]: file }));
                }
              }}
              accept=".pdf,.doc,.docx"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required={field.isRequired}
            />
            {value && (
              <p className="text-sm text-gray-600">
                Selected: {value as string}
              </p>
            )}
          </div>
        );
      case "SKILLS":
        return (
          <SkillsWithRatings
            value={(value as SkillRating[]) || []}
            onChange={(skills) => updateFormData(field.id, skills)}
            options={opts}
            placeholder={field.placeholder || "Type to add skills..."}
            className={field.cssClass || ""}
            id={field.fieldId || field.id}
          />
        );
      default:
        return (
          <input
            type="text"
            id={field.fieldId || field.id}
            value={value as string}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={base}
            required={field.isRequired}
          />
        );
    }
  };

  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Job Not Available
          </h2>
          <p className="text-gray-600">
            {error || "This job posting is no longer available."}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-4">
            Thank you for your interest in the {job.title} position. We have
            received your application and will review it shortly.
          </p>
          <p className="text-sm text-gray-500">
            You will receive an email confirmation at the provided email
            address.
          </p>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-blue-100 text-sm">
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                {job.position}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {job.location}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
           
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Job Description
              </h2>
              <div
                className="prose prose-sm max-w-none text-gray-700 mb-6"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
              {job.requirements && (
                <>
                  <h3 className="text-md font-bold text-gray-900 mb-3">
                    Requirements
                  </h3>
                  <div
                    className="prose prose-sm max-w-none text-gray-700 mb-6"
                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                  />
                </>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Experience Level
                </h4>
                <p className="text-sm text-blue-800">{job.experienceLevel}</p>
              </div>
            </div>

            
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Apply for this Position
              </h2>
              {job.form ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {job.form.fields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.isRequired && (
                          <span className="text-red-600 ml-1">*</span>
                        )}
                      </label>
                      {renderField(field)}
                      {validationErrors[field.id] && (
                        <p className="text-red-600 text-xs mt-1">
                          {validationErrors[field.id]}
                        </p>
                      )}
                    </div>
                  ))}

                  
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio Links (GitHub, website, etc.)
                    </label>
                    <div className="space-y-3">
                      {portfolioLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={link.name}
                            onChange={(e) => {
                              const next = [...portfolioLinks];
                              next[index].name = e.target.value;
                              setPortfolioLinks(next);
                            }}
                            placeholder="Label (GitHub, Portfolio)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const next = [...portfolioLinks];
                              next[index].url = e.target.value;
                              setPortfolioLinks(next);
                            }}
                            placeholder="https://example.com"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                          {portfolioLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPortfolioLinks(
                                  portfolioLinks.filter((_, i) => i !== index)
                                )
                              }
                              className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {portfolioLinks.length < 5 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPortfolioLinks([
                              ...portfolioLinks,
                              { name: "", url: "" },
                            ])
                          }
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          + Add Another Link
                        </button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No application form is configured for this job.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
