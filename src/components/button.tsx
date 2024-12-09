import React, { CSSProperties } from "react";

// Button Types
export type ButtonType = "primary" | "danger" | null;

// Styles
const styles: Record<string, CSSProperties> = {
  iconButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "transparent",
  },

  primary: {
    backgroundColor: "#2563eb",
    color: "white",
  },

  danger: {
    backgroundColor: "#dc2626",
    color: "white",
  },

  border: {
    border: "1px solid #e5e7eb",
  },

  shadow: {
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },

  disabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    pointerEvents: "none" as const,
  },

  iconButtonIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
  },

  iconButtonText: {
    lineHeight: 1.2,
  },
};

// IconButton Component
export interface IconButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: React.ReactNode;
  type?: ButtonType;
  text?: string;
  bordered?: boolean;
  shadow?: boolean;
  className?: string;
  title?: string;
  disabled?: boolean;
  tabIndex?: number;
  autoFocus?: boolean;
}

export function IconButton(props: IconButtonProps) {
  // Combine styles based on props
  const buttonStyle: CSSProperties = {
    ...styles.iconButton,
    ...(props.type === "primary" && styles.primary),
    ...(props.type === "danger" && styles.danger),
    ...(props.bordered && styles.border),
    ...(props.shadow && styles.shadow),
    ...(props.disabled && styles.disabled),
  };

  const classes = [
    "icon-button",
    props.type && `icon-button-${props.type}`,
    props.bordered && "icon-button-bordered",
    props.className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      style={buttonStyle}
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
      role="button"
      tabIndex={props.tabIndex}
      autoFocus={props.autoFocus}
      className={classes}
    >
      {props.icon && (
        <div style={styles.iconButtonIcon}>
          {props.icon}
        </div>
      )}

      {props.text && (
        <div style={styles.iconButtonText}>
          {props.text}
        </div>
      )}
    </button>
  );
}

// Add CSS for hover effects and transitions
const style = document.createElement("style");
style.textContent = `
  .icon-button {
    transition: all 0.2s ease;
  }

  .icon-button:hover {
    transform: translateY(-1px);
  }
  
  .icon-button-primary:hover {
    background-color: #1d4ed8 !important;
  }
  
  .icon-button-danger:hover {
    background-color: #b91c1c !important;
  }
  
  .icon-button-bordered:hover {
    border-color: #d1d5db !important;
    background-color: #f9fafb !important;
  }
`;
document.head.appendChild(style);
