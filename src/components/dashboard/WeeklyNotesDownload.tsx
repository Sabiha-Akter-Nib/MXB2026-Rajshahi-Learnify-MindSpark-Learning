import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Download, 
  Loader2, 
  Calendar,
  BookOpen,
  Sparkles,
  ChevronDown,
  Check,
  FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

interface WeeklyNote {
  id: string;
  subject_name: string;
  subject_id: string | null;
  week_start: string;
  week_end: string;
  notes_content: any[];
  mcq_content: any[];
}

interface Subject {
  id: string;
  name: string;
  name_bn: string;
  icon: string;
}

interface ConversationMessage {
  role: string;
  content: string;
  created_at: string;
}

const WeeklyNotesDownload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyNotes, setWeeklyNotes] = useState<WeeklyNote[]>([]);
  const [isBangla, setIsBangla] = useState(false);

  // Calculate current week dates
  const getWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("class, version")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsBangla(profile?.version === "bangla");

      // Get subjects for user's class
      const studentClass = profile?.class || 5;
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("id, name, name_bn, icon")
        .lte("min_class", studentClass)
        .gte("max_class", studentClass);

      setSubjects(subjectsData || []);

      // Get existing weekly notes
      const { startOfWeek, endOfWeek } = getWeekDates();
      const { data: notesData } = await supabase
        .from("weekly_notes")
        .select("id, subject_name, subject_id, week_start, week_end, notes_content, mcq_content")
        .eq("user_id", user.id)
        .gte("week_start", startOfWeek.toISOString().split("T")[0])
        .lte("week_end", endOfWeek.toISOString().split("T")[0]);
      
      // Cast the data properly
      const typedNotes: WeeklyNote[] = (notesData || []).map(note => ({
        id: note.id,
        subject_name: note.subject_name,
        subject_id: note.subject_id,
        week_start: note.week_start,
        week_end: note.week_end,
        notes_content: Array.isArray(note.notes_content) ? note.notes_content : [],
        mcq_content: Array.isArray(note.mcq_content) ? note.mcq_content : [],
      }));

      setWeeklyNotes(typedNotes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async (subjectId: string) => {
    if (!user) return;
    setIsGenerating(true);

    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) throw new Error("Subject not found");

      const { startOfWeek, endOfWeek } = getWeekDates();

      // Get all conversations for this week
      const { data: allConversations } = await supabase
        .from("chat_conversations")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .gte("updated_at", startOfWeek.toISOString())
        .lte("updated_at", endOfWeek.toISOString())
        .order("updated_at", { ascending: false });

      // Filter conversations that match the selected subject by title
      const subjectKeywords = [
        subject.name.toLowerCase(),
        subject.name_bn?.toLowerCase() || "",
        // Add common variations
        subject.name.replace(/\s+/g, "").toLowerCase(),
      ].filter(Boolean);

      const filteredConversations = (allConversations || []).filter(conv => {
        const titleLower = conv.title.toLowerCase();
        return subjectKeywords.some(keyword => 
          keyword && titleLower.includes(keyword)
        );
      });

      // If no subject-specific conversations, check for any conversations
      const conversationsToUse = filteredConversations.length > 0 
        ? filteredConversations 
        : allConversations || [];

      if (!conversationsToUse || conversationsToUse.length === 0) {
        toast({
          title: isBangla ? "কোনো নোট নেই" : "No Notes Found",
          description: isBangla 
            ? "এই সপ্তাহে কোনো AI Tutor কথোপকথন পাওয়া যায়নি।"
            : "No AI Tutor conversations found for this week.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Get messages from filtered conversations
      let allMessages: ConversationMessage[] = [];
      const conversationTitles: string[] = [];
      
      for (const conv of conversationsToUse) {
        conversationTitles.push(conv.title);
        const { data: messages } = await supabase
          .from("chat_messages")
          .select("role, content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });
        
        if (messages) {
          allMessages = [...allMessages, ...messages];
        }
      }

      // Get assessments for this subject this week
      const { data: assessments } = await supabase
        .from("assessments")
        .select("topic, bloom_level, correct_answers, total_questions, xp_earned, completed_at")
        .eq("user_id", user.id)
        .eq("subject_id", subjectId)
        .gte("created_at", startOfWeek.toISOString())
        .lte("created_at", endOfWeek.toISOString())
        .order("completed_at", { ascending: true });

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Header with gradient effect (simulated with colors)
      doc.setFillColor(74, 144, 226);
      doc.rect(0, 0, pageWidth, 45, "F");
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(`Weekly Study Notes`, pageWidth / 2, 18, { align: "center" });
      
      doc.setFontSize(16);
      doc.text(isBangla ? subject.name_bn || subject.name : subject.name, pageWidth / 2, 28, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        pageWidth / 2,
        38,
        { align: "center" }
      );

      yPos = 55;
      doc.setTextColor(0, 0, 0);

      // Summary Stats Box
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, "F");
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const totalConversations = conversationsToUse.length;
      const totalAssessments = assessments?.length || 0;
      const totalXP = assessments?.reduce((sum, a) => sum + a.xp_earned, 0) || 0;
      
      doc.text(`📚 ${totalConversations} Conversations`, margin + 10, yPos + 10);
      doc.text(`📝 ${totalAssessments} Assessments`, margin + 80, yPos + 10);
      doc.text(`⭐ ${totalXP} XP Earned`, margin + 150, yPos + 10);
      
      yPos += 35;

      // Topics Covered Section
      if (conversationTitles.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(74, 144, 226);
        doc.text("📖 Topics Covered This Week", margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        
        const uniqueTopics = [...new Set(conversationTitles)].slice(0, 8);
        for (const topic of uniqueTopics) {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          const truncatedTopic = topic.length > 60 ? topic.slice(0, 60) + "..." : topic;
          doc.text(`• ${truncatedTopic}`, margin + 5, yPos);
          yPos += 6;
        }
        yPos += 5;
      }

      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // AI Tutor Learning Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(74, 144, 226);
      doc.text("🤖 AI Tutor Learning Summary", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);

      // Extract key topics from assistant messages
      const assistantMessages = allMessages
        .filter(m => m.role === "assistant")
        .slice(0, 15);

      if (assistantMessages.length === 0) {
        doc.setTextColor(150, 150, 150);
        doc.text("No learning sessions recorded this week.", margin, yPos);
        yPos += 10;
      } else {
        for (let i = 0; i < assistantMessages.length; i++) {
          const msg = assistantMessages[i];
          // Clean and format content
          let content = msg.content
            .replace(/\*\*/g, "")
            .replace(/###/g, "")
            .replace(/\n\n+/g, "\n")
            .trim();
          
          // Take meaningful excerpt (first 400 chars or first complete paragraph)
          const firstPara = content.split("\n")[0];
          content = firstPara.length > 400 ? firstPara.slice(0, 400) + "..." : firstPara;
          
          if (content.length < 20) continue; // Skip very short messages
          
          const lines = doc.splitTextToSize(content, pageWidth - margin * 2 - 10);
          
          // Check if we need a new page
          if (yPos + lines.length * 5 > 275) {
            doc.addPage();
            yPos = 20;
          }
          
          // Add message number indicator
          doc.setFillColor(74, 144, 226);
          doc.circle(margin + 3, yPos - 1.5, 2, "F");
          
          doc.setTextColor(50, 50, 50);
          doc.text(lines, margin + 10, yPos);
          yPos += lines.length * 5 + 8;
        }
      }

      // Add separator before assessments
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      yPos += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Assessment Results
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(74, 144, 226);
      doc.text("📊 Assessment Performance", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      if (!assessments || assessments.length === 0) {
        doc.setTextColor(150, 150, 150);
        doc.text("No assessments completed this week for this subject.", margin, yPos);
        yPos += 10;
      } else {
        for (const assessment of assessments) {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          
          const percentage = Math.round((assessment.correct_answers / assessment.total_questions) * 100);
          const emoji = percentage >= 80 ? "🌟" : percentage >= 60 ? "✅" : "📝";
          
          doc.setTextColor(50, 50, 50);
          const line = `${emoji} ${assessment.topic || "General Quiz"} (${assessment.bloom_level})`;
          doc.text(line, margin, yPos);
          
          // Score bar
          const barX = margin + 120;
          const barWidth = 40;
          doc.setFillColor(230, 230, 230);
          doc.roundedRect(barX, yPos - 3, barWidth, 5, 1, 1, "F");
          
          const fillColor = percentage >= 80 ? [76, 175, 80] : percentage >= 60 ? [255, 193, 7] : [255, 87, 34];
          doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
          doc.roundedRect(barX, yPos - 3, barWidth * (percentage / 100), 5, 1, 1, "F");
          
          doc.text(`${assessment.correct_answers}/${assessment.total_questions} (${percentage}%)`, barX + barWidth + 5, yPos);
          
          yPos += 10;
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated by MindSpark Learning | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          290,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `${subject.name.replace(/\s+/g, "_")}_Weekly_Notes_${startOfWeek.toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      // Save to database for tracking
      const notesContent = assistantMessages.map(m => ({ 
        content: m.content.slice(0, 500), 
        date: m.created_at 
      }));

      await supabase.from("weekly_notes").upsert({
        user_id: user.id,
        subject_id: subjectId,
        subject_name: subject.name,
        week_start: startOfWeek.toISOString().split("T")[0],
        week_end: endOfWeek.toISOString().split("T")[0],
        notes_content: notesContent,
        mcq_content: assessments || [],
      }, { onConflict: "user_id,subject_id,week_start" });

      toast({
        title: isBangla ? "PDF ডাউনলোড হয়েছে! ✨" : "PDF Downloaded! ✨",
        description: isBangla 
          ? `${subject.name_bn || subject.name} এর সাপ্তাহিক নোট ডাউনলোড হয়েছে।`
          : `Your weekly notes for ${subject.name} have been downloaded.`,
      });

      // Refresh notes list
      fetchData();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: isBangla 
          ? "PDF তৈরি করতে ব্যর্থ হয়েছে।"
          : "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const { startOfWeek, endOfWeek } = getWeekDates();

  if (isLoading) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-card/80 to-accent/5 backdrop-blur-sm border-border/50 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <FileText className="w-5 h-5 text-accent" />
              </motion.div>
              <div>
                <span className="block">
                  {isBangla ? "সাপ্তাহিক নোট ডাউনলোড" : "Weekly Notes Download"}
                </span>
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}
                </span>
              </div>
            </CardTitle>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              <Sparkles className="w-3 h-3 mr-1" />
              {isBangla ? "নতুন" : "New"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <p className="text-sm text-muted-foreground">
            {isBangla 
              ? "প্রতি সপ্তাহে তোমার AI Tutor কথোপকথন এবং MCQ থেকে PDF নোট ডাউনলোড করো।"
              : "Download PDF notes from your AI Tutor conversations and MCQs each week."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="flex-1 bg-background/50">
                <SelectValue placeholder={isBangla ? "বিষয় নির্বাচন করো" : "Select Subject"} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      {isBangla ? subject.name_bn || subject.name : subject.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => selectedSubject && generatePDF(selectedSubject)}
              disabled={!selectedSubject || isGenerating}
              className="gap-2 bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isBangla ? "তৈরি হচ্ছে..." : "Generating..."}
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  {isBangla ? "PDF ডাউনলোড" : "Download PDF"}
                </>
              )}
            </Button>
          </div>

          {/* Previously downloaded notes */}
          {weeklyNotes.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">
                {isBangla ? "এই সপ্তাহে তৈরি করা নোট:" : "Notes generated this week:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {weeklyNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 px-2 py-1 bg-success/10 rounded-full text-xs text-success"
                  >
                    <Check className="w-3 h-3" />
                    {note.subject_name}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeeklyNotesDownload;
