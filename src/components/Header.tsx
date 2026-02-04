"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import Script from "next/script";
import Image from "next/image";
import {
  LogOut,
  Briefcase,
  FileText,
  Settings,
  ChevronDown,
  Plus,
  FormInput,
  Menu,
  X,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
    permissions?: Array<{
      id: string;
      module: string;
      action: string;
      granted?: boolean;
    }>;
  } | null;
}

interface HeaderProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

interface LogoSettings {
  logoImage?: string;
  logoHeight: string;
  logoWidth: string;
  companyName: string;
}

const Header = ({
  title = "Job Portal - Find Your Dream Job",
  description = "Professional job portal for finding and posting job opportunities. Connect with top employers and talented candidates.",
  keywords = "jobs, careers, employment, job portal, hiring, recruitment",
  ogImage = "/og-image.jpg",
  canonicalUrl,
  noIndex = false,
}: HeaderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJobsDropdown, setShowJobsDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
    logoHeight: "40px",
    logoWidth: "40px",
    companyName: "Job Portal",
  });
  const router = useRouter();
  const pathname = usePathname();

  const hasPermission = (module: string, action: string) => {
    try {
      return (
        (user?.role &&
          Array.isArray((user.role as any).permissions) &&
          (user.role as any).permissions.some(
            (p: any) => p.module === module && p.action === action && p.granted,
          )) ||
        user?.role?.name === "Administrator"
      );
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (pathname !== "/login" && pathname !== "/") {
            router.push("/login");
          }
          setLoading(false);
          return;
        }

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
          if (pathname !== "/login" && pathname !== "/") {
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        if (pathname !== "/login" && pathname !== "/") {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchLogoSettings = async () => {
      try {
        const response = await fetch("/api/careers-settings/public");
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setLogoSettings({
              logoImage: data.settings.logoImage,
              logoHeight: data.settings.logoHeight || "40px",
              logoWidth: data.settings.logoWidth || "40px",
              companyName: data.settings.companyName || "Job Portal",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch logo settings:", error);
      }
    };

    checkAuth();
    fetchLogoSettings();
  }, [router, pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showJobsDropdown && !target.closest(".jobs-dropdown")) {
        setShowJobsDropdown(false);
      }
      if (showMobileMenu && !target.closest(".mobile-menu")) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showJobsDropdown, showMobileMenu]);

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

  // Don't render navigation for login page
  if (pathname === "/login" || loading) {
    return (
      <>
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <meta name="keywords" content={keywords} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta
            name="robots"
            content={noIndex ? "noindex,nofollow" : "index,follow"}
          />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={ogImage} />
          <meta
            property="og:url"
            content={
              canonicalUrl || `${process.env.NEXT_PUBLIC_SITE_URL}${pathname}`
            }
          />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={ogImage} />

          {/* Canonical URL */}
          {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

          {/* Favicons - App Router handles favicon.ico automatically, but adding fallback for production */}
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link rel="manifest" href="/manifest.json" />

          {/* Google Analytics - Replace with your GA ID */}
          {process.env.NEXT_PUBLIC_GA_ID && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              />
              <Script id="google-analytics">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `}
              </Script>
            </>
          )}

          {/* Google Tag Manager - Replace with your GTM ID */}
          {process.env.NEXT_PUBLIC_GTM_ID && (
            <Script id="google-tag-manager">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
              `}
            </Script>
          )}
        </Head>

        {/* Google Tag Manager (noscript) */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="robots"
          content={noIndex ? "noindex,nofollow" : "index,follow"}
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta
          property="og:url"
          content={
            canonicalUrl || `${process.env.NEXT_PUBLIC_SITE_URL}${pathname}`
          }
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {/* Canonical URL */}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

        {/* Favicons - App Router handles favicon.ico automatically, but adding fallback for production */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/manifest.json" />

        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <Script id="google-analytics-main">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* Google Tag Manager */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script id="google-tag-manager-main">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
            `}
          </Script>
        )}
      </Head>

      {/* Google Tag Manager (noscript) */}
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              {logoSettings.logoImage && (
                <div
                  className="relative"
                  style={{
                    width: logoSettings.logoWidth,
                    height: logoSettings.logoHeight,
                  }}
                >
                  <Image
                    src={logoSettings.logoImage}
                    alt={logoSettings.companyName}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <Link href="/" className="text-xl font-semibold text-gray-900">
                {logoSettings.companyName}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Jobs Dropdown */}
              <div className="relative jobs-dropdown">
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
                      {hasPermission("forms", "create") && (
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

              {/* Applications */}
              {hasPermission("applications", "read") && (
                <Link
                  href="/applications"
                  className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
                >
                  <FileText className="h-4 w-4" />
                  <span>Applications</span>
                </Link>
              )}

              {/* Admin */}
              {((user?.role &&
                Array.isArray((user.role as any).permissions) &&
                (user.role as any).permissions.some(
                  (p: any) =>
                    (p.module === "roles" ||
                      p.module === "users" ||
                      p.module === "settings" ||
                      p.module === "dashboard" ||
                      p.module === "email" ||
                      p.module === "forms") &&
                    p.action === "read" &&
                    p.granted,
                )) ||
                user?.role?.name === "Administrator") && (
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}

              {/* User Info & Logout */}
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

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {/* Jobs Section */}
              <div className="px-3 py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Jobs
                </div>
                <div className="mt-2 space-y-1">
                  <Link
                    href="/jobs"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4" />
                      <span>View All Jobs</span>
                    </div>
                  </Link>
                  <Link
                    href="/jobs/new"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Create Job</span>
                    </div>
                  </Link>
                  {hasPermission("forms", "create") && (
                    <Link
                      href="/admin/form-builder"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <FormInput className="h-4 w-4" />
                        <span>Create Form</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* Other Links */}
              {hasPermission("applications", "read") && (
                <Link
                  href="/applications"
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Applications</span>
                  </div>
                </Link>
              )}

              {((user?.role &&
                Array.isArray((user.role as any).permissions) &&
                (user.role as any).permissions.some(
                  (p: any) =>
                    (p.module === "roles" ||
                      p.module === "users" ||
                      p.module === "settings" ||
                      p.module === "dashboard" ||
                      p.module === "email" ||
                      p.module === "forms") &&
                    p.action === "read" &&
                    p.granted,
                )) ||
                user?.role?.name === "Administrator") && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </div>
                </Link>
              )}

              {/* User Info */}
              <div className="px-3 py-2 border-t">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Account
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-700 px-3 py-2">
                    {user.name} ({user.role?.name || "Guest"})
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Header;
