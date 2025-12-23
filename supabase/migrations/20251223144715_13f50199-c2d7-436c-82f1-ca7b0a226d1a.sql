-- Fix leaderboard RLS: Require authentication to view public entries
DROP POLICY IF EXISTS "Anyone can view public leaderboard entries" ON public.leaderboard_entries;

CREATE POLICY "Authenticated users can view public leaderboard entries" 
ON public.leaderboard_entries 
FOR SELECT 
TO authenticated
USING (is_public = true);

-- Add DELETE policy for chat_messages
CREATE POLICY "Users can delete messages in their conversations" 
ON public.chat_messages 
FOR DELETE 
USING (conversation_id IN ( 
  SELECT chat_conversations.id
  FROM chat_conversations
  WHERE chat_conversations.user_id = auth.uid()
));

-- Add DELETE policy for learning_plan_tasks
CREATE POLICY "Users can delete their plan tasks" 
ON public.learning_plan_tasks 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1
  FROM learning_plans
  WHERE learning_plans.id = learning_plan_tasks.plan_id 
    AND learning_plans.user_id = auth.uid()
));