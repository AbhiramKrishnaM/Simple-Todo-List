import React, { useEffect } from "react";
import { motion } from "motion/react";
import { useQuotesStore } from "@/store/quotes";
import { Quote as QuoteIcon } from "lucide-react";

export default function Quote() {
  const { currentQuote, isLoading, error, fetchQuote } = useQuotesStore();

  useEffect(() => {
    // Fetch initial quote when component mounts
    fetchQuote();
  }, [fetchQuote]);

  if (error) {
    return (
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-sm text-muted-foreground italic">{error}</div>
      </motion.div>
    );
  }

  if (isLoading && !currentQuote) {
    return (
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-sm text-muted-foreground italic">
          Loading inspiration...
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mt-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <QuoteIcon className="h-4 w-4 text-muted-foreground/30 absolute -top-1 -left-1" />
        <div className="text-sm text-muted-foreground italic px-4">
          "{currentQuote?.q}"
        </div>
        {currentQuote?.a && (
          <div className="text-xs text-muted-foreground/70 mt-1">
            — {currentQuote.a}
          </div>
        )}
      </div>
    </motion.div>
  );
}
