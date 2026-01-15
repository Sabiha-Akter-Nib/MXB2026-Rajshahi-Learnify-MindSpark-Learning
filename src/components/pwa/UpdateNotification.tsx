import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceWorker } from "@/hooks/useServiceWorker";

const UpdateNotification = () => {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      setShowNotification(true);
    }
  }, [isUpdateAvailable]);

  if (!showNotification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-primary/95 text-primary-foreground backdrop-blur-sm py-3 px-4 shadow-lg"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-sm">New Update Available!</p>
              <p className="text-xs text-primary-foreground/80">
                Refresh to get the latest features
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={updateServiceWorker}
              size="sm"
              variant="secondary"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Update
            </Button>
            <button
              onClick={() => setShowNotification(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateNotification;
