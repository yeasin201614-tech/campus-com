"use client";

import { useEffect, useState } from "react";
import { CheckCheck, ImagePlus, Plus, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";

export interface ConversationRow {
  id: string;
  title: string;
  is_group: boolean;
  last_message_at: string;
  last_message_preview: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  created_at: string;
}

interface PeerOption {
  id: string;
  full_name: string;
  online_status: boolean;
}

export function MessagesClient({
  userId,
  universityId,
  initialConversations,
  peers,
  initialConvId,
}: {
  userId: string;
  universityId: string | null;
  initialConversations: ConversationRow[];
  peers: PeerOption[];
  initialConvId?: string;
}) {
  const supabase = createBrowserSupabaseClient();
  const [conversations, setConversations] = useState<ConversationRow[]>(initialConversations);
  const [activeId, setActiveId] = useState<string>(initialConvId || initialConversations[0]?.id || "");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedPeer, setSelectedPeer] = useState(peers[0]?.id ?? "");

  useEffect(() => {
    if (!activeId) return;

    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, attachment_url, created_at")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data as MessageRow[]) ?? []);
      });

    const channel = supabase
      .channel(`conv:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          const incoming = payload.new as MessageRow;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, supabase]);

  async function handleStartChat() {
    if (!selectedPeer) return;
    const peerObj = peers.find((p) => p.id === selectedPeer);
    const { data: conv } = await supabase
      .from("conversations")
      .insert({
        university_id: universityId,
        is_group: false,
        title: peerObj?.full_name || "Direct Chat",
        created_by: userId,
      })
      .select()
      .single();

    if (conv) {
      await supabase.from("conversation_members").insert([
        { conversation_id: conv.id, user_id: userId, role: "member" },
        { conversation_id: conv.id, user_id: selectedPeer, role: "member" },
      ]);
      const newConv: ConversationRow = {
        id: conv.id,
        title: conv.title || "Direct Chat",
        is_group: false,
        last_message_at: conv.created_at,
        last_message_preview: "Conversation started",
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(conv.id);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeId,
        sender_id: userId,
        content: text,
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data as MessageRow]
      );
    }
  }

  async function handleImageAttachment(file: File | null) {
    if (!file || !activeId) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${activeId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (!error) {
      const { data: signed } = await supabase.storage
        .from("chat-attachments")
        .createSignedUrl(path, 60 * 60 * 24 * 7);

      await supabase.from("messages").insert({
        conversation_id: activeId,
        sender_id: userId,
        content: "Shared an image",
        attachment_url: signed?.signedUrl ?? path,
        attachment_type: "image",
      });
    }
  }

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">Campus Messages</h1>
          <p className="text-sm text-muted-foreground">
            Real-time encrypted 1-to-1 and group chats isolated by conversation membership.
          </p>
        </div>
        {peers.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedPeer} onChange={(e) => setSelectedPeer(e.target.value)} className="w-48">
              {peers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} {p.online_status ? "●" : ""}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={handleStartChat} className="gap-1.5">
              <Plus className="h-4 w-4" /> New Chat
            </Button>
          </div>
        )}
      </div>

      <Card className="grid min-h-[540px] overflow-hidden md:grid-cols-12">
        <div className="border-r border-border md:col-span-4 divide-y divide-border overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={`flex w-full items-center gap-3 p-4 text-left transition-colors ${
                activeId === c.id ? "bg-purple/10" : "hover:bg-muted/50"
              }`}
            >
              <Avatar name={c.title} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-bold">{c.title}</p>
                  <span className="text-[10px] text-muted-foreground">{formatRelativeTime(c.last_message_at)}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {c.last_message_preview || "Start chatting..."}
                </p>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No conversations yet. Select a campus peer above to start a chat.
            </div>
          )}
        </div>

        <div className="flex flex-col md:col-span-8">
          <div className="border-b border-border px-5 py-3.5 font-bold text-navy dark:text-white">
            {activeConv ? activeConv.title : "Select a conversation"}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5 bg-muted/20">
            {messages.map((m) => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      mine ? "campus-btn-gradient text-white" : "bg-card border border-border"
                    }`}
                  >
                    {m.attachment_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.attachment_url} alt="Attachment" className="mb-2 max-h-48 rounded-xl object-cover" />
                    )}
                    <p>{m.content}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-75">
                      <span>{formatRelativeTime(m.created_at)}</span>
                      {mine && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {activeId && (
            <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border p-3.5">
              <label className="cursor-pointer rounded-xl p-2 hover:bg-muted" aria-label="Attach image">
                <ImagePlus className="h-5 w-5 text-purple" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageAttachment(e.target.files?.[0] ?? null)}
                />
              </label>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
