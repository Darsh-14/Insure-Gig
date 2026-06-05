import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { ChatBot } from "./components/ui/ChatBot"; //

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
      <ChatBot />
    </>
  );
}