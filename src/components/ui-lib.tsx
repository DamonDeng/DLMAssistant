import React, { HTMLProps, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

// Styles
const styles = {
  modal: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "90%",
    maxHeight: "90%",
    overflow: "auto",
    position: "relative" as const,
    animation: "modalFadeIn 0.3s ease",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.2em",
    fontWeight: 600,
    color: "#1a1a1a",
  },
  modalClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    color: "#666",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },
  toast: {
    position: "fixed" as const,
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#1a1a1a",
    color: "white",
    padding: "12px 24px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    animation: "toastFadeIn 0.3s ease",
  },
  button: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s ease",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    color: "white",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
  },
};

// Modal Component
interface ModalProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode[];
  onClose?: () => void;
}

export function Modal(props: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);

  return (
    <div style={styles.modal} onClick={props.onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{props.title}</h3>
          <button style={styles.modalClose} onClick={props.onClose}>×</button>
        </div>
        {props.children}
        {props.actions && (
          <div style={styles.modalActions}>
            {props.actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Show Modal Helper
export function showModal(props: ModalProps) {
  const div = document.createElement("div");
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    props.onClose?.();
    root.unmount();
    div.remove();
  };

  root.render(<Modal {...props} onClose={closeModal} />);
}

// Toast Component
interface ToastProps {
  content: string;
  duration?: number;
  onClose?: () => void;
}

export function Toast(props: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      props.onClose?.();
    }, props.duration || 3000);

    return () => clearTimeout(timer);
  }, [props]);

  return (
    <div style={styles.toast}>
      {props.content}
    </div>
  );
}

// Show Toast Helper
export function showToast(content: string, duration = 3000) {
  const div = document.createElement("div");
  document.body.appendChild(div);

  const root = createRoot(div);
  const close = () => {
    root.unmount();
    div.remove();
  };

  root.render(
    <Toast content={content} duration={duration} onClose={close} />
  );
}

// Button Component
interface ButtonProps extends HTMLProps<HTMLButtonElement> {
  type?: "primary" | "secondary";
}

export function Button({ type = "primary", className = "", ...props }: ButtonProps) {
  const buttonStyle = {
    ...styles.button,
    ...(type === "primary" ? styles.primaryButton : styles.secondaryButton),
  };

  return (
    <button
      {...props}
      style={buttonStyle}
      className={className}
    />
  );
}

// Confirm Dialog Helper
export function showConfirm(content: string): Promise<boolean> {
  return new Promise((resolve) => {
    showModal({
      title: "Confirm",
      children: <div>{content}</div>,
      actions: [
        <Button
          key="cancel"
          type="secondary"
          onClick={() => resolve(false)}
        >
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={() => resolve(true)}
        >
          Confirm
        </Button>,
      ],
    });
  });
}

// Input Component
interface InputProps extends HTMLProps<HTMLInputElement> {
  label?: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <div style={{ marginBottom: "16px" }}>
      {label && (
        <label style={{ display: "block", marginBottom: "8px", color: "#374151" }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #e5e7eb",
          fontSize: "14px",
          outline: "none",
          transition: "border-color 0.2s ease",
          ...props.style,
        }}
      />
    </div>
  );
}

// Add global styles for animations
const style = document.createElement("style");
style.textContent = `
  @keyframes modalFadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes toastFadeIn {
    from { opacity: 0; transform: translate(-50%, 20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`;
document.head.appendChild(style);
