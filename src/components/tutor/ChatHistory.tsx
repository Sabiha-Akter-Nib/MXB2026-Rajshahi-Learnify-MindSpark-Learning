import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, X, MessageSquare, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatHistoryProps {
  userId: string;
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  isBangla?: boolean;
}

export const ChatHistory = ({
  userId,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isBangla = false,
}: ChatHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchConversations = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, userId]);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", conversationId);
      
      if (error) throw error;
      
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        onNewConversation();
      }
      
      toast({
        title: isBangla ? "মুছে ফেলা হয়েছে" : "Deleted",
        description: isBangla ? "কথোপকথন মুছে ফেলা হয়েছে" : "Conversation deleted",
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: isBangla ? "মুছতে পারিনি" : "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    onSelectConversation(conversationId);
    setIsOpen(false);
  };

  const handleNewConversation = () => {
    onNewConversation();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <History className="w-5 h-5" />
          {conversations.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
              {conversations.length > 9 ? "9+" : conversations.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {isBangla ? "চ্যাট ইতিহাস" : "Chat History"}
          </SheetTitle>
        </SheetHeader>
        
        <div className="p-3">
          <Button 
            onClick={handleNewConversation}
            className="w-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isBangla ? "নতুন কথোপকথন" : "New Conversation"}
          </Button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">
                {isBangla 
                  ? "এখনো কোনো কথোপকথন নেই। নতুন একটি শুরু করো!" 
                  : "No conversations yet. Start a new one!"}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              <AnimatePresence>
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`
                      group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors
                      ${currentConversationId === conversation.id 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-muted/50"}
                    `}
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(e, conversation.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
