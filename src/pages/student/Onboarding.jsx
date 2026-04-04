import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Upload, CheckCircle, Loader2, X, Plus, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STEPS = ['Basic Info', 'School Details', 'Upload Resume', 'Upload School ID', 'Review'];

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const [profile, setProfile] = useState({
    full_name: '', email: '', phone: '', address: '',
    school_name: '', course: '', year_level: '', graduation_year: '',
    bio: '', skills: [], portfolio_links: [],
    resume_url: '', school_id_url: '',
    work_experience: [], education: [],
  });

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeParsing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('resume_url', file_url);

    // AI-parse the resume
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Parse this resume file and extract structured data. Return JSON with keys: full_name, email, phone, address, skills (array of strings), education (array of {degree, institution, year}), work_experience (array of {title, company, duration, description}), portfolio_links (array of strings). File URL: ${file_url}`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          education: { type: 'array', items: { type: 'object' } },
          work_experience: { type: 'array', items: { type: 'object' } },
          portfolio_links: { type: 'array', items: { type: 'string' } },
        }
      }
    });

    setProfile(p => ({
      ...p,
      full_name: result.full_name || p.full_name,
      email: result.email || p.email,
      phone: result.phone || p.phone,
      address: result.address || p.address,
      skills: result.skills?.length ? result.skills : p.skills,
      education: result.education?.length ? result.education : p.education,
      work_experience: result.work_experience?.length ? result.work_experience : p.work_experience,
      portfolio_links: result.portfolio_links?.length ? result.portfolio_links : p.portfolio_links,
    }));
    setResumeParsing(false);
  };

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('school_id_url', file_url);
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await base44.entities.StudentProfile.create({
      ...profile,
      user_id: currentUser?.id,
      verification_status: 'pending',
    });
    navigate('/student/profile');
  };

  const addSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      set('skills', [...profile.skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (s) => set('skills', profile.skills.filter(x => x !== s));

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set Up Your Student Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-xs hidden sm:block ${i <= step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{s}</span>
            ))}
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6 space-y-5">
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <>
                <h2 className="text-lg font-semibold">Basic Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Full Name *</Label><Input className="mt-1" value={profile.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Juan dela Cruz" /></div>
                  <div><Label>Email *</Label><Input className="mt-1" type="email" value={profile.email} onChange={e => set('email', e.target.value)} placeholder="juan@uni.edu.ph" /></div>
                  <div><Label>Phone</Label><Input className="mt-1" value={profile.phone} onChange={e => set('phone', e.target.value)} placeholder="+63 9xx xxx xxxx" /></div>
                  <div><Label>Address</Label><Input className="mt-1" value={profile.address} onChange={e => set('address', e.target.value)} placeholder="City, Province" /></div>
                </div>
                <div><Label>Bio / About Me</Label><Textarea className="mt-1" value={profile.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell clients about yourself..." rows={3} /></div>
              </>
            )}

            {/* Step 1: School Details */}
            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold">School Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-full"><Label>School / University *</Label><Input className="mt-1" value={profile.school_name} onChange={e => set('school_name', e.target.value)} placeholder="University of the Philippines" /></div>
                  <div><Label>Course / Program *</Label><Input className="mt-1" value={profile.course} onChange={e => set('course', e.target.value)} placeholder="BS Computer Science" /></div>
                  <div><Label>Year Level</Label><Input className="mt-1" value={profile.year_level} onChange={e => set('year_level', e.target.value)} placeholder="3rd Year" /></div>
                  <div><Label>Expected Graduation</Label><Input className="mt-1" value={profile.graduation_year} onChange={e => set('graduation_year', e.target.value)} placeholder="2026" /></div>
                </div>
                <div>
                  <Label>Skills</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="e.g. React, Photoshop" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                    <Button type="button" variant="outline" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.skills.map(s => (
                      <Badge key={s} className="bg-secondary text-secondary-foreground pr-1 gap-1">
                        {s}
                        <button onClick={() => removeSkill(s)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Resume Upload */}
            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold">Upload Your Resume</h2>
                <p className="text-sm text-muted-foreground">We'll automatically parse your resume to fill in your profile.</p>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-foreground">Click to upload resume</span>
                  <span className="text-xs text-muted-foreground mt-1">PDF or DOC, max 10MB</span>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                </label>
                {resumeParsing && (
                  <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-primary">Parsing your resume...</p>
                      <p className="text-xs text-muted-foreground">Extracting your information automatically</p>
                    </div>
                  </div>
                )}
                {profile.resume_url && !resumeParsing && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Resume uploaded & parsed!</p>
                      <p className="text-xs text-green-600">Your profile fields have been auto-filled. Review them in the next steps.</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-green-400 ml-auto" />
                  </div>
                )}
              </>
            )}

            {/* Step 3: School ID */}
            {step === 3 && (
              <>
                <h2 className="text-lg font-semibold">Upload School ID</h2>
                <p className="text-sm text-muted-foreground">Required for student verification. Your ID will only be seen by admins.</p>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-foreground">Upload School ID</span>
                  <span className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF, max 5MB</span>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleIdUpload} />
                </label>
                {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</div>}
                {profile.school_id_url && !loading && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-semibold text-green-800">School ID uploaded successfully!</p>
                  </div>
                )}
              </>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <>
                <h2 className="text-lg font-semibold">Review Your Profile</h2>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 bg-muted/50 rounded-xl">
                    <div><span className="text-muted-foreground">Name</span><p className="font-medium">{profile.full_name || '—'}</p></div>
                    <div><span className="text-muted-foreground">Email</span><p className="font-medium">{profile.email || '—'}</p></div>
                    <div><span className="text-muted-foreground">School</span><p className="font-medium">{profile.school_name || '—'}</p></div>
                    <div><span className="text-muted-foreground">Course</span><p className="font-medium">{profile.course || '—'}</p></div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <span className="text-muted-foreground">Skills</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {profile.skills.map(s => <Badge key={s} className="bg-secondary text-secondary-foreground text-xs">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-yellow-800 text-sm font-medium">⏳ Verification Pending</p>
                    <p className="text-yellow-700 text-xs mt-1">After submission, an admin will review your school ID. You'll be notified once verified.</p>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button className="gradient-primary text-white border-0" onClick={() => setStep(s => s + 1)}>
                  Continue
                </Button>
              ) : (
                <Button className="gradient-primary text-white border-0" onClick={handleSubmit} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit for Verification
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}