import { motion } from "framer-motion";
import { Bell, BellOff, BellRing, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const NotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  const { toast } = useToast();

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: "Notifications Disabled",
          description: "You won't receive push notifications anymore.",
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: "Notifications Enabled!",
          description: "You'll receive study reminders and updates.",
        });
        // Send a test notification
        setTimeout(sendTestNotification, 1000);
      } else if (permission === "denied") {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-muted">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 text-muted-foreground">
            <BellOff className="w-8 h-8" />
            <div>
              <p className="font-medium">Push Notifications Not Supported</p>
              <p className="text-sm">Your browser doesn't support push notifications.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get reminders for study sessions, revision schedules, and achievements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isSubscribed ? "bg-success/20 text-success" : "bg-muted-foreground/20 text-muted-foreground"
            )}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSubscribed ? (
                <BellRing className="w-5 h-5" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {isSubscribed ? "Notifications Enabled" : "Notifications Disabled"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed 
                  ? "You'll receive important reminders" 
                  : "Enable to get study reminders"}
              </p>
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || permission === "denied"}
          />
        </div>

        {/* Permission Status */}
        {permission === "denied" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 bg-destructive/10 text-destructive rounded-lg"
          >
            <XCircle className="w-5 h-5" />
            <div className="text-sm">
              <p className="font-medium">Notifications Blocked</p>
              <p>Please enable notifications in your browser settings to use this feature.</p>
            </div>
          </motion.div>
        )}

        {/* Notification Types (when subscribed) */}
        {isSubscribed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4"
          >
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Notification Types
            </p>
            
            {[
              { id: "revision", label: "Revision Reminders", desc: "When topics are due for review" },
              { id: "streak", label: "Streak Reminders", desc: "Daily reminder to maintain streak" },
              { id: "achievements", label: "Achievement Unlocks", desc: "When you earn new achievements" },
              { id: "tips", label: "Study Tips", desc: "Personalized learning recommendations" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor={item.id} className="font-medium cursor-pointer">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch id={item.id} defaultChecked />
              </div>
            ))}
          </motion.div>
        )}

        {/* Test Button */}
        {isSubscribed && (
          <Button
            variant="outline"
            className="w-full"
            onClick={sendTestNotification}
          >
            <BellRing className="w-4 h-4 mr-2" />
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  );
};