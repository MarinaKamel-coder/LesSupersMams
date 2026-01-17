import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import { useAuth } from "../auth/AuthContext";
import { getSocket } from "../services/socket";
import { Send } from "lucide-react";
import type { ChatMessage } from "../types/user";
import "../style/message.css";




export function MessagePage() {
  const { tripId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [tripIdInput, setTripIdInput] = useState("");
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

  useEffect(() => {
    if (!token || !tripId) return;
    const socket = getSocket(token);
    if (!socket) return;

    const numericTripId = Number(tripId);
    if (!Number.isFinite(numericTripId)) return;

    socket.emit("trip:join", numericTripId);

    const onMessage = async (payload: unknown) => {
      const payloadTripId =
        payload && typeof payload === "object" && "tripId" in payload
          ? Number((payload as { tripId?: unknown }).tripId)
          : null;
      if (payloadTripId !== numericTripId) return;
      await queryClient.invalidateQueries({ queryKey: ["messages", tripId] });
    };

    socket.on("message:new", onMessage);
    return () => {
      socket.emit("trip:leave", numericTripId);
      socket.off("message:new", onMessage);
    };
  }, [queryClient, token, tripId]);

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

  if (!tripId) {
    return (
      <div className="gc-card">
        <div className="gc-cardBody" style={{ display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0 }}>Messagerie</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Pour envoyer un message, ouvre d’abord un trajet (ex: depuis “Mes réservations” ou “Réserver”),
            puis clique sur le bouton “Messages”.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="gc-btn gc-btnPrimary" onClick={() => navigate("/my-bookings")}>
              Mes réservations
            </button>
            <button type="button" className="gc-btn gc-btnSecondary" onClick={() => navigate("/booking")}>
              Réserver
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(tripIdInput);
              if (!Number.isFinite(n) || n <= 0) return;
              navigate(`/messages/${n}`);
            }}
            style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
          >
            <input
              inputMode="numeric"
              placeholder="ID du trajet (ex: 12)"
              value={tripIdInput}
              onChange={(e) => setTripIdInput(e.target.value)}
              style={{ maxWidth: 220 }}
            />
            <button type="submit">Ouvrir</button>
          </form>
        </div>
      </div>
    );
  }

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