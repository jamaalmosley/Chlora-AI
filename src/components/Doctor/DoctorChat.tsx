
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'doctor' | 'bot';
  timestamp: Date;
}

export function DoctorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant for patient communication. I can help you draft messages, explain medical procedures, or answer patient questions. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'doctor',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I understand your request. I can help you communicate with patients about this topic. Would you like me to draft a response or provide more information?',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);

    setInputMessage('');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-medical-primary" />
        <h1 className="text-3xl font-bold text-medical-primary">Patient Communication Assistant</h1>
      </div>

      <Card className="max-w-4xl mx-auto h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Patient Communication Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.sender === 'doctor' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'doctor' ? 'bg-medical-primary text-white' : 'bg-gray-200'
                  }`}>
                    {message.sender === 'doctor' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.sender === 'doctor' 
                      ? 'bg-medical-primary text-white' 
                      : 'bg-gray-100'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'doctor' ? 'text-medical-light' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about patient communication, medical explanations, or request help drafting messages..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                className="bg-medical-primary hover:bg-medical-dark"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">Medical Explanations</Badge>
              <Badge variant="outline" className="text-xs">Patient Communication</Badge>
              <Badge variant="outline" className="text-xs">Treatment Plans</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
