import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react';

export default function GetStarted() {
  const navigate = useNavigate();

  // If ?role= is already set, redirect straight to the right onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    if (role === 'student') navigate('/student/onboarding', { replace: true });
    else if (role === 'client') navigate('/client/onboarding', { replace: true });
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Studi<span className="text-primary">Hire</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Join StudiHire</h1>
          <p className="text-muted-foreground text-sm mt-2">Choose how you'd like to use the platform</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Student card */}
          <button
            onClick={() => navigate('/student/onboarding')}
            className="group flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-border hover:border-primary hover:shadow-lg transition-all"
          >
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">I'm a Student</h2>
              <p className="text-sm text-muted-foreground mt-1">Offer your skills and earn while studying</p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 text-left w-full">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>Create service gigs</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>Apply to projects</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>Build your portfolio</li>
            </ul>
            <div className="mt-2 flex items-center gap-1 text-primary text-sm font-semibold">
              Get Started <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Client card */}
          <button
            onClick={() => navigate('/client/onboarding')}
            className="group flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-border hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">I'm a Client</h2>
              <p className="text-sm text-muted-foreground mt-1">Hire talented students for your projects</p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 text-left w-full">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>Post projects</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>Browse student gigs</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>Hire verified students</li>
            </ul>
            <div className="mt-2 flex items-center gap-1 text-blue-600 text-sm font-semibold">
              Get Started <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link to="/" className="text-primary font-medium hover:underline">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}