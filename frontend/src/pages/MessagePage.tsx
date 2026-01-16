import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import { useAuth } from "../auth/AuthContext";
import { Send } from "lucide-react";
import type { ChatMessage } from "../types/user";
import "../style/message.css";




export function MessagePage() {
  const { tripId } = useParams();
  const { token } = useAuth();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const currentUserId = useMemo(() => {
    if (!token) return null;
    try {
      const payloadPart = token.split(".")[1];
      if (!payloadPart) return null;
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const json = atob(padded);
      const payload = JSON.parse(json) as { sub?: number | string };
      const sub = payload.sub;
      if (typeof sub === "number") return sub;
      if (typeof sub === "string") return Number(sub);
      return null;
    } catch {
      return null;
    }
  }, [token]);

  const messagesQuery = useQuery({
    queryKey: ["messages", tripId],
    enabled: Boolean(token && tripId),
    queryFn: async () => {
      if (!token) throw new Error("Non authentifié");
      return apiFetch<ChatMessage[]>(`/api/messages/trip/${tripId}`, { token });
    },
    refetchInterval: 5000,
  });

  const messages = messagesQuery.data ?? [];

  // Auto-scroll vers le bas quand un message arrive
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages.length]);

  // 2. Envoyer un message
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Non authentifié");
      if (!tripId) throw new Error("Trip invalide");
      return apiFetch<ChatMessage>("/api/messages", {
        method: "POST",
        token,
        body: { tripId, content: text },
      });
    },
    onSuccess: async () => {
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["messages", tripId] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMutation.mutate();
  };

  if (!token) return <p>Connecte-toi pour accéder à la messagerie.</p>;
  if (messagesQuery.isLoading) return <p>Chargement…</p>;
  if (messagesQuery.isError) return <div className="gc-alert">Erreur chargement messages</div>;

  return (
    <div className="chat-container">
      <header className="chat-header-info">
        <h3>Discussion du trajet #{tripId}</h3>
      </header>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg) => {
          const isMe = currentUserId != null && msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`message-bubble ${isMe ? "sent" : "received"}`}>
              {!isMe && <small className="sender-name">{msg.sender.firstName}</small>}
              <p>{msg.content}</p>
              <span className="timestamp">
                {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Votre message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-send" aria-label="Envoyer le message" disabled={!text.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}