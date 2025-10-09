import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Bot, User, Users } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'doctor' | 'bot' | 'patient';
  timestamp: Date;
  senderName?: string;
}

interface PatientConversation {
  id: string;
  patientName: string;
  lastMessage: string;
  unread: number;
  timestamp: Date;
}

export function DoctorChat() {
  const [activeTab, setActiveTab] = useState('ai-assistant');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  
  // AI Assistant messages
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. I can help you draft messages, explain medical procedures, or answer patient questions. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [aiInput, setAiInput] = useState('');

  // Mock patient conversations
  const [patientConversations] = useState<PatientConversation[]>([
    {
      id: '1',
      patientName: 'John Smith',
      lastMessage: 'AI: Your blood pressure readings look good...',
      unread: 2,
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      patientName: 'Sarah Johnson',
      lastMessage: 'Patient: When should I take my medication?',
      unread: 0,
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      id: '3',
      patientName: 'Michael Chen',
      lastMessage: 'AI: Let me explain the procedure...',
      unread: 1,
      timestamp: new Date(Date.now() - 10800000)
    }
  ]);

  const [patientMessages, setPatientMessages] = useState<Record<string, ChatMessage[]>>({
    '1': [
      {
        id: '1',
        content: 'What do my recent blood pressure readings mean?',
        sender: 'patient',
        senderName: 'John Smith',
        timestamp: new Date(Date.now() - 7200000)
      },
      {
        id: '2',
        content: 'Your blood pressure readings look good. They\'re within the normal range of 120/80. Keep maintaining your current lifestyle.',
        sender: 'bot',
        senderName: 'AI Assistant',
        timestamp: new Date(Date.now() - 3600000)
      }
    ],
    '2': [
      {
        id: '1',
        content: 'When should I take my medication?',
        sender: 'patient',
        senderName: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 7200000)
      }
    ],
    '3': [
      {
        id: '1',
        content: 'Can you explain the MRI procedure?',
        sender: 'patient',
        senderName: 'Michael Chen',
        timestamp: new Date(Date.now() - 14400000)
      },
      {
        id: '2',
        content: 'Let me explain the procedure. An MRI is a non-invasive imaging technique...',
        sender: 'bot',
        senderName: 'AI Assistant',
        timestamp: new Date(Date.now() - 10800000)
      }
    ]
  });

  const [patientInput, setPatientInput] = useState('');

  const handleAiSend = () => {
    if (!aiInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: aiInput,
      sender: 'doctor',
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, newMessage]);
    
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I understand your request. I can help you with that. Would you like me to draft a response or provide more information?',
        sender: 'bot',
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, botResponse]);
    }, 1000);

    setAiInput('');
  };

  const handlePatientSend = () => {
    if (!patientInput.trim() || !selectedPatient) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: patientInput,
      sender: 'doctor',
      senderName: 'Dr. You',
      timestamp: new Date()
    };

    setPatientMessages(prev => ({
      ...prev,
      [selectedPatient]: [...(prev[selectedPatient] || []), newMessage]
    }));

    setPatientInput('');
  };

  const renderMessages = (messages: ChatMessage[]) => (
    <div className="space-y-4 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`flex gap-3 max-w-[75%] ${message.sender === 'doctor' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              message.sender === 'doctor' ? 'bg-primary text-primary-foreground' : 
              message.sender === 'bot' ? 'bg-secondary text-secondary-foreground' :
              'bg-accent text-accent-foreground'
            }`}>
              {message.sender === 'doctor' ? <User className="h-4 w-4" /> : 
               message.sender === 'bot' ? <Bot className="h-4 w-4" /> :
               <User className="h-4 w-4" />}
            </div>
            <div className={`rounded-lg p-3 ${
              message.sender === 'doctor' 
                ? 'bg-primary text-primary-foreground' 
                : message.sender === 'bot'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted'
            }`}>
              {message.senderName && (
                <p className="text-xs font-semibold mb-1 opacity-80">{message.senderName}</p>
              )}
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Communication Hub</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai-assistant" className="gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="patient-conversations" className="gap-2">
            <Users className="h-4 w-4" />
            Patient Conversations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-assistant" className="mt-6">
          <Card className="h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Medical Assistant
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1">
                {renderMessages(aiMessages)}
              </ScrollArea>
              
              <div className="border-t p-4">
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">Medical Explanations</Badge>
                  <Badge variant="outline" className="text-xs">Draft Messages</Badge>
                  <Badge variant="outline" className="text-xs">Treatment Plans</Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask the AI assistant for help..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAiSend()}
                    className="flex-1"
                  />
                  <Button onClick={handleAiSend}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patient-conversations" className="mt-6">
          <div className="grid grid-cols-3 gap-6 h-[calc(100vh-280px)]">
            <Card className="col-span-1">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Patients</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[calc(100%-80px)]">
                <div className="p-2">
                  {patientConversations.map((conv) => (
                    <Button
                      key={conv.id}
                      variant={selectedPatient === conv.id ? "secondary" : "ghost"}
                      className="w-full justify-start mb-2 h-auto py-3"
                      onClick={() => setSelectedPatient(conv.id)}
                    >
                      <div className="flex flex-col items-start w-full">
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-semibold">{conv.patientName}</span>
                          {conv.unread > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {conv.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground text-left line-clamp-1">
                          {conv.lastMessage}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1">
                          {conv.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            <Card className="col-span-2 flex flex-col">
              {selectedPatient ? (
                <>
                  <CardHeader className="border-b">
                    <CardTitle className="text-lg">
                      {patientConversations.find(c => c.id === selectedPatient)?.patientName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      View AI conversations and send direct messages
                    </p>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1">
                      {renderMessages(patientMessages[selectedPatient] || [])}
                    </ScrollArea>
                    
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          value={patientInput}
                          onChange={(e) => setPatientInput(e.target.value)}
                          placeholder="Send a message to the patient..."
                          onKeyPress={(e) => e.key === 'Enter' && handlePatientSend()}
                          className="flex-1"
                        />
                        <Button onClick={handlePatientSend}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a patient to view conversation
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
