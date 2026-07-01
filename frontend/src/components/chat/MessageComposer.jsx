// src/components/chat/MessageComposer.jsx
import { useRef, useState, useEffect } from "react";
import { Paperclip, Send, X, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import Button from "../ui/Button";
import { fileToBase64, validateImageFile } from "../../utils/fileToBase64";
import { toast } from "../../context/UiContext";

export default function MessageComposer({
  onSend,
  onTypingChange,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
  disabledHint,
}) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (editingMessage) setText(editingMessage.text || "");
  }, [editingMessage]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        // Check if the click was on the emoji button
        if (!e.target.closest("[data-emoji-button]")) {
          setShowEmojiPicker(false);
        }
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (editingMessage) return;
    onTypingChange?.(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTypingChange?.(false), 1800);
  };

  const handleEmojiSelect = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    // Keep picker open for multiple emoji selections
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { valid, error } = validateImageFile(file);
    if (!valid) {
      toast.error(error);
      return;
    }
    const base64 = await fileToBase64(file);
    setImageBase64(base64);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearImage = () => {
    setImageBase64(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingMessage) {
      if (!text.trim()) return;
      await onSaveEdit?.(editingMessage, text.trim());
      setText("");
      return;
    }

    if (!text.trim() && !imageBase64) return;
    setSending(true);
    try {
      await onSend?.({
        text: text.trim(),
        image: imageBase64,
        replyTo: replyingTo?._id,
      });
      setText("");
      clearImage();
      onCancelReply?.();
      onTypingChange?.(false);
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border bg-surface/60 glass p-3 md:p-4">
      <AnimatePresence>
        {(replyingTo || editingMessage) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between bg-elevated rounded-xl px-3 py-2 mb-2 overflow-hidden"
          >
            <div className="text-xs">
              <p className="font-medium text-accent">
                {editingMessage ? "Editing message" : "Replying to message"}
              </p>
              <p className="text-ink-dim truncate max-w-[240px]">
                {(editingMessage || replyingTo)?.text || "Photo"}
              </p>
            </div>
            <button
              onClick={editingMessage ? onCancelEdit : onCancelReply}
              className="text-ink-dim hover:text-ink p-1"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img src={imagePreview} alt="Attachment preview" className="h-20 rounded-lg object-cover" />
          <button
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 bg-danger text-white rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {!editingMessage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full hover:bg-elevated text-ink-dim hover:text-ink transition-colors shrink-0"
            >
              <Paperclip size={19} />
            </button>
          </>
        )}

        <div className="flex-1 relative bg-elevated rounded-2xl flex items-center px-3 py-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-ink-dim hover:text-ink p-1.5 shrink-0 transition-colors"
              data-emoji-button
              tabIndex={-1}
            >
              <Smile size={18} />
            </button>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 mb-2 z-50 rounded-lg overflow-hidden shadow-lg"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  theme="dark"
                  width={280}
                  height={350}
                />
              </div>
            )}
          </div>
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder={disabledHint || "Type a message"}
            className="flex-1 bg-transparent resize-none outline-none text-sm py-2.5 px-1 max-h-32 placeholder:text-ink-dim/60"
            style={{ minHeight: "20px" }}
          />
        </div>

        <Button
          type="submit"
          size="icon"
          isLoading={sending}
          disabled={!text.trim() && !imageBase64}
          className="shrink-0"
        >
          <Send size={17} />
        </Button>
      </form>
    </div>
  );
}