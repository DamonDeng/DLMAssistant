import React, { CSSProperties } from "react";

// Button Types
export type ButtonType = "primary" | "danger" | null;

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
  useDefaultStyles?: boolean;
}

export function IconButton(props: IconButtonProps) {
  const {
    useDefaultStyles = true,
    className = "",
    ...otherProps
  } = props;

  // Only apply default styles if useDefaultStyles is true
  const buttonStyle: CSSProperties | undefined = useDefaultStyles ? {
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
    backgroundColor: props.type === "primary" ? "#2563eb" : 
                    props.type === "danger" ? "#dc2626" : 
                    "transparent",
    color: props.type === "primary" || props.type === "danger" ? "white" : "inherit",
    ...(props.bordered && { border: "1px solid #e5e7eb" }),
    ...(props.shadow && { boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }),
    ...(props.disabled && {
      opacity: 0.6,
      cursor: "not-allowed",
      pointerEvents: "none"
    })
  } : undefined;

  const classes = [
    "icon-button",
    props.type && `icon-button-${props.type}`,
    props.bordered && "icon-button-bordered",
    className
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
        <div className="icon-button-icon">
          {props.icon}
        </div>
      )}
      {props.text && (
        <div className="icon-button-text">
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
