import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, Minus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLeagueForXp } from "@/lib/leaderboard";

const BRAND = {
  purple: "#6A68DF",
  peach: "#EFB995",
  pink: "#E91E8C",
};

interface RankChangeModalProps {
  open: boolean;
  onClose: () => void;
  oldRank: number;
  newRank: number;
  totalXp: number;
  xpEarned: number;
}

const RankChangeModal = ({ open, onClose, oldRank, newRank, totalXp, xpEarned }: RankChangeModalProps) => {
  const positionsGained = oldRank - newRank; // positive = moved up
  const league = getLeagueForXp(totalXp);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-sm rounded-3xl border border-white/15 p-6 text-center"
            style={{
              background: "linear-gradient(180deg, rgba(30,28,50,0.95) 0%, rgba(20,18,40,0.98) 100%)",
              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${positionsGained > 0 ? BRAND.purple + "30" : "transparent"}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: positionsGained > 0
                  ? `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.pink})`
                  : positionsGained === 0
                    ? "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))"
                    : "linear-gradient(135deg, #ef4444, #dc2626)",
              }}
            >
              {positionsGained > 0 ? (
                <TrendingUp className="w-8 h-8 text-white" />
              ) : positionsGained === 0 ? (
                <Minus className="w-8 h-8 text-white/60" />
              ) : (
                <TrendingUp className="w-8 h-8 text-white rotate-180" />
              )}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white font-bold text-xl mb-1"
              style={{ fontFamily: "Poppins" }}
            >
              {positionsGained > 0
                ? "Rank Up! 🎉"
                : positionsGained === 0
                  ? "Rank Held"
                  : "Keep Going!"}
            </motion.h2>

            {/* Position change */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-5"
            >
              {positionsGained > 0 ? (
                <p className="text-white/60 text-sm">
                  You moved up{" "}
                  <span className="font-bold text-white" style={{ color: BRAND.peach }}>
                    {positionsGained} position{positionsGained > 1 ? "s" : ""}
                  </span>
                </p>
              ) : positionsGained === 0 ? (
                <p className="text-white/50 text-sm">Your position hasn't changed</p>
              ) : (
                <p className="text-white/50 text-sm">
                  You dropped{" "}
                  <span className="font-bold text-red-400">
                    {Math.abs(positionsGained)} position{Math.abs(positionsGained) > 1 ? "s" : ""}
                  </span>
                </p>
              )}
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 mb-5"
            >
              {/* Rank */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <div className="flex items-center gap-1.5 justify-center">
                  <Trophy className="w-3.5 h-3.5" style={{ color: BRAND.peach }} />
                  <span className="text-white/40 text-[10px] font-medium">Rank</span>
                </div>
                <div className="flex items-center gap-1 justify-center mt-1">
                  {oldRank !== newRank && (
                    <span className="text-white/30 text-sm line-through">#{oldRank}</span>
                  )}
                  <span className="text-white font-bold text-lg">#{newRank}</span>
                </div>
              </div>

              {/* XP earned */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <div className="flex items-center gap-1.5 justify-center">
                  <Zap className="w-3.5 h-3.5" style={{ color: BRAND.purple }} />
                  <span className="text-white/40 text-[10px] font-medium">XP Earned</span>
                </div>
                <span className="text-white font-bold text-lg block mt-1">+{xpEarned}</span>
              </div>

              {/* League */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <span className="text-white/40 text-[10px] font-medium block">League</span>
                <span className="text-2xl block mt-1">{league.emoji}</span>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={onClose}
                className="w-full rounded-2xl py-3 font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.pink})` }}
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RankChangeModal;
