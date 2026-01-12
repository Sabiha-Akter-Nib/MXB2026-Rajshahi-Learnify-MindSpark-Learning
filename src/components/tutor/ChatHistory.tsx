import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, MessageSquare, Trash2, Plus, Loader2, BookOpen, Calculator, Atom, FlaskConical, Globe, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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

// Detect subject from title for icons
const getSubjectIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("math") || lower.includes("গণিত")) return Calculator;
  if (lower.includes("physics") || lower.includes("পদার্থ")) return Atom;
  if (lower.includes("chemistry") || lower.includes("রসায়ন")) return FlaskConical;
  if (lower.includes("bgs") || lower.includes("বাংলাদেশ")) return Globe;
  return MessageSquare;
};

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(conversationId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    
    try {
      // First delete all messages in the conversation
      await supabase
        .from("chat_messages")
        .delete()
        .eq("conversation_id", deleteConfirmId);

      // Then delete the conversation
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", deleteConfirmId);
      
      if (error) throw error;
      
      setConversations(prev => prev.filter(c => c.id !== deleteConfirmId));
      
      if (currentConversationId === deleteConfirmId) {
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
    } finally {
      setDeleteConfirmId(null);
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
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <History className="w-5 h-5" />
              {conversations.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-medium"
                >
                  {conversations.length > 9 ? "9+" : conversations.length}
                </motion.span>
              )}
            </Button>
          </motion.div>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 bg-card/95 backdrop-blur-xl border-border/50">
          <SheetHeader className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              {isBangla ? "চ্যাট ইতিহাস" : "Chat History"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="p-3">
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button 
                onClick={handleNewConversation}
                className="w-full bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isBangla ? "নতুন কথোপকথন" : "New Conversation"}
              </Button>
            </motion.div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-140px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-16 h-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm">
                  {isBangla 
                    ? "এখনো কোনো কথোপকথন নেই। নতুন একটি শুরু করো!" 
                    : "No conversations yet. Start a new one!"}
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                <AnimatePresence>
                  {conversations.map((conversation, index) => {
                    const Icon = getSubjectIcon(conversation.title);
                    const isSelected = currentConversationId === conversation.id;
                    
                    return (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                          isSelected 
                            ? "bg-primary/10 border border-primary/20 shadow-sm" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => handleSelectConversation(conversation.id)}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ scale: 1.1 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDeleteClick(e, conversation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {isBangla ? "চ্যাট মুছে ফেলবেন?" : "Delete this chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBangla 
                ? "এই কথোপকথন এবং এর সমস্ত মেসেজ স্থায়ীভাবে মুছে যাবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।"
                : "This conversation and all its messages will be permanently deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              {isBangla ? "বাতিল" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isBangla ? "মুছে ফেলুন" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};