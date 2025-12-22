import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SessionData {
  subjectId?: string;
  topic?: string;
  bloomLevel?: string;
}

export const useStudySession = () => {
  const { user } = useAuth();
  const startTimeRef = useRef<Date | null>(null);
  const sessionDataRef = useRef<SessionData>({});
  const xpAccumulatedRef = useRef(0);

  const startSession = useCallback((data?: SessionData) => {
    startTimeRef.current = new Date();
    sessionDataRef.current = data || {};
    xpAccumulatedRef.current = 0;
  }, []);

  const addXP = useCallback((amount: number) => {
    xpAccumulatedRef.current += amount;
  }, []);

  const endSession = useCallback(async () => {
    if (!user || !startTimeRef.current) return;

    const endTime = new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - startTimeRef.current.getTime()) / 60000
    );

    // Minimum 1 minute to count
    if (durationMinutes < 1) return;

    // Calculate XP: base 10 XP per minute + accumulated bonus
    const baseXP = durationMinutes * 10;
    const totalXP = baseXP + xpAccumulatedRef.current;

    try {
      await supabase.functions.invoke("track-session", {
        body: {
          userId: user.id,
          subjectId: sessionDataRef.current.subjectId,
          durationMinutes,
          xpEarned: totalXP,
          topic: sessionDataRef.current.topic,
          bloomLevel: sessionDataRef.current.bloomLevel,
        },
      });

      console.log(`Session tracked: ${durationMinutes} mins, ${totalXP} XP`);
    } catch (error) {
      console.error("Failed to track session:", error);
    }

    // Reset
    startTimeRef.current = null;
    sessionDataRef.current = {};
    xpAccumulatedRef.current = 0;
  }, [user]);

  // Auto-end session on unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      endSession();
    };
  }, [endSession]);

  return { startSession, endSession, addXP };
};
