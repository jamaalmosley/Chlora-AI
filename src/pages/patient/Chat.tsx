
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { mockChatMessages } from "@/data/mockData";
import { ChatMessage } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";

// Medical assistant response logic
const generateMedicalAssistantResponse = (userMessage: string): string => {
  const keywords = {
    symptoms: ["pain", "fever", "headache", "cough", "feeling sick"],
    medication: ["medicine", "prescription", "drug", "dosage"],
    appointment: ["schedule", "book", "when", "time"],
    general: ["help", "question", "advice"]
  };

  const normalizedMessage = userMessage.toLowerCase();

  if (keywords.symptoms.some(keyword => normalizedMessage.includes(keyword))) {
    return "For specific medical symptoms, it's best to consult directly with your healthcare provider. However, I can offer general wellness advice or help you understand when to seek medical attention.";
  }

  if (keywords.medication.some(keyword => normalizedMessage.includes(keyword))) {
    return "Medication queries require professional medical advice. I recommend discussing specific medication concerns with your doctor who knows your full medical history.";
  }

  if (keywords.appointment.some(keyword => normalizedMessage.includes(keyword))) {
    return "Would you like help navigating our appointment scheduling system? I can guide you to the right resources or connect you with our scheduling team.";
  }

  // Fallback for general queries
  return "I'm an AI assistant designed to help guide you. While I can't provide medical diagnoses, I can help direct you to the right resources or provide general health information.";
};

export default function PatientChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load mock chat history
  useEffect(() => {
    if (user) {
      const userChat = mockChatMessages[user.id] || [
        {
          id: 'initial-welcome',
          sender: 'bot',
          content: "Welcome to Surgical Harmony Connect's Medical Assistant. How can I help you today?",
          timestamp: new Date().toISOString()
        }
      ];
      setMessages(userChat);
    }
  }, [user]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    // Simulate AI response with more context-aware logic
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "bot",
        content: generateMedicalAssistantResponse(userMessage.content),
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Medical Assistant Chat</h1>
        <p className="text-gray-600">
          Get answers to your medical questions or contact your healthcare team
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <Card className="h-[calc(100vh-240px)] flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xl flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-medical-primary" />
                Medical Assistant
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto py-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="bg-medical-light w-16 h-16 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="h-8 w-8 text-medical-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      Welcome to Medical Chat
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      Ask questions about your health, appointments, or medications. For emergencies, please call 911.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start max-w-[80%] ${
                          message.sender === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className={`h-8 w-8 ${message.sender === "user" ? "ml-2" : "mr-2"}`}>
                          {message.sender === "user" ? (
                            <>
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback className="bg-medical-secondary text-white">
                                {user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </>
                          ) : message.sender === "doctor" ? (
                            <>
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback className="bg-medical-primary text-white">
                                DR
                              </AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback className="bg-medical-accent text-white">
                                AI
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        
                        <div>
                          <div
                            className={`rounded-lg p-3 ${
                              message.sender === "user"
                                ? "bg-medical-primary text-white"
                                : message.sender === "doctor"
                                ? "bg-medical-secondary text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <p>{message.content}</p>
                          </div>
                          <div
                            className={`text-xs text-gray-500 mt-1 ${
                              message.sender === "user" ? "text-right" : ""
                            }`}
                          >
                            {formatTime(message.timestamp)}
                            {message.sender === "doctor" && (
                              <span className="ml-1 font-medium">Dr. Smith</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            
            <CardFooter className="pt-3 border-t">
              <form 
                className="w-full flex space-x-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-[120px]"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-medical-primary"
                  disabled={!newMessage.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Chat Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">About Medical Assistant</h3>
                  <p className="text-sm text-gray-600">
                    Our AI medical assistant helps answer general health questions and connects you with your healthcare team when needed.
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-700 mb-1">Important Note</h3>
                  <p className="text-sm text-gray-600">
                    For emergencies, please call 911 or go to your nearest emergency room. This chat is not monitored 24/7.
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-700 mb-1">Your Healthcare Team</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center p-2 rounded-lg border border-gray-100">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="bg-medical-primary text-white">
                          SS
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Dr. Sarah Smith</p>
                        <p className="text-xs text-gray-500">Primary Physician</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-2 rounded-lg border border-gray-100">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="bg-medical-secondary text-white">
                          NJ
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Nancy Johnson</p>
                        <p className="text-xs text-gray-500">Nurse Practitioner</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Common Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => setNewMessage("How do I schedule a follow-up appointment?")}
                >
                  How do I schedule a follow-up appointment?
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => setNewMessage("What are the side effects of my medication?")}
                >
                  What are the side effects of my medication?
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => setNewMessage("How should I prepare for my upcoming surgery?")}
                >
                  How should I prepare for my upcoming surgery?
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => setNewMessage("When will my test results be available?")}
                >
                  When will my test results be available?
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
