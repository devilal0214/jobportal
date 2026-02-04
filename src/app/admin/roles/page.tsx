"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Users,
  Plus,
  Settings,
  LogOut,
  Briefcase,
  FileText,
  Edit2,
  Trash2,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";

interface Permission {
  id: string;
  module: string;
  action: string;
  name: string;
  description: string;
  granted?: boolean;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  permissions?: Permission[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | string
    | {
        name: string;
      };
}

export default function RolesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [roleForm, setRoleForm] = useState<RoleFormData>({
    name: "",
    description: "",
    permissions: [],
  });
  const [saving, setSaving] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [showPermissions, setShowPermissions] = useState<
    Record<string, boolean>
  >({});
  const router = useRouter();

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
          await fetchRoles();
          await fetchAllPermissions(); // Load permissions when page loads
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

    checkAuth();
  }, [router]);

  const fetchRoles = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/roles?includePermissions=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchAllPermissions = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingPermissions(true);
    try {
      console.log("Fetching permissions...");
      const response = await fetch("/api/permissions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Permissions response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Permissions data:", data);
        setAllPermissions(data.permissions || []);
      } else {
        console.error("Failed to fetch permissions:", response.status);
        setAllPermissions([]);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setAllPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const openCreateModal = () => {
    setRoleForm({
      name: "",
      description: "",
      permissions: [],
    });
    setEditingRole(null);
    setShowCreateModal(true);
  };

  const openEditModal = (role: Role) => {
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions?.map((p) => p.id) || [],
    });
    setEditingRole(role);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingRole(null);
    setRoleForm({
      name: "",
      description: "",
      permissions: [],
    });
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) return;

    setSaving(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const method = editingRole ? "PUT" : "POST";
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";

      // Ensure dashboard view and applications view permissions are always included
      const dashboardRead = allPermissions.find(
        (p) => p.module === "dashboard" && p.action === "read",
      );
      const applicationsRead = allPermissions.find(
        (p) => p.module === "applications" && p.action === "read",
      );

      const permissionsToSend = new Set(roleForm.permissions || []);
      if (dashboardRead) permissionsToSend.add(dashboardRead.id);
      if (applicationsRead) permissionsToSend.add(applicationsRead.id);

      const payload = {
        ...roleForm,
        permissions: Array.from(permissionsToSend),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchRoles();
        closeModals();
      } else {
        console.error("Failed to save role");
      }
    } catch (error) {
      console.error("Error saving role:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this role? This action cannot be undone.",
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchRoles();
      } else {
        console.error("Failed to delete role");
        alert("Failed to delete role. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("An error occurred while deleting the role.");
    }
  };

  const togglePermission = (permissionId: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

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

  const togglePermissions = (roleId: string) => {
    setShowPermissions((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "jobs":
        return <Briefcase className="h-4 w-4" />;
      case "applications":
        return <FileText className="h-4 w-4" />;
      case "users":
        return <Users className="h-4 w-4" />;
      case "roles":
        return <Shield className="h-4 w-4" />;
      case "settings":
        return <Settings className="h-4 w-4" />;
      default:
        return <ShieldCheck className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "text-green-600 bg-green-100";
      case "read":
        return "text-blue-600 bg-blue-100";
      case "update":
        return "text-yellow-600 bg-yellow-100";
      case "delete":
        return "text-red-600 bg-red-100";
      case "archive":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Build permission lookup by module for ordered/grouped rendering
  const permsByModule: Record<string, Permission[]> = allPermissions.reduce(
    (acc, p) => {
      if (!acc[p.module]) acc[p.module] = [];
      acc[p.module].push(p);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const permissionGroups = [
    { key: "applications", label: "Applications", modules: ["applications"] },
    { key: "forms", label: "Forms", modules: ["forms"] },
    { key: "jobs", label: "Jobs", modules: ["jobs"] },
    {
      key: "dashboard",
      label: "Dashboard",
      // keep dashboard:read enforced by backend/client; don't expose toggle here
      modules: ["email", "roles", "users", "settings", "careers-settings"],
    },
  ];

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
              <Link href="/" className="text-xl font-semibold text-gray-900">
                Job Portal
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <Link
                href="/jobs"
                className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
              >
                <Briefcase className="h-4 w-4" />
                <span>Jobs</span>
              </Link>
              <Link
                href="/applications"
                className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
              >
                <FileText className="h-4 w-4" />
                <span>Applications</span>
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </Link>
              <Link
                href="/admin/roles"
                className="text-indigo-600 font-medium flex items-center space-x-1"
              >
                <Shield className="h-4 w-4" />
                <span>Roles</span>
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user.name} (
                  {typeof user.role === "string"
                    ? user.role
                    : user.role?.name || "Guest"}
                  )
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
            <h1 className="text-3xl font-bold text-gray-900">
              Roles & Permissions
            </h1>
            <p className="mt-2 text-gray-600">
              Manage user roles and permissions across the system
            </p>
          </div>
          {((user?.role &&
            Array.isArray(user.role.permissions) &&
            user.role.permissions.some(
              (p) => p.module === "roles" && p.action === "create" && p.granted,
            )) ||
            user?.role?.name === "Administrator") && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </button>
          )}
        </div>

        {/* Roles Grid */}
        <div className="grid gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-lg shadow border">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${role.isSystem ? "bg-blue-100" : "bg-green-100"}`}
                      >
                        {role.isSystem ? (
                          <ShieldCheck
                            className={`h-5 w-5 ${role.isSystem ? "text-blue-600" : "text-green-600"}`}
                          />
                        ) : (
                          <Shield className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {role.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {role.description}
                        </p>
                      </div>
                      {role.isSystem && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          System Role
                        </span>
                      )}
                      {!role.isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{role.userCount} users</span>
                      </div>
                      {role.creator && (
                        <div className="flex items-center space-x-1">
                          <UserPlus className="h-4 w-4" />
                          <span>Created by {role.creator.name}</span>
                        </div>
                      )}
                      <div>
                        Created {new Date(role.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {((user?.role &&
                      Array.isArray(user.role.permissions) &&
                      user.role.permissions.some(
                        (p) =>
                          p.module === "roles" &&
                          p.action === "read" &&
                          p.granted,
                      )) ||
                      user?.role?.name === "Administrator") && (
                      <button
                        onClick={() => togglePermissions(role.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {showPermissions[role.id] ? (
                          <EyeOff className="h-4 w-4 mr-1" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        {showPermissions[role.id] ? "Hide" : "View"} Permissions
                      </button>
                    )}
                    {((user?.role &&
                      Array.isArray(user.role.permissions) &&
                      user.role.permissions.some(
                        (p) =>
                          p.module === "roles" &&
                          p.action === "update" &&
                          p.granted,
                      )) ||
                      user?.role?.name === "Administrator") && (
                      <button
                        onClick={() => openEditModal(role)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    )}
                    {role.name !== "Administrator" &&
                      ((user?.role &&
                        Array.isArray(user.role.permissions) &&
                        user.role.permissions.some(
                          (p) =>
                            p.module === "roles" &&
                            p.action === "delete" &&
                            p.granted,
                        )) ||
                        user?.role?.name === "Administrator") && (
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title={
                            role.isSystem
                              ? "System roles can be deleted (except Administrator)"
                              : "Delete this role"
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      )}
                  </div>
                </div>

                {/* Permissions Section */}
                {showPermissions[role.id] && role.permissions && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">
                      Permissions
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(
                        role.permissions.reduce(
                          (acc, permission) => {
                            if (!acc[permission.module]) {
                              acc[permission.module] = [];
                            }
                            acc[permission.module].push(permission);
                            return acc;
                          },
                          {} as Record<string, Permission[]>,
                        ),
                      ).map(([module, permissions]) => (
                        <div key={module} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            {getModuleIcon(module)}
                            <h5 className="text-sm font-medium text-gray-900 capitalize">
                              {module}
                            </h5>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {permissions.map((permission) => (
                              <span
                                key={permission.id}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(permission.action)}`}
                                title={permission.description}
                              >
                                {permission.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {roles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No roles found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new role.
            </p>
            <div className="mt-6">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Role Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRole ? "Edit Role" : "Create New Role"}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Basic Info */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter role name"
                    disabled={editingRole?.isSystem}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border text-gray-700  border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter role description"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Permissions
                </h4>
                {loadingPermissions ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Loading permissions...</div>
                  </div>
                ) : !Array.isArray(allPermissions) ||
                  allPermissions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">
                      No permissions available
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {permissionGroups.map((group) => {
                      // include modules even if they currently have no permissions (so labels appear)
                      // Filter out applications:read as it's always granted by default
                      const groupModules = group.modules.map((m) => ({
                        module: m,
                        perms: (permsByModule[m] || []).filter(
                          (p) => !(p.module === "applications" && p.action === "read")
                        ),
                      }));

                      return (
                        <div
                          key={group.key}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex items-center space-x-2 mb-3">
                            {getModuleIcon(group.key)}
                            <h5 className="text-sm font-medium text-gray-900">
                              {group.label}
                            </h5>
                            <div className="flex-1" />
                            <button
                              type="button"
                              onClick={() => {
                                const modulePermissionIds =
                                  groupModules.flatMap((gm) =>
                                    gm.perms.map((p) => p.id),
                                  );
                                const allSelected = modulePermissionIds.every(
                                  (id) => roleForm.permissions.includes(id),
                                );
                                if (allSelected) {
                                  setRoleForm((prev) => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(
                                      (id) => !modulePermissionIds.includes(id),
                                    ),
                                  }));
                                } else {
                                  setRoleForm((prev) => ({
                                    ...prev,
                                    permissions: Array.from(
                                      new Set([
                                        ...(prev.permissions || []),
                                        ...modulePermissionIds,
                                      ]),
                                    ),
                                  }));
                                }
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-500"
                            >
                              {groupModules
                                .flatMap((gm) => gm.perms)
                                .every((p) =>
                                  roleForm.permissions.includes(p.id),
                                )
                                ? "Deselect All"
                                : "Select All"}
                            </button>
                          </div>

                          {groupModules.length > 1 ? (
                            <div className="space-y-4">
                              {groupModules.map((gm) => (
                                <div key={gm.module}>
                                  <div className="flex items-center mb-2">
                                    {getModuleIcon(gm.module)}
                                    <h6 className="text-xs font-medium text-gray-800 ml-2 capitalize">
                                      {gm.module === "email"
                                        ? "Email Templates"
                                        : gm.module === "careers-settings"
                                          ? "Careers Settings"
                                          : gm.module}
                                    </h6>
                                  </div>
                                  {gm.perms.length === 0 ? (
                                    <div className="text-sm text-gray-500 ml-8">
                                      No permissions available
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {gm.perms.map((permission) => (
                                        <label
                                          key={permission.id}
                                          className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-white"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={roleForm.permissions.includes(
                                              permission.id,
                                            )}
                                            onChange={() =>
                                              togglePermission(permission.id)
                                            }
                                            className="text-indigo-600 focus:ring-indigo-500"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">
                                              {permission.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                              {permission.description}
                                            </p>
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : groupModules[0].perms &&
                            groupModules[0].perms.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {groupModules[0].perms.map((permission) => (
                                <label
                                  key={permission.id}
                                  className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-white"
                                >
                                  <input
                                    type="checkbox"
                                    checked={roleForm.permissions.includes(
                                      permission.id,
                                    )}
                                    onChange={() =>
                                      togglePermission(permission.id)
                                    }
                                    className="text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {permission.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {permission.description}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 ml-4">
                              No permissions available
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saving || !roleForm.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? "Saving..."
                  : editingRole
                    ? "Update Role"
                    : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
