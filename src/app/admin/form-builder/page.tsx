"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Move,
  Type,
  Mail,
  Phone,
  Calendar,
  Hash,
  List,
  CheckSquare,
  FileText,
  Tags,
  LogOut,
  Settings,
  Upload,
  Link as LinkIcon,
  Briefcase,
  ChevronDown,
  FormInput,
  Globe,
  Minus,
  AlertCircle,
} from "lucide-react";
import TagsInput from "@/components/TagsInput";
import { User } from "@/types/user";
import { useAlert } from "@/contexts/AlertContext";

interface FormField {
  id: string;
  label: string;
  fieldType: string;
  placeholder?: string;
  options?: string[] | string;
  cssClass?: string;
  fieldId?: string;
  fieldWidth?: string;
  isRequired: boolean;
  order: number;
}

interface Form {
  id: string;
  name: string;
  isDefault: boolean;
  fields: FormField[];
  description?: string;
}

interface FieldTypeDef {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPlaceholder: string;
}

const LOCALSTORAGE_KEY = "FORM_BUILDER_AUTOSEED_V1";

const COUNTRY_CODES = [
  "+1 - United States/Canada",
  "+44 - United Kingdom",
  "+91 - India",
];

const FIELD_TYPES: FieldTypeDef[] = [
  {
    type: "TEXT",
    label: "Text Input",
    icon: Type,
    defaultPlaceholder: "Enter text...",
  },
  {
    type: "EMAIL",
    label: "Email",
    icon: Mail,
    defaultPlaceholder: "Enter email...",
  },
  {
    type: "PHONE",
    label: "Phone",
    icon: Phone,
    defaultPlaceholder: "Enter phone number...",
  },
  {
    type: "COUNTRY_CODE",
    label: "Country Code",
    icon: Globe,
    defaultPlaceholder: "Select country code...",
  },
  {
    type: "TEXTAREA",
    label: "Text Area",
    icon: FileText,
    defaultPlaceholder: "Enter details...",
  },
  {
    type: "SELECT",
    label: "Dropdown",
    icon: List,
    defaultPlaceholder: "Select an option...",
  },
  {
    type: "RADIO",
    label: "Radio Buttons",
    icon: CheckSquare,
    defaultPlaceholder: "",
  },
  {
    type: "CHECKBOX",
    label: "Checkboxes",
    icon: CheckSquare,
    defaultPlaceholder: "",
  },
  {
    type: "DATE",
    label: "Date Picker",
    icon: Calendar,
    defaultPlaceholder: "",
  },
  {
    type: "NUMBER",
    label: "Number",
    icon: Hash,
    defaultPlaceholder: "Enter number...",
  },
  {
    type: "TAGS",
    label: "Tags",
    icon: Tags,
    defaultPlaceholder: "Type to add tags...",
  },
  {
    type: "SKILLS",
    label: "Skills with Ratings",
    icon: Tags,
    defaultPlaceholder: "Select skills and rate your expertise...",
  },
  {
    type: "FILE",
    label: "File Upload",
    icon: Upload,
    defaultPlaceholder: "Choose file...",
  },
  {
    type: "URL",
    label: "URL/Link",
    icon: LinkIcon,
    defaultPlaceholder: "Enter URL...",
  },
  {
    type: "PAGE_BREAK",
    label: "Page Break",
    icon: Minus,
    defaultPlaceholder: "",
  },
];

const DEFAULT_AUTOSEED: string[] = [
  "TEXT:Full name",
  "EMAIL:Email",
  "PHONE:Phone number",
];

let fieldIdCounter = 0;
const generateFieldId = () => {
  fieldIdCounter += 1;
  return `field_${fieldIdCounter}`;
};

function groupByPageBreak(fields: FormField[]) {
  const steps: FormField[][] = [];
  let buf: FormField[] = [];
  for (const f of fields) {
    if (f.fieldType === "PAGE_BREAK") {
      steps.push(buf);
      buf = [];
      continue;
    }
    buf.push(f);
  }
  steps.push(buf);
  return steps.filter((step) => step.length > 0);
}

