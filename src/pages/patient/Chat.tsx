
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User } from "lucide-react";
import { ChatMessage } from "@/types";
import { DoctorStatus } from "@/components/DoctorStatus";

export default function PatientChat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      content: "Hello! I'm your healthcare assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        content: "Thank you for your message. A healthcare professional will review your inquiry and respond accordingly. For urgent matters, please contact your doctor directly or call emergency services.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const userName = profile?.first_name || "Patient";
  const userInitials = profile?.first_name?.charAt(0) || "P";

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-8rem)]">
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Healthcare Assistant</h1>
          <p className="text-gray-600">Get help with your health questions and concerns</p>
        </div>

        {/* Doctor Status */}
        <div className="mb-4">
          <DoctorStatus showInChat={true} />
        </div>

        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5 text-medical-primary" />
              Chat Support
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    {message.sender === "bot" ? (
                      <>
                        <AvatarImage src="" alt="Bot" />
                        <AvatarFallback className="bg-medical-primary text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src={profile?.avatar_url || ""} alt={userName} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {userInitials}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  
                  <div className={`flex flex-col max-w-[70%] ${
                    message.sender === "user" ? "items-end" : "items-start"
                  }`}>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        message.sender === "user"
                          ? "bg-medical-primary text-white"
                          : "bg-white border"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-medical-primary hover:bg-medical-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => setNewMessage("I need to schedule an appointment")}>
            Schedule Appointment
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNewMessage("I have a question about my medication")}>
            Medication Question
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNewMessage("I need my test results")}>
            Test Results
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNewMessage("I need help with insurance")}>
            Insurance Help
          </Button>
        </div>
      </div>
    </div>
  );
}
