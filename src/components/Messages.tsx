import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageCircle, Send, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  message: string;
  created_at: string;
  read_at: string | null;
  sender: {
    id: string;
    name: string;
  };
  receiver: {
    id: string;
    name: string;
  };
}

interface MessagesProps {
  applicationId: string;
  dancerId: string;
  organizerId: string;
  dancerName: string;
  organizerName: string;
  eventName: string;
}

export const Messages = ({ 
  applicationId, 
  dancerId, 
  organizerId, 
  dancerName, 
  organizerName, 
  eventName 
}: MessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`messages-${applicationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `application_id=eq.${applicationId}`
        }, 
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [applicationId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, name),
          receiver:profiles!messages_receiver_id_fkey(id, name)
        `)
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Messages fetch error:", error);
        // If table doesn't exist, just show empty state
        if (error.code === 'PGRST116' || error.message.includes('relation "messages" does not exist')) {
          setMessages([]);
          return;
        }
        throw error;
      }

      setMessages(data || []);
      
      // Mark messages as read if current user is the receiver
      if (currentUserId && data) {
        const unreadMessages = data.filter(
          msg => msg.receiver_id === currentUserId && !msg.read_at
        );
        
        if (unreadMessages.length > 0) {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      }
    } catch (error: any) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    setIsSending(true);
    try {
      const receiverId = currentUserId === dancerId ? organizerId : dancerId;
      
      const { error } = await supabase
        .from("messages")
        .insert({
          application_id: applicationId,
          sender_id: currentUserId,
          receiver_id: receiverId,
          message: newMessage.trim()
        });

      if (error) {
        console.error("Send message error:", error);
        // If table doesn't exist, show helpful message
        if (error.code === 'PGRST116' || error.message.includes('relation "messages" does not exist')) {
          toast.error("Messaging system is not set up yet. Please contact support.");
          return;
        }
        throw error;
      }

      setNewMessage("");
      await fetchMessages();
      toast.success("Message sent!");
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-2/3 mb-2" />
          <div className="h-4 bg-muted rounded w-4/5" />
        </div>
      </div>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="w-5 h-5" />
          Messages
        </CardTitle>
        <CardDescription>
          Communication for {eventName} - {dancerName} & {organizerName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Messages Display */}
        <div className="flex-1 overflow-y-auto space-y-3 max-h-48">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        {message.sender.name}
                      </span>
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    {message.read_at && isOwnMessage && (
                      <div className="text-xs opacity-70 mt-1">
                        ✓ Read
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="message">Send a message</Label>
          <div className="flex gap-2">
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
