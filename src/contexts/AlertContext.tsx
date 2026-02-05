"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import AlertModal, { AlertType } from "@/components/AlertModal";

interface AlertOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, options?: AlertOptions) => void;
  showSuccess: (message: string, options?: AlertOptions) => void;
  showError: (message: string, options?: AlertOptions) => void;
  showWarning: (message: string, options?: AlertOptions) => void;
  showInfo: (message: string, options?: AlertOptions) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    options?: AlertOptions
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>("info");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState<string | undefined>();
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | undefined>();
  const [options, setOptions] = useState<AlertOptions>({});

  const showAlert = useCallback(
    (msg: string, type: AlertType = "info", opts: AlertOptions = {}) => {
      setMessage(msg);
      setAlertType(type);
      setTitle(opts.title);
      setOptions(opts);
      setConfirmCallback(undefined);
      setIsOpen(true);
    },
    []
  );

  const showSuccess = useCallback(
    (msg: string, opts: AlertOptions = {}) => {
      showAlert(msg, "success", { autoClose: true, autoCloseDuration: 3000, ...opts });
    },
    [showAlert]
  );

  const showError = useCallback(
    (msg: string, opts: AlertOptions = {}) => {
      showAlert(msg, "error", opts);
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (msg: string, opts: AlertOptions = {}) => {
      showAlert(msg, "warning", opts);
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (msg: string, opts: AlertOptions = {}) => {
      showAlert(msg, "info", opts);
    },
    [showAlert]
  );

  const showConfirm = useCallback(
    (msg: string, onConfirm: () => void, opts: AlertOptions = {}) => {
      setMessage(msg);
      setAlertType("confirm");
      setTitle(opts.title);
      setOptions(opts);
      setConfirmCallback(() => onConfirm);
      setIsOpen(true);
    },
    []
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setMessage("");
      setTitle(undefined);
      setConfirmCallback(undefined);
      setOptions({});
    }, 200);
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmCallback) {
      confirmCallback();
    }
  }, [confirmCallback]);

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
      }}
    >
      {children}
      <AlertModal
        isOpen={isOpen}
        type={alertType}
        title={title}
        message={message}
        onClose={handleClose}
        onConfirm={confirmCallback ? handleConfirm : undefined}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        autoClose={options.autoClose}
        autoCloseDuration={options.autoCloseDuration}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
