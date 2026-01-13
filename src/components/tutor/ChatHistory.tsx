import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, MessageSquare, Trash2, Plus, Loader2, BookOpen, Calculator, Atom, FlaskConical, Globe, AlertTriangle, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
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
  if (lower.includes("math") || lower.includes("গণিত") || lower.includes("mathematics")) return Calculator;
  if (lower.includes("physics") || lower.includes("পদার্থ")) return Atom;
  if (lower.includes("chemistry") || lower.includes("রসায়ন")) return FlaskConical;
  if (lower.includes("bgs") || lower.includes("বাংলাদেশ") || lower.includes("bangladesh")) return Globe;
  if (lower.includes("bangla") || lower.includes("বাংলা") || lower.includes("english") || lower.includes("ইংরেজি")) return BookOpen;
  return MessageSquare;
};

// Get subject color based on title
const getSubjectColor = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("math") || lower.includes("গণিত")) return "from-blue-500 to-blue-600";
  if (lower.includes("physics") || lower.includes("পদার্থ")) return "from-purple-500 to-purple-600";
  if (lower.includes("chemistry") || lower.includes("রসায়ন")) return "from-green-500 to-green-600";
  if (lower.includes("bgs") || lower.includes("বাংলাদেশ")) return "from-orange-500 to-orange-600";
  if (lower.includes("bangla") || lower.includes("বাংলা")) return "from-red-500 to-red-600";
  if (lower.includes("english") || lower.includes("ইংরেজি")) return "from-indigo-500 to-indigo-600";
  return "from-primary to-primary/80";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
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

  const handleEditClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveTitle = async (conversationId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ title: editingTitle.trim() })
        .eq("id", conversationId);

      if (error) throw error;

      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, title: editingTitle.trim() } : c)
      );

      toast({
        title: isBangla ? "নাম পরিবর্তন হয়েছে" : "Renamed",
        description: isBangla ? "চ্যাটের নাম পরিবর্তন করা হয়েছে" : "Chat renamed successfully",
      });
    } catch (error) {
      console.error("Error renaming conversation:", error);
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: isBangla ? "নাম পরিবর্তন করতে পারিনি" : "Failed to rename",
        variant: "destructive",
      });
    } finally {
      setEditingId(null);
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
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-primary/10 transition-colors">
              <History className="w-5 h-5" />
              {conversations.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg"
                >
                  {conversations.length > 9 ? "9+" : conversations.length}
                </motion.span>
              )}
            </Button>
          </motion.div>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 bg-card/95 backdrop-blur-xl border-border/50">
          <SheetHeader className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <SheetTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <History className="w-4 h-4 text-primary-foreground" />
              </div>
              {isBangla ? "চ্যাট ইতিহাস" : "Chat History"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="p-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={handleNewConversation}
                className="w-full bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
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
                <motion.div 
                  className="w-16 h-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
                </motion.div>
                <p className="text-muted-foreground text-sm">
                  {isBangla 
                    ? "এখনো কোনো কথোপকথন নেই। নতুন একটি শুরু করো!" 
                    : "No conversations yet. Start a new one!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                <AnimatePresence>
                  {conversations.map((conversation, index) => {
                    const Icon = getSubjectIcon(conversation.title);
                    const colorClass = getSubjectColor(conversation.title);
                    const isSelected = currentConversationId === conversation.id;
                    const isEditing = editingId === conversation.id;
                    
                    return (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className={cn(
                          "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                          isSelected 
                            ? "bg-primary/15 border border-primary/25 shadow-lg shadow-primary/10" 
                            : "hover:bg-muted/60"
                        )}
                        onClick={() => !isEditing && handleSelectConversation(conversation.id)}
                      >
                        <motion.div 
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all bg-gradient-to-br shadow-lg",
                            colorClass
                          )}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTitle(conversation.id);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                className="h-7 text-sm py-0 px-2"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveTitle(conversation.id);
                                }}
                              >
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(null);
                                }}
                              >
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium truncate">
                                {conversation.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                              </p>
                            </>
                          )}
                        </div>
                        
                        {!isEditing && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.div whileHover={{ scale: 1.1 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                onClick={(e) => handleEditClick(e, conversation)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                onClick={(e) => handleDeleteClick(e, conversation.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </motion.div>
                          </div>
                        )}
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
              <div className="p-2 rounded-xl bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              {isBangla ? "এই চ্যাট মুছে ফেলবেন?" : "Delete this chat?"}
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
