import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ActivityIcon, UserIcon, MessageSquare } from "lucide-react";

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect them to their dashboard
    if (isAuthenticated && user) {
      if (user.role === "patient") {
        navigate("/patient");
      } else if (user.role === "doctor") {
        navigate("/doctor");
      } else if (user.role === "admin") {
        navigate("/admin");
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-medical-light via-white to-medical-light py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-medical-primary mb-4">
            Chlora
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamlining healthcare management with comprehensive patient and physician portals
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-medical-primary hover:bg-medical-dark"
              onClick={() => navigate("/login")}
            >
              Log In
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.open("mailto:contact@surgicalharmony.com")}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Comprehensive Practice Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
              <div className="bg-medical-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-8 w-8 text-medical-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-medical-primary">Patient Portal</h3>
              <p className="text-gray-600">
                Secure access to medical records, appointments, and personalized health information.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
              <div className="bg-medical-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ActivityIcon className="h-8 w-8 text-medical-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-medical-primary">Physician Dashboard</h3>
              <p className="text-gray-600">
                Streamlined tools for managing patient care, schedules, and surgical procedures.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
              <div className="bg-medical-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-medical-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-medical-primary">AI-Powered Support</h3>
              <p className="text-gray-600">
                Intelligent chatbot assistance for patients, with seamless escalation to healthcare providers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Chlora</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 bg-medical-light p-2 h-10 w-10 rounded-full flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-medical-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Streamlined Workflows</h3>
                <p className="text-gray-600">
                  Optimize your practice with integrated scheduling, digital records, and automated follow-ups.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 bg-medical-light p-2 h-10 w-10 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-medical-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Enhanced Patient Engagement</h3>
                <p className="text-gray-600">
                  Improve satisfaction with 24/7 portal access, appointment reminders, and personalized care information.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 bg-medical-light p-2 h-10 w-10 rounded-full flex items-center justify-center">
                <ActivityIcon className="h-5 w-5 text-medical-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Data-Driven Insights</h3>
                <p className="text-gray-600">
                  Make informed decisions with comprehensive analytics on surgical outcomes and practice performance.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 bg-medical-light p-2 h-10 w-10 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-medical-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Intelligent Support</h3>
                <p className="text-gray-600">
                  Reduce administrative burden with AI-powered patient triage and automated responses to common inquiries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-medical-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your surgical practice?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Join the leading surgical practices using Chlora to improve patient outcomes and practice efficiency.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-medical-primary hover:bg-gray-100"
              onClick={() => navigate("/login")}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              className="bg-white/10 text-white border-2 border-white hover:bg-white hover:text-medical-primary transition-all"
              onClick={() => window.location.href = 'mailto:contact@surgicalharmony.com?subject=Schedule Demo Request'}
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Chlora</h3>
              <p className="text-gray-400">
                Streamlining healthcare management with comprehensive patient and physician portals.
              </p>
            </div>
            
            <div>
              <h4 className="text-md font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              © 2025 Chlora. All rights reserved.
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
