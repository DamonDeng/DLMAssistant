import React, { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

interface PreCodeProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode;
}

function PreCode({ children, ...props }: PreCodeProps) {
  const ref = useRef<HTMLPreElement>(null);

  return (
    <pre ref={ref} {...props}>
      <button
        className="copy-code-button"
        onClick={() => {
          if (ref.current) {
            const code = ref.current.innerText;
            navigator.clipboard.writeText(code);
          }
        }}
      >
        Copy
      </button>
      {children}
    </pre>
  );
}

interface MarkdownProps {
  content: string;
  loading?: boolean;
  fontSize?: number;
  defaultShow?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDoubleClickCapture?: (e: React.MouseEvent) => void;
}

export function Markdown(props: MarkdownProps) {
  const mdRef = useRef<HTMLDivElement>(null);

  if (props.loading) {
    return <div className="loading-markdown">Loading...</div>;
  }

  return (
    <div
      className="markdown-body"
      style={{
        fontSize: `${props.fontSize ?? 14}px`,
      }}
      ref={mdRef}
      onContextMenu={props.onContextMenu}
      onDoubleClickCapture={props.onDoubleClickCapture}
      dir="auto"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[
          [
            rehypeHighlight,
            {
              detect: true,
              ignoreMissing: true,
            },
          ],
        ]}
        components={{
          pre: ({ children, ...props }) => <PreCode {...props}>{children}</PreCode>,
          p: ({ children, ...props }) => <p dir="auto" {...props}>{children}</p>,
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {props.content}
      </ReactMarkdown>
    </div>
  );
}

// Add CSS for markdown styling
const style = document.createElement("style");
style.textContent = `
  .markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.6;
    word-wrap: break-word;
    padding: 0;
  }

  .markdown-body pre {
    position: relative;
    padding: 16px;
    background-color: #f6f8fa;
    border-radius: 6px;
    margin: 8px 0;
    overflow: auto;
  }

  .markdown-body code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  }

  .markdown-body pre code {
    padding: 0;
    margin: 0;
    font-size: 100%;
    word-break: normal;
    white-space: pre;
    background: transparent;
    border: 0;
  }

  .copy-code-button {
    position: absolute;
    right: 8px;
    top: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    background-color: white;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .markdown-body pre:hover .copy-code-button {
    opacity: 1;
  }

  .copy-code-button:hover {
    background-color: #f3f4f6;
  }

  .loading-markdown {
    color: #6b7280;
    font-style: italic;
    padding: 8px 0;
  }

  .markdown-body p {
    margin: 0 0 16px 0;
  }

  .markdown-body p:last-child {
    margin-bottom: 0;
  }

  .markdown-body a {
    color: #2563eb;
    text-decoration: none;
  }

  .markdown-body a:hover {
    text-decoration: underline;
  }

  .markdown-body img {
    max-width: 100%;
    border-radius: 6px;
  }

  .markdown-body ul, .markdown-body ol {
    padding-left: 2em;
    margin: 16px 0;
  }

  .markdown-body blockquote {
    margin: 0 0 16px 0;
    padding: 0 1em;
    color: #57606a;
    border-left: 0.25em solid #d0d7de;
  }

  .markdown-body table {
    border-spacing: 0;
    border-collapse: collapse;
    margin: 16px 0;
    width: 100%;
  }

  .markdown-body table th,
  .markdown-body table td {
    padding: 6px 13px;
    border: 1px solid #d0d7de;
  }

  .markdown-body table tr {
    background-color: #ffffff;
    border-top: 1px solid #d0d7de;
  }

  .markdown-body table tr:nth-child(2n) {
    background-color: #f6f8fa;
  }

  /* Additional styles for better readability */
  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4,
  .markdown-body h5,
  .markdown-body h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }

  .markdown-body h1 {
    font-size: 2em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #eaecef;
  }

  .markdown-body h2 {
    font-size: 1.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #eaecef;
  }

  .markdown-body h3 {
    font-size: 1.25em;
  }

  .markdown-body h4 {
    font-size: 1em;
  }

  .markdown-body h5 {
    font-size: 0.875em;
  }

  .markdown-body h6 {
    font-size: 0.85em;
    color: #6a737d;
  }

  .markdown-body hr {
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: #e1e4e8;
    border: 0;
  }
`;
document.head.appendChild(style);
