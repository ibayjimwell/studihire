import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import { GraduationCap, Search, Star, Shield, Zap, Users, ArrowRight, CheckCircle, Briefcase, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const CATEGORIES = [
  { name: 'Web Development', icon: '💻', count: '120+ gigs' },
  { name: 'Graphic Design', icon: '🎨', count: '85+ gigs' },
  { name: 'Content Writing', icon: '✍️', count: '60+ gigs' },
  { name: 'Digital Marketing', icon: '📈', count: '45+ gigs' },
  { name: 'Video Editing', icon: '🎬', count: '38+ gigs' },
  { name: 'UI/UX Design', icon: '🖥️', count: '52+ gigs' },
  { name: 'Data Analysis', icon: '📊', count: '30+ gigs' },
  { name: 'Others', icon: '📚', count: '70+ gigs' },
];

const STEPS = [
  { step: '01', title: 'Sign Up & Verify', desc: 'Create your account and upload your school ID for verification.', icon: Shield },
  { step: '02', title: 'Set Up Your Profile', desc: 'Upload your resume to auto-fill your profile, showcase your skills.', icon: GraduationCap },
  { step: '03', title: 'Browse or Post', desc: 'Explore student gigs or post a project you need help with.', icon: Search },
  { step: '04', title: 'Collaborate & Pay', desc: 'Chat directly, agree on terms, and pay securely in-platform.', icon: Zap },
];

const STATS = [
  { value: '2,400+', label: 'Student Freelancers' },
  { value: '800+', label: 'Active Projects' },
  { value: '₱12M+', label: 'Paid Out' },
  { value: '4.9★', label: 'Avg. Rating' },
];

export default function Home() {
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (location.state?.submissionSuccess) {
      setShowSuccess(true);
      // Clear the state after showing the message
      setTimeout(() => {
        setShowSuccess(false);
      }, 8000);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-50 border-b border-green-200 py-3 px-4"
        >
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Verification submitted successfully! Your profile is now under review.
              </p>
              <p className="text-xs text-green-700 mt-1">
                You'll receive an email once your verification is complete. This usually takes 1-2 business days.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-green-600 hover:text-green-800"
            >
              <AlertCircle className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Hero */}
      <section className="gradient-hero text-white py-20 md:py-32 px-4 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <Badge className="bg-white/15 text-white border-white/20 mb-6 text-sm px-4 py-1.5 backdrop-blur">
            🎓 The #1 Student Freelance Platform
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Hire talented students.
            <br />
            <span className="text-green-300">Get paid for your skills.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10">
            A verified marketplace connecting student freelancers with clients who believe in real talent.
            Every gig. Every project. Every peso — all on one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-xl h-12 px-8" asChild>
              <Link to="/get-started?role=client">Hire a Student</Link>
            </Button>
            <Button size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold h-12 px-8 transition-colors" asChild>
              <Link to="/get-started?role=student">Offer Your Skills</Link>
            </Button>
          </div>

          {/* Search bar */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-2xl">
              <Search className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
              <input
                placeholder="Search for a skill or service..."
                className="flex-1 text-foreground text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
              <Button size="sm" className="shrink-0">Search</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-border py-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Browse by Category</h2>
            <p className="text-muted-foreground mt-2">Find the talent you need across popular categories</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.name}
                to={`/gigs?category=${encodeURIComponent(cat.name)}`}
                className="bg-white rounded-xl p-5 border border-border hover:border-primary/40 hover:shadow-md transition-all group text-center"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div id="how-it-works"></div>
      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">How StudiHire Works</h2>
            <p className="text-muted-foreground mt-2">Simple, safe, and built for students</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative text-center">
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-border z-0" />
                  )}
                  <div className="relative z-10 w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-xs font-bold text-primary mb-1">{step.step}</p>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 gradient-hero text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to get started?</h2>
          <p className="text-white/75 text-lg mb-8">
            Join thousands of students already earning and building their portfolio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold h-12 px-8" asChild>
              <Link to="/get-started?role=student">I'm a Student <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold h-12 px-8 transition-colors" asChild>
              <Link to="/get-started?role=client">I'm a Client <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">Studi<span className="text-primary">Hire</span></span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 StudiHire. Empowering student talent.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

