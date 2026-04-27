import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/assets/css/main.css";
import Home from "./pages/Home";
import { ThemeProvider } from "./providers/ThemeProvider";
import type { Route } from "./types";
import { createBrowserRouter, RouterProvider } from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Invite from "./pages/Invite";
import { Layout } from "./components/layout/Layout";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import { useSocketRoom } from "./hooks/useSocketRoom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

const routes: Route[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
    sidebar: false,
    public: true,
  },
  {
    path: "/signup",
    element: <Signup />,
    sidebar: false,
    public: true,
  },
  {
    path: "/invite/:secret",
    element: <Invite />,
    sidebar: false,
    public: true,
  },
];

const browserRoutes = createBrowserRouter([
  {
    element: <Layout routes={routes} />,
    children: [...routes.map(({ path, element }) => ({ path, element }))],
  },
]);

function AppRoot() {
  useSocketRoom();
  return <RouterProvider router={browserRoutes} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider>
          <AppRoot />
          <Toaster />
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  </StrictMode>,
);
