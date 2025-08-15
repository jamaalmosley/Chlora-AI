import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ChatLauncher() {
  const { profile } = useAuth();
  const role = profile?.role;
  const to = role === 'patient' ? '/patient/chat' : role === 'doctor' ? '/doctor/chat' : '/patient/chat';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        to={to}
        aria-label="Open chat assistant"
        className="shadow-lg rounded-full px-5 py-3 flex items-center gap-2 bg-medical-primary text-white hover:bg-medical-dark transition-colors"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="hidden md:inline">Chat</span>
      </Link>
    </div>
  );
}
