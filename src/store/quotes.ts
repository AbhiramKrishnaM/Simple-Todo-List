import { create } from "zustand";
import axios from "axios";

export interface Quote {
  q: string; // quote content
  a: string; // author
}

// API Ninjas quotes API response interface
interface ApiNinjasResponse {
  quote: string;
  author: string;
  category: string;
}

type QuotesState = {
  currentQuote: Quote | null;
  isLoading: boolean;
  error: string | null;

  fetchQuote: () => Promise<void>;
  setQuote: (quote: Quote) => void;
  clearError: () => void;
};

export const useQuotesStore = create<QuotesState>((set) => ({
  currentQuote: null,
  isLoading: false,
  error: null,

  fetchQuote: async () => {
    set({ isLoading: true, error: null });

    try {
      // Get API key from environment variables
      const apiKey = import.meta.env.VITE_QUOTES_API_KEY;

      if (!apiKey) {
        throw new Error(
          "API key not found. Please add VITE_QUOTES_API_KEY to your .env file"
        );
      }

      // Fetch from API Ninjas quotes API
      const response = await axios.get<ApiNinjasResponse[]>(
        "https://api.api-ninjas.com/v1/quotes",
        {
          headers: {
            "X-Api-Key": apiKey,
          },
          timeout: 5000, // 5 second timeout
        }
      );

      // API Ninjas returns an array with one quote
      const apiQuote = response.data[0];
      const quote: Quote = {
        q: apiQuote.quote,
        a: apiQuote.author,
      };

      set({
        currentQuote: quote,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch quote from API:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load motivational quote",
        isLoading: false,
      });
    }
  },

  setQuote: (quote) => set({ currentQuote: quote }),

  clearError: () => set({ error: null }),
}));
