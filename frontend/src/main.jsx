import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "./components/AuthProvider";
import "./styles.css";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Without this every remount and every window focus refires the request,
      // so moving between pages re-fetches lists that have not changed.
      // Mutations still call invalidateQueries, so edits show up immediately.
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
