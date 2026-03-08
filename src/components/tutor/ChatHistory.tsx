import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, MessageSquare, Plus, Loader2, BookOpen, Calculator, Atom, FlaskConical, Globe, Pencil, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const getSubjectIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("math") || lower.includes("গণিত") || lower.includes("mathematics")) return Calculator;
  if (lower.includes("physics") || lower.includes("পদার্থ")) return Atom;
  if (lower.includes("chemistry") || lower.includes("রসায়ন")) return FlaskConical;
  if (lower.includes("bgs") || lower.includes("বাংলাদেশ") || lower.includes("bangladesh")) return Globe;
  if (lower.includes("bangla") || lower.includes("বাংলা") || lower.includes("english") || lower.includes("ইংরেজি")) return BookOpen;
  return MessageSquare;
};

const getSubjectGradient = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("math") || lower.includes("গণিত")) return "from-[hsl(220,70%,55%)] to-[hsl(240,60%,65%)]";
  if (lower.includes("physics") || lower.includes("পদার্থ")) return "from-[hsl(270,55%,55%)] to-[hsl(280,50%,65%)]";
  if (lower.includes("chemistry") || lower.includes("রসায়ন")) return "from-[hsl(152,60%,42%)] to-[hsl(160,50%,52%)]";
  if (lower.includes("bgs") || lower.includes("বাংলাদেশ")) return "from-[hsl(25,80%,55%)] to-[hsl(35,75%,60%)]";
  if (lower.includes("bangla") || lower.includes("বাংলা")) return "from-[hsl(0,65%,55%)] to-[hsl(340,60%,60%)]";
  if (lower.includes("english") || lower.includes("ইংরেজি")) return "from-[hsl(230,60%,55%)] to-[hsl(245,55%,65%)]";
  return "from-primary to-primary-light";
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
    if (isOpen) fetchConversations();
  }, [isOpen, userId]);

  const handleEditClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveTitle = async (conversationId: string) => {
    if (!editingTitle.trim()) { setEditingId(null); return; }
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ title: editingTitle.trim() })
        .eq("id", conversationId);
      if (error) throw error;
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title: editingTitle.trim() } : c));
      toast({ title: isBangla ? "নাম পরিবর্তন হয়েছে" : "Renamed" });
    } catch {
      toast({ title: isBangla ? "ত্রুটি" : "Error", variant: "destructive" });
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-primary/10 transition-colors">
            <History className="w-5 h-5" />
            {conversations.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-primary to-primary-light text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold shadow-lg"
              >
                {conversations.length}
              </motion.span>
            )}
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 border-border/30 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(270 30% 12%) 0%, hsl(240 20% 8%) 100%)",
        }}
      >
        <SheetHeader className="p-5 border-b border-white/5">
          <SheetTitle className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-lg"
              style={{ boxShadow: "0 4px 20px hsl(270 55% 55% / 0.4)" }}
            >
              <History className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold">
              {isBangla ? "চ্যাট ইতিহাস" : "Chat History"}
            </span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="p-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={handleNewConversation}
              className="w-full rounded-2xl font-heading font-bold"
              style={{
                background: "linear-gradient(135deg, hsl(270 60% 50%) 0%, hsl(200 80% 60%) 100%)",
                boxShadow: "0 4px 24px hsl(270 55% 55% / 0.35)",
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isBangla ? "নতুন কথোপকথন" : "New Conversation"}
            </Button>
          </motion.div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-160px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-light" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-6">
              <motion.div 
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "hsl(270 30% 20%)" }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <MessageSquare className="w-8 h-8 text-primary-light/50" />
              </motion.div>
              <p className="text-white/40 text-sm font-heading">
                {isBangla ? "এখনো কোনো কথোপকথন নেই" : "No conversations yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 p-3">
              <AnimatePresence>
                {conversations.map((conversation, index) => {
                  const Icon = getSubjectIcon(conversation.title);
                  const gradient = getSubjectGradient(conversation.title);
                  const isSelected = currentConversationId === conversation.id;
                  const isEditing = editingId === conversation.id;
                  
                  return (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ x: 3 }}
                      className={cn(
                        "group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all",
                        isSelected 
                          ? "bg-white/10 border border-white/10" 
                          : "hover:bg-white/5"
                      )}
                      onClick={() => !isEditing && handleSelectConversation(conversation.id)}
                    >
                      <motion.div 
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-lg",
                          gradient
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
                              className="h-7 text-sm py-0 px-2 bg-white/10 border-white/20 text-white"
                              autoFocus
                            />
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10"
                              onClick={(e) => { e.stopPropagation(); handleSaveTitle(conversation.id); }}
                            >
                              <Check className="w-3.5 h-3.5 text-[hsl(152,60%,55%)]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10"
                              onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                            >
                              <X className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate text-white/90 font-heading">
                              {conversation.title}
                            </p>
                            <p className="text-[11px] text-white/35 font-heading">
                              {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                            </p>
                          </>
                        )}
                      </div>
                      
                      {!isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.div whileHover={{ scale: 1.1 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80"
                              onClick={(e) => handleEditClick(e, conversation)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
  );
};
