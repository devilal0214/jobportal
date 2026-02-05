"use client";

import { useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export type AlertType = "success" | "error" | "warning" | "info" | "confirm";

interface AlertModalProps {
  isOpen: boolean;
  type: AlertType;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export default function AlertModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  autoClose = false,
  autoCloseDuration = 3000,
}: AlertModalProps) {
  useEffect(() => {
    if (isOpen && autoClose && type !== "confirm") {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose, type]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "error":
        return <XCircle className="h-12 w-12 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
      case "info":
        return <Info className="h-12 w-12 text-blue-500" />;
      case "confirm":
        return <AlertTriangle className="h-12 w-12 text-orange-500" />;
      default:
        return <Info className="h-12 w-12 text-gray-500" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "warning":
        return "Warning";
      case "info":
        return "Information";
      case "confirm":
        return "Confirm Action";
      default:
        return "Alert";
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "warning":
        return "bg-yellow-50";
      case "info":
        return "bg-blue-50";
      case "confirm":
        return "bg-orange-50";
      default:
        return "bg-gray-50";
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity animate-in fade-in duration-200"
        onClick={type !== "confirm" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Close button (only for non-confirm types) */}
        {type !== "confirm" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Content */}
        <div className={`p-6 ${getBgColor()} rounded-t-lg`}>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">{getIcon()}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {getTitle()}
            </h3>
            <p className="text-gray-600 whitespace-pre-line">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white rounded-b-lg flex justify-center gap-3">
          {type === "confirm" ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-8 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
