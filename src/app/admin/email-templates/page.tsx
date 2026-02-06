"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Plus, Edit, Trash2 } from "lucide-react";
import HTMLEditor from "@/components/HTMLEditor";

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    type: "APPLICATION_RECEIVED",
    subject: "",
    body: "",
    isActive: true,
  });

  const templateTypes = [
    { value: "APPLICATION_RECEIVED", label: "Application Received" },
    { value: "APPLICATION_APPROVED", label: "Application Approved" },
    { value: "APPLICATION_REJECTED", label: "Application Rejected" },
    { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
    { value: "JOB_OFFER", label: "Job Offer" },
    { value: "WELCOME", label: "Welcome Email" },
    { value: "CUSTOM", label: "Custom Template" },
  ];

  const availableVariables = [
    "{{candidateName}}",
    "{{jobTitle}}",
    "{{companyName}}",
    "{{interviewDate}}",
    "{{interviewTime}}",
    "{{recruiterName}}",
    "{{applicationDate}}",
    "{{position}}",
    "{{salary}}",
    "{{startDate}}",
  ];

  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const hasEmailRead =
          (data.role &&
            Array.isArray(data.role.permissions) &&
            data.role.permissions.some(
              (p: any) =>
                p.module === "email" && p.action === "read" && p.granted,
            )) ||
          data.role?.name === "Administrator";

        if (!hasEmailRead) {
          router.push("/");
          return;
        }

        setCurrentUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch current user", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/email-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTemplate
        ? `/api/admin/email-templates/${editingTemplate.id}`
        : "/api/admin/email-templates";
      const method = editingTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTemplates();
        resetEditor();
      }
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const resetEditor = () => {
    setShowEditor(false);
    setEditingTemplate(null);
    setFormData({
      name: "",
      type: "APPLICATION_RECEIVED",
      subject: "",
      body: "",
      isActive: true,
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    });
    setShowEditor(true);
  };

  const handleDelete = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        const response = await fetch(
          `/api/admin/email-templates/${templateId}`,
          {
            method: "DELETE",
          },
        );
        if (response.ok) {
          fetchTemplates();
        }
      } catch (error) {
        console.error("Failed to delete template:", error);
      }
    }
  };

  const toggleTemplateStatus = async (
    templateId: string,
    isActive: boolean,
  ) => {
    try {
      const response = await fetch(
        `/api/admin/email-templates/${templateId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !isActive }),
        },
      );
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Failed to update template status:", error);
    }
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      body: prev.body + variable,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Mail className="h-6 w-6 mr-2 text-indigo-600" />
                  Email Templates
                </h1>
                <p className="text-gray-600 mt-1">
                  Create and manage email notification templates
                </p>
              </div>
              {((currentUser?.role &&
                Array.isArray(currentUser.role.permissions) &&
                currentUser.role.permissions.some(
                  (p: any) =>
                    p.module === "email" && p.action === "update" && p.granted,
                )) ||
                currentUser?.role?.name === "Administrator") && (
                <button
                  onClick={() => setShowEditor(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </button>
              )}
            </div>
          </div>

          {showEditor && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium mb-4 text-gray-600">
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-600 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-gray-600 focus:ring-indigo-500"
                    >
                      {templateTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Email subject line"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Body
                  </label>
                  <div className="mb-2">
                    <p className="text-sm text-gray-600 mb-2">
                      Available Variables:
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {availableVariables.map((variable) => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          {variable}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <HTMLEditor
                      value={formData.body || ""}
                      onChange={(value: string) =>
                        setFormData((prev) => ({ ...prev, body: value || "" }))
                      }
                      placeholder="Enter email template body..."
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    {editingTemplate ? "Update" : "Create"} Template
                  </button>
                  <button
                    type="button"
                    onClick={resetEditor}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {template.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {templateTypes.find((t) => t.value === template.type)
                          ?.label || template.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {template.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          template.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(template)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit template"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              href="/admin"
              className="text-indigo-600 hover:text-indigo-500"
            >
              &larr; Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