function makeField(fieldType: string, label: string, order: number): FormField {
  const def = FIELD_TYPES.find((d) => d.type === fieldType);
  const placeholder = def?.defaultPlaceholder ?? "";
  const options = ["SELECT", "RADIO", "CHECKBOX", "TAGS"].includes(fieldType)
    ? ["Option 1", "Option 2", "Option 3"]
    : fieldType === "COUNTRY_CODE"
      ? COUNTRY_CODES
      : [];

  // sensible default fieldId for common fields
  let fieldId = "";
  if (label.toLowerCase().includes("full name")) fieldId = "candidateName";
  if (label.toLowerCase() === "email") fieldId = "candidateEmail";
  if (label.toLowerCase().includes("phone")) fieldId = "candidatePhone";

  return {
    id: generateFieldId(),
    label,
    fieldType,
    placeholder,
    options,
    cssClass: "",
    fieldId,
    fieldWidth: "100%",
    isRequired: ["EMAIL", "TEXT", "PHONE"].includes(fieldType),
    order,
  };
}

function FormBuilderContent() {
  const { showConfirm, showSuccess, showError } = useAlert();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [formName, setFormName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);
  const [draggedField, setDraggedField] = useState<FormField | null>(null);
  const [draggedFieldType, setDraggedFieldType] = useState<FieldTypeDef | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showJobsDropdown, setShowJobsDropdown] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  const [autoSeed, setAutoSeed] = useState<string[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.every((x) => typeof x === "string")
        ) {
          setAutoSeed(parsed);
          return;
        }
      } catch {}
    }

    setAutoSeed(DEFAULT_AUTOSEED);
  }, []);

  const persistAutoSeed = (list: string[]) => {
    setAutoSeed(list);
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(list));
  };

  const toggleAutoSeedItem = (key: string) => {
    const exists = autoSeed.includes(key);
    const next = exists
      ? autoSeed.filter((k) => k !== key)
      : [...autoSeed, key];
    persistAutoSeed(next);
  };

  const moveAutoSeedItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= autoSeed.length) return;
    const clone = [...autoSeed];
    const [it] = clone.splice(index, 1);
    clone.splice(target, 0, it);
    persistAutoSeed(clone);
  };

  const fetchForms = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/forms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setForms(data);

        const editId = searchParams.get("editId");
        if (editId) {
          const formToEdit = data.find((form: Form) => form.id === editId);
          if (formToEdit) selectForm(formToEdit);
        }
      }
    } catch (err) {
      console.error("Error fetching forms:", err);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          const hasAccess =
            userData.role &&
            Array.isArray(userData.role.permissions) &&
            userData.role.permissions.some(
              (p: any) =>
                p.module === "forms" &&
                (p.action === "read" ||
                  p.action === "update" ||
                  p.action === "create") &&
                p.granted,
            );
          if (!hasAccess) {
            router.push("/admin");
            return;
          }
          setUser(userData);
          await fetchForms();
        } else {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router, searchParams, fetchForms]);

  const hasFormsCreate = !!(
    user &&
    Array.isArray(user.role?.permissions) &&
    user.role.permissions.some(
      (p: any) => p.module === "forms" && p.action === "create" && p.granted,
    )
  );

  const hasFormsUpdate = !!(
    user &&
    Array.isArray(user.role?.permissions) &&
    user.role.permissions.some(
      (p: any) => p.module === "forms" && p.action === "update" && p.granted,
    )
  );

  const hasFormsDelete = !!(
    user &&
    Array.isArray(user.role?.permissions) &&
    user.role.permissions.some(
      (p: any) => p.module === "forms" && p.action === "delete" && p.granted,
    )
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showJobsDropdown) {
        const target = event.target as Element;
        if (!target.closest(".relative")) setShowJobsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showJobsDropdown]);

  const selectForm = (form: Form) => {
    // Check if user has update permission
    if (!hasFormsUpdate) {
      setToast({
        show: true,
        message: "You don't have permission to edit this form",
      });
      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 3000);
      return;
    }

    setSelectedForm(form);
    setFormName(form.name);
    setIsDefault(form.isDefault);

    const parsedFields = (form.fields || []).map((field) => ({
      ...field,
      options: field.options
        ? typeof field.options === "string"
          ? field.options.startsWith("[")
            ? JSON.parse(field.options)
            : [field.options]
          : field.options
        : [],
    }));

    const ordered = parsedFields.sort((a, b) => a.order - b.order);
    setFields(ordered);
    setPreviewStep(0);
    setError("");
    setSuccess("");
  };

  const createNewForm = () => {
    setSelectedForm(null);
    setFormName("");
    setIsDefault(false);

    const seeded: FormField[] = autoSeed.map((key, idx) => {
      const [type, ...labelParts] = key.split(":");
      const label = labelParts.join(":").trim() || type;
      return makeField(type, label, idx);
    });

    setFields(seeded);
    setPreviewStep(0);
    setError("");
    setSuccess("");
  };



  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field,
      ),
    );
  };

  const removeField = (fieldId: string) => {
    const newFields = fields.filter((field) => field.id !== fieldId);
    const reordered = newFields.map((field, index) => ({
      ...field,
      order: index,
    }));
    setFields(reordered);
  };

  const handleDragStart = (
    e: React.DragEvent,
    field: FormField | null,
    fieldType: FieldTypeDef | null,
  ) => {
    if (field) {
      setDraggedField(field);
      e.dataTransfer.setData("text/plain", "existing-field");
    } else if (fieldType) {
      setDraggedFieldType(fieldType);
      e.dataTransfer.setData("text/plain", "new-field");
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const dataType = e.dataTransfer.getData("text/plain");

    if (dataType === "new-field" && draggedFieldType) {
      const newField: FormField = makeField(
        draggedFieldType.type,
        `${draggedFieldType.label}${
          draggedFieldType.type === "PAGE_BREAK" ? "" : " Field"
        }`,
        targetIndex,
      );

      const newFields = [...fields];
      newFields.splice(targetIndex, 0, newField);
      const reordered = newFields.map((f, i) => ({ ...f, order: i }));
      setFields(reordered);
      setDraggedFieldType(null);
      return;
    }

    if (dataType === "existing-field" && draggedField) {
      const newFields = [...fields];
      const draggedIndex = newFields.findIndex((f) => f.id === draggedField.id);
      if (draggedIndex !== -1) {
        newFields.splice(draggedIndex, 1);
        newFields.splice(
          targetIndex > draggedIndex ? targetIndex - 1 : targetIndex,
          0,
          draggedField,
        );
        const reordered = newFields.map((f, i) => ({ ...f, order: i }));
        setFields(reordered);
      }
      setDraggedField(null);
    }
  };

  const saveForm = async () => {
    if (!formName.trim()) {
      setError("Form name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in again.");
        router.push("/login");
        return;
      }

      const url = selectedForm
        ? `/api/admin/forms/${selectedForm.id}`
        : "/api/admin/forms";
      const method = selectedForm ? "PUT" : "POST";

      const payload = {
        name: formName,
        isDefault,
        description: selectedForm?.description || "",
        fields: fields.map((f, index) => ({
          label: f.label,
          fieldType: f.fieldType,
          placeholder: f.placeholder || "",
          options: Array.isArray(f.options) ? f.options : [],
          cssClass: f.cssClass || "",
          fieldId: f.fieldId || "",
          fieldWidth: f.fieldWidth || "100%",
          isRequired: f.isRequired || false,
          order: index,
        })),
      };

      const resp = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await resp.text();
      if (!resp.ok) {
        let msg = "Failed to save form";
        try {
          const j = JSON.parse(text);
          if (j?.error) msg = j.error;
        } catch {}
        setError(msg);
        return;
      }

      let saved: Form;
      try {
        saved = JSON.parse(text);
      } catch {
        setError("Invalid response from server");
        return;
      }

      setSuccess(
        selectedForm
          ? "Form updated successfully!"
          : "Form created successfully!",
      );
      await fetchForms();
      if (!selectedForm) selectForm(saved);
    } catch (err) {
      console.error("Save form error:", err);
      setError("An error occurred while saving the form");
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async () => {
    if (!selectedForm) return;

    showConfirm(
      `Are you sure you want to delete the form "${selectedForm.name}"? This action cannot be undone.`,
      async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
          const token = localStorage.getItem("token");
          if (!token) {
            showError("Authentication required. Please log in again.");
            router.push("/login");
            return;
          }

          const resp = await fetch(`/api/admin/forms/${selectedForm.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!resp.ok) {
            const text = await resp.text();
            let msg = "Failed to delete form";
            try {
              const j = JSON.parse(text);
              if (j?.error) msg = j.error;
            } catch {}
            showError(msg);
            return;
          }

          showSuccess("Form deleted successfully!");
          await fetchForms();
          createNewForm();
        } catch (err) {
          console.error("Delete form error:", err);
          showError("An error occurred while deleting the form");
        } finally {
          setSaving(false);
        }
      },
      {
        title: "Delete Form",
        confirmText: "Delete",
        cancelText: "Cancel",
      }
    );
  };

  const renderField = (field: FormField) => {
    const fieldClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 text-gray-900 placeholder-gray-600 ${
      field.cssClass || ""
    }`;

    switch (field.fieldType) {
      case "TEXT":
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        );
      case "EMAIL":
        return (
          <input
            type="email"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        );
      case "PHONE":
        return (
          <input
            type="tel"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        );
      case "COUNTRY_CODE":
        return (
          <select
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          >
            <option value="">
              {field.placeholder || "Select country code"}
            </option>
            {Array.isArray(field.options) &&
              field.options.map((opt, i) => (
                <option key={i} value={String(opt)}>
                  {String(opt)}
                </option>
              ))}
          </select>
        );
      case "TEXTAREA":
        return (
          <textarea
            placeholder={field.placeholder}
            className={fieldClass}
            rows={3}
            id={field.fieldId || `field-${field.id}`}
          />
        );
      case "SELECT":
        return (
          <select
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          >
            <option value="">{field.placeholder || "Select an option"}</option>
            {Array.isArray(field.options) &&
              field.options.map((opt, i) => (
                <option key={i} value={String(opt)}>
                  {String(opt)}
                </option>
              ))}
          </select>
        );
      case "RADIO":
        return (
          <div
            className={`space-y-2 ${field.cssClass || ""}`}
            id={field.fieldId || `field-${field.id}`}
          >
            {Array.isArray(field.options) &&
              field.options.map((opt, i) => (
                <label key={i} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={field.fieldId || field.id}
                    value={String(opt)}
                    className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-800">{String(opt)}</span>
                </label>
              ))}
          </div>
        );
      case "CHECKBOX":
        return (
          <div
            className={`space-y-2 ${field.cssClass || ""}`}
            id={field.fieldId || `field-${field.id}`}
          >
            {Array.isArray(field.options) &&
              field.options.map((opt, i) => (
                <label key={i} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value={String(opt)}
                    className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-800">{String(opt)}</span>
                </label>
              ))}
          </div>
        );
      case "TAGS":
        return (
          <TagsInput
            value={[]}
            onChange={() => {}}
            options={
              Array.isArray(field.options) ? (field.options as string[]) : []
            }
            placeholder={field.placeholder || "Type to add tags..."}
            className={field.cssClass || ""}
            id={field.fieldId || `field-${field.id}`}
          />
        );
      case "SKILLS":
        return (
          <div
            className={`${field.cssClass || ""}`}
            id={field.fieldId || `field-${field.id}`}
          >
            <div className="text-sm text-gray-600 mb-3">
              {field.placeholder || "Select skills and rate your expertise..."}
            </div>
            <div className="space-y-3">
              <div className="text-xs text-gray-500">
                Skills with ratings will appear here when skills are selected
              </div>
            </div>
          </div>
        );
      case "DATE":
        return (
          <input
            type="date"
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        );
      case "NUMBER":
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        );
      case "FILE":
        return (
          <div
            className={`border-2 border-dashed border-gray-300 rounded-md p-6 text-center ${
              field.cssClass || ""
            }`}
            id={field.fieldId || `field-${field.id}`}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-900">
                {field.placeholder || "Choose file to upload"}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, DOCX (Max 2MB)
              </p>
            </div>
          </div>
        );
      case "URL":
        return (
          <input
            type="url"
            placeholder={field.placeholder || "Enter URL..."}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        );
      case "PAGE_BREAK":
        return (
          <div className="flex items-center justify-center">
            <div className="w-full border-t border-dashed border-gray-300 relative">
              <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2 text-xs text-gray-500">
                --- Page Break ---
              </span>
            </div>
          </div>
        );
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className={fieldClass}
            id={field.fieldId || `field-${field.id}`}
          />
        );
    }
  };

  /** ------------ UI helpers ------------ */

  const stepsForPreview = groupByPageBreak(fields);

  const getGridCols = (width?: string) => {
    switch (width) {
      case "25%":
        return "col-span-3";
      case "33%":
        return "col-span-4";
      case "50%":
        return "col-span-6";
      case "66%":
        return "col-span-8";
      case "75%":
        return "col-span-9";
      case "100%":
      default:
        return "col-span-12";
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      router.push("/login");
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md bg-red-50 border border-red-200 text-red-800">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Nav */}
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
                      <Link
                        href="/jobs/new"
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => setShowJobsDropdown(false)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Job</span>
                      </Link>
                      <Link
                        href="/admin/form-builder"
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => setShowJobsDropdown(false)}
                      >
                        <FormInput className="h-4 w-4" />
                        <span>Create Form</span>
                      </Link>
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
              <Link
                href="/admin"
                className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
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

      {/* Page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
          <p className="mt-2 text-gray-600">
            Create and manage application forms with drag & drop and page breaks
          </p>
        </div>

        <div className="flex gap-6">
          {/* Left column */}
          <div className="w-80 flex-shrink-0 space-y-6 sticky top-6 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
            {/* Forms list */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Forms</h2>
                  {hasFormsCreate && (
                    <button
                      onClick={createNewForm}
                      className="p-1 text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 rounded"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {forms.map((form) => (
                    <div
                      key={form.id}
                      className={`p-3 rounded-md transition-colors group relative ${
                        selectedForm?.id === form.id
                          ? "bg-indigo-50 border-indigo-200 border text-indigo-900"
                          : "hover:bg-gray-50 border border-transparent text-gray-900"
                      } ${
                        hasFormsUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div onClick={() => selectForm(form)}>
                        <div className="font-medium pr-8">{form.name}</div>
                        <div className="text-sm text-gray-500">
                          {form.fields.length} fields
                        </div>
                        {form.isDefault && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-1">
                            Default
                          </span>
                        )}
                      </div>
                      {hasFormsDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForm(form);
                            setTimeout(() => deleteForm(), 0);
                          }}
                          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete form"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {forms.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No forms created yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Field Types
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Drag fields to the form area
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {FIELD_TYPES.map((fieldType) => {
                    const Icon = fieldType.icon;
                    return (
                      <div
                        key={fieldType.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, null, fieldType)}
                        className="flex items-center p-3 bg-gray-50 rounded-md cursor-move hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <Icon className="h-4 w-4 text-gray-600 mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">
                          {fieldType.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Auto-add on New Form
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose which fields appear automatically when creating a new
                  form. Drag to reorder.
                </p>
              </div>
              <div className="p-4 space-y-3">
                {autoSeed.length > 0 ? (
                  <div className="space-y-2">
                    {autoSeed.map((key, idx) => {
                      const [type, ...labelParts] = key.split(":");
                      const label = labelParts.join(":").trim() || type;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between border rounded-md px-2 py-2 bg-indigo-50/40"
                        >
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-800">
                              {label}{" "}
                              <span className="text-[11px] text-gray-500">
                                ({type})
                              </span>
                            </span>
                          </div>
                          <button
                            onClick={() => toggleAutoSeedItem(key)}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    No fields selected. Use “Add from library” below.
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    Add from library
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {FIELD_TYPES.filter((f) => f.type !== "PAGE_BREAK").map(
                      (ft) => {
                        const defaultLabel =
                          ft.type === "TEXT"
                            ? "Text"
                            : ft.type === "EMAIL"
                              ? "Email"
                              : ft.type === "PHONE"
                                ? "Phone number"
                                : ft.label;
                        const key = `${ft.type}:${defaultLabel}`;
                        const selected = autoSeed.includes(key);
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => toggleAutoSeedItem(key)}
                            className={`text-[13px] border rounded px-3 py-2 text-left ${
                              selected
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                            title={
                              selected
                                ? "Click to remove from auto-seed"
                                : "Click to add to auto-seed"
                            }
                          >
                            {defaultLabel}{" "}
                            <span className="text-[10px] text-gray-500">
                              ({ft.type})
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => persistAutoSeed(DEFAULT_AUTOSEED)}
                    className="mt-3 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Restore defaults (Full name, Email, Phone)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Form Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter form name"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      disabled={!hasFormsCreate && !hasFormsUpdate}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Set as default form
                    </span>
                  </label>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowPreview(!showPreview);
                        setPreviewStep(0);
                      }}
                      className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </button>
                    <button
                      onClick={saveForm}
                      disabled={
                        saving ||
                        (!selectedForm && !hasFormsCreate) ||
                        (selectedForm && !hasFormsUpdate)
                      }
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save Form"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                    {success}
                  </div>
                )}
              </div>

              <div className="p-6">
                {showPreview ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Form Preview
                      </h3>
                      <span className="text-sm text-gray-500">
                        Step {Math.min(previewStep + 1, stepsForPreview.length)}{" "}
                        of {stepsForPreview.length}
                      </span>
                    </div>

                    {stepsForPreview.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        No fields to preview
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-12 gap-4 max-w-2xl">
                          {(stepsForPreview[previewStep] || []).map((field) => (
                            <div
                              key={field.id}
                              className={`space-y-2 ${getGridCols(
                                field.fieldWidth || "100%",
                              )}`}
                            >
                              {field.fieldType !== "PAGE_BREAK" && (
                                <label className="block text-sm font-medium text-gray-800">
                                  {field.label}
                                  {field.isRequired && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                              )}
                              {renderField(field)}
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewStep((s) => Math.max(s - 1, 0))
                            }
                            disabled={previewStep === 0}
                            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 disabled:opacity-50"
                          >
                            Previous
                          </button>

                          {previewStep < stepsForPreview.length - 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewStep((s) =>
                                  Math.min(s + 1, stepsForPreview.length - 1),
                                )
                              }
                              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="px-4 py-2 rounded-md bg-green-600 text-white cursor-default"
                              title="Submit button will show automatically on last step in the apply page."
                            >
                              Submit (demo)
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Form Builder
                      </h3>
                      <span className="text-sm text-gray-500">
                        Drag field types from the left to build your form
                      </span>
                    </div>

                    <div
                      className="min-h-[500px] border-2 border-dashed border-gray-300 rounded-lg p-6"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, fields.length)}
                    >
                      {fields.length === 0 ? (
                        <div className="text-center py-20">
                          <div className="text-gray-400 mb-4">
                            <Move className="h-16 w-16 mx-auto" />
                          </div>
                          <p className="text-gray-500 text-lg">
                            Drag field types here to start building your form
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Fields will appear here as you add them
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div
                              key={field.id}
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e, field, null)
                              }
                              className="bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index)}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                  <Move className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="font-medium text-gray-900">
                                    {field.label ||
                                      (field.fieldType === "PAGE_BREAK"
                                        ? "Page Break"
                                        : "Untitled Field")}
                                  </span>
                                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    {field.fieldType}
                                  </span>
                                  {field.isRequired && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeField(field.id)}
                                  className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              {field.fieldType !== "PAGE_BREAK" ? (
                                <>
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Field Label
                                      </label>
                                      <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) =>
                                          updateField(field.id, {
                                            label: e.target.value,
                                          })
                                        }
                                        className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Placeholder Text
                                      </label>
                                      <input
                                        type="text"
                                        value={field.placeholder || ""}
                                        onChange={(e) =>
                                          updateField(field.id, {
                                            placeholder: e.target.value,
                                          })
                                        }
                                        className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        CSS Class
                                      </label>
                                      <input
                                        type="text"
                                        value={field.cssClass || ""}
                                        onChange={(e) =>
                                          updateField(field.id, {
                                            cssClass: e.target.value,
                                          })
                                        }
                                        className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                        placeholder="custom-class"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Field ID
                                      </label>
                                      <input
                                        type="text"
                                        value={field.fieldId || ""}
                                        onChange={(e) =>
                                          updateField(field.id, {
                                            fieldId: e.target.value,
                                          })
                                        }
                                        className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                        placeholder="field-id"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Field Width
                                      </label>
                                      <select
                                        value={field.fieldWidth || "100%"}
                                        onChange={(e) =>
                                          updateField(field.id, {
                                            fieldWidth: e.target.value,
                                          })
                                        }
                                        className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800"
                                      >
                                        <option value="25%">
                                          25% (1/4 width)
                                        </option>
                                        <option value="33%">
                                          33% (1/3 width)
                                        </option>
                                        <option value="50%">
                                          50% (1/2 width)
                                        </option>
                                        <option value="66%">
                                          66% (2/3 width)
                                        </option>
                                        <option value="75%">
                                          75% (3/4 width)
                                        </option>
                                        <option value="100%">
                                          100% (Full width)
                                        </option>
                                      </select>
                                    </div>
                                    <div className="flex items-center pt-5">
                                      <label className="flex items-center text-xs">
                                        <input
                                          type="checkbox"
                                          checked={field.isRequired}
                                          onChange={(e) =>
                                            updateField(field.id, {
                                              isRequired: e.target.checked,
                                            })
                                          }
                                          className="mr-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700">
                                          Required field
                                        </span>
                                      </label>
                                    </div>
                                  </div>

                                  {[
                                    "SELECT",
                                    "RADIO",
                                    "CHECKBOX",
                                    "TAGS",
                                    "SKILLS",
                                  ].includes(field.fieldType) && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Options (one per line)
                                      </label>
                                      <textarea
                                        value={
                                          Array.isArray(field.options)
                                            ? (field.options as string[]).join(
                                                "\n",
                                              )
                                            : ""
                                        }
                                        onChange={(e) =>
                                          updateField(field.id, {
                                            options: e.target.value
                                              .split("\n")
                                              .map((x) => x.trim())
                                              .filter(Boolean),
                                          })
                                        }
                                        className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
                                        rows={4}
                                        placeholder={`Option 1
Option 2
Option 3`}
                                        style={{
                                          resize: "vertical",
                                          lineHeight: "1.5",
                                        }}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">
                                        {field.fieldType === "TAGS"
                                          ? "These will be available as predefined tag options"
                                          : "Add one option per line"}
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-sm text-gray-600">
                                  This is a <strong>Page Break</strong>. Fields
                                  below it will appear on the next step in the
                                  application form.
                                </div>
                              )}
                            </div>
                          ))}
                          <div
                            className="h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-gray-300 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, fields.length)}
                          >
                            <span className="text-sm">
                              Drop field here to add at the end
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FormBuilderPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormBuilderContent />
    </Suspense>
  );
};

export default FormBuilderPage;
