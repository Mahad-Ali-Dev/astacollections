"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const WHATSAPP_NUMBER = "923264348024";
const WHATSAPP_DISPLAY = "+92 326 4348024";

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [message, setMessage] = useState("Hi! I have a question about a piece on your store.");

  useEffect(() => {
    // Show a soft tooltip a moment after page load (only once per session)
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("asta_wa_tooltip_seen")) return;
    const t = setTimeout(() => {
      setShowTooltip(true);
      sessionStorage.setItem("asta_wa_tooltip_seen", "1");
      setTimeout(() => setShowTooltip(false), 6000);
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  const sendMessage = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <>
      {/* Tooltip bubble */}
      {showTooltip && !open && (
        <div className="fixed bottom-24 right-6 z-40 bg-white border border-border rounded-2xl shadow-xl px-4 py-3 max-w-[260px] animate-in slide-in-from-bottom-3 fade-in duration-500">
          <button
            onClick={() => setShowTooltip(false)}
            aria-label="Dismiss"
            className="absolute -top-2 -right-2 w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-accent transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="text-sm font-medium">Need help?</p>
          <p className="text-xs text-muted-foreground mt-1">
            Chat with us on WhatsApp — we usually reply in minutes.
          </p>
          <div className="absolute -bottom-1.5 right-7 w-3 h-3 bg-white border-r border-b border-border rotate-45" />
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 bg-white border border-border rounded-3xl shadow-2xl w-[340px] max-w-[calc(100vw-3rem)] overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300">
          {/* Header */}
          <div className="bg-green-600 text-white p-5 relative">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur w-11 h-11 rounded-full flex items-center justify-center text-xl">
                💬
              </div>
              <div>
                <p className="font-medium">Asta Collections</p>
                <p className="text-xs text-white/85 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                  Online · Replies in minutes
                </p>
              </div>
            </div>
          </div>

          {/* Message preview */}
          <div className="p-5 bg-secondary/40 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">Hi 👋 How can we help?</p>
            <div className="bg-white rounded-2xl rounded-bl-md p-3 shadow-sm">
              <p className="text-sm">
                Welcome to Asta Collections! Send us a message and we&apos;ll get back to you on
                WhatsApp.
              </p>
              <p className="text-[10px] text-muted-foreground mt-2 text-right">Just now</p>
            </div>
          </div>

          {/* Compose */}
          <div className="p-4 space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-2xl border border-border bg-white text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="w-full h-11 bg-green-600 text-white rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              Send via WhatsApp
            </button>
            <p className="text-[10px] text-center text-muted-foreground">
              Opens WhatsApp · {WHATSAPP_DISPLAY}
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open WhatsApp support"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 md:w-16 md:h-16 bg-green-500 text-white rounded-full shadow-2xl hover:bg-green-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-green-500 opacity-60 animate-ping" />
        )}
        {open ? (
          <X className="h-6 w-6 relative z-10" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7 md:h-8 md:w-8 fill-current relative z-10" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7 0-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.8-1.6-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5l.3-.5c.1-.2 0-.4-.1-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5 2.5 1 2.9.7 3.4.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4Zm-5.5 7.5c-1.7 0-3.4-.5-4.9-1.4l-.3-.2-3.6.9.9-3.5-.2-.4c-1-1.5-1.5-3.3-1.5-5.1 0-5.4 4.4-9.7 9.7-9.7 2.6 0 5 1 6.9 2.8 1.8 1.8 2.9 4.3 2.9 6.9-.1 5.3-4.5 9.7-9.9 9.7Zm8.2-17.9C18 1.9 15 .8 12 .8 5.5.8.2 6 .2 12.5c0 2.1.5 4.1 1.6 5.9L.1 24l5.7-1.5c1.7.9 3.6 1.4 5.5 1.4 6.5 0 11.8-5.3 11.8-11.8.1-3.1-1.1-6.1-3.4-8.3Z" />
          </svg>
        )}
      </button>
    </>
  );
}
