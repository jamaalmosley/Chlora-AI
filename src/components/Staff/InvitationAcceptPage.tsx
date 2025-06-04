
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export function InvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'accepted' | 'error'>('loading');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    // Fetch invitation details
    const fetchInvitation = async () => {
      try {
        const { data, error } = await supabase
          .from('practice_invitations')
          .select(`
            *,
            practices(name)
          `)
          .eq('invitation_token', token)
          .eq('status', 'pending')
          .single();

        if (error || !data) {
          setStatus('invalid');
          return;
        }

        // Check if invitation is expired
        if (new Date(data.expires_at) < new Date()) {
          setStatus('invalid');
          return;
        }

        setInvitation(data);
        setStatus('valid');
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setStatus('error');
      }
    };

    fetchInvitation();
  }, [token]);

  const acceptInvitation = async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token
      });

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (result.success) {
        setStatus('accepted');
        toast({
          title: "Success",
          description: "You have successfully joined the practice!",
        });
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          navigate('/doctor/dashboard');
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to accept invitation');
      }

    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to accept invitation",
        variant: "destructive",
      });
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Please log in to accept this invitation.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <Loader className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>This invitation is invalid or has expired.</p>
            <Button onClick={() => navigate('/')} className="w-full mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Invitation Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You have successfully joined the practice! Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>An error occurred while processing your invitation.</p>
            <Button onClick={() => navigate('/')} className="w-full mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Practice Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">You've been invited to join:</h3>
            <p className="text-lg">{invitation?.practices?.name}</p>
          </div>
          
          <div>
            <p><strong>Role:</strong> {invitation?.role}</p>
            {invitation?.department && (
              <p><strong>Department:</strong> {invitation?.department}</p>
            )}
          </div>

          <div>
            <p><strong>Your email:</strong> {user?.email}</p>
            <p><strong>Invited email:</strong> {invitation?.email}</p>
          </div>

          {user?.email === invitation?.email ? (
            <Button 
              onClick={acceptInvitation} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Accepting..." : "Accept Invitation"}
            </Button>
          ) : (
            <div className="text-red-600">
              <p>Email mismatch! This invitation was sent to {invitation?.email}, but you're logged in as {user?.email}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
