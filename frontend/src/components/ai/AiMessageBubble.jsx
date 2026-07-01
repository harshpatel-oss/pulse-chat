// src/components/ai/AiMessageBubble.jsx
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Avatar from "../ui/Avatar";
import { formatMessageTime } from "../../utils/formatTime";
import { cn } from "../../utils/misc";

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const language = /language-(\w+)/.exec(className || "")?.[1] || "text";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative my-2 rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-elevated px-3 py-1.5 text-xs text-ink-dim">
        <span className="font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-ink transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, fontSize: "13px", padding: "14px" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default function AiMessageBubble({ message, userAvatar, userName }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3 max-w-3xl mx-auto w-full")}
    >
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <Avatar src={userAvatar} name={userName} size={32} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center text-white">
            <Sparkles size={14} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{isUser ? "You" : "Assistant"}</span>
          <span className="text-[11px] text-ink-dim">{formatMessageTime(message.createdAt)}</span>
        </div>
        <div className="prose-sm max-w-none text-sm leading-relaxed [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:pl-5 [&_ol]:list-decimal [&_a]:text-accent [&_strong]:font-semibold">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children }) {
                if (inline) {
                  return (
                    <code className="bg-elevated px-1.5 py-0.5 rounded text-[13px] font-mono">
                      {children}
                    </code>
                  );
                }
                return <CodeBlock className={className}>{children}</CodeBlock>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
