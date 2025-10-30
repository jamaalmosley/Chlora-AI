import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoConsultationProps {
  physicianId: string;
  onEnd: () => void;
}

export default function VideoConsultation({ physicianId, onEnd }: VideoConsultationProps) {
  const { toast } = useToast();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Initialize video call
    const initializeCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        mediaStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        toast({
          title: "Connected",
          description: "Video consultation started successfully",
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: "Camera/Microphone Error",
          description: "Unable to access camera or microphone",
          variant: "destructive",
        });
      }
    };

    initializeCall();

    // Timer for call duration
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(timer);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    toast({
      title: "Call Ended",
      description: `Consultation lasted ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`,
    });
    onEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      <Card className="flex-1 border-0 rounded-none">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Video Consultation</CardTitle>
            <div className="text-muted-foreground font-mono">
              {formatDuration(callDuration)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 relative h-[calc(100vh-8rem)]">
          {/* Remote video (physician) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-black"
          />
          
          {/* Local video (patient) - picture in picture */}
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-gray-900"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/95 backdrop-blur p-4 rounded-full shadow-lg">
            <Button
              variant={isVideoOn ? "default" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>

            <Button
              variant={isAudioOn ? "default" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={toggleAudio}
            >
              {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="rounded-full h-14 w-14"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={endCall}
            >
              <Phone className="h-6 w-6 rotate-135" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
