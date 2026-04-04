import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STEPS = ['Company Info', 'Upload Valid ID', 'Review'];

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '', email: '', phone: '',
    company_name: '', company_type: '', industry: '', website: '',
    bio: '', valid_id_url: '',
  });

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('valid_id_url', file_url);
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await base44.entities.ClientProfile.create({
      ...profile,
      verification_status: 'pending',
    });
    navigate('/client/dashboard');
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set Up Your Client Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step + 1} of {STEPS.length}</p>
        </div>

        <div className="mb-8">
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6 space-y-5">
            {step === 0 && (
              <>
                <h2 className="text-lg font-semibold">Company Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Your Full Name *</Label><Input className="mt-1" value={profile.full_name} onChange={e => set('full_name', e.target.value)} /></div>
                  <div><Label>Email *</Label><Input className="mt-1" type="email" value={profile.email} onChange={e => set('email', e.target.value)} /></div>
                  <div><Label>Phone</Label><Input className="mt-1" value={profile.phone} onChange={e => set('phone', e.target.value)} /></div>
                  <div><Label>Company / Organization Name</Label><Input className="mt-1" value={profile.company_name} onChange={e => set('company_name', e.target.value)} /></div>
                  <div>
                    <Label>Company Type</Label>
                    <Select value={profile.company_type} onValueChange={v => set('company_type', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {['individual', 'startup', 'sme', 'enterprise', 'ngo', 'other'].map(t => (
                          <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Industry</Label><Input className="mt-1" value={profile.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Technology" /></div>
                  <div className="col-span-full"><Label>Website</Label><Input className="mt-1" value={profile.website} onChange={e => set('website', e.target.value)} placeholder="https://" /></div>
                </div>
                <div><Label>About / Description</Label><Textarea className="mt-1" value={profile.bio} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Tell students about your organization..." /></div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold">Upload Valid ID</h2>
                <p className="text-sm text-muted-foreground">Required for client verification. Accept: government ID, business permit, etc.</p>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to upload Valid ID</span>
                  <span className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF, max 5MB</span>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleIdUpload} />
                </label>
                {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Uploading...</div>}
                {profile.valid_id_url && !loading && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-semibold text-green-800">ID uploaded successfully!</p>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold">Review</h2>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 bg-muted/50 rounded-xl">
                    <div><span className="text-muted-foreground">Name</span><p className="font-medium">{profile.full_name || '—'}</p></div>
                    <div><span className="text-muted-foreground">Company</span><p className="font-medium">{profile.company_name || '—'}</p></div>
                    <div><span className="text-muted-foreground">Industry</span><p className="font-medium">{profile.industry || '—'}</p></div>
                    <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{profile.company_type || '—'}</p></div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-yellow-800 text-sm font-medium">⏳ Verification Pending</p>
                    <p className="text-yellow-700 text-xs mt-1">An admin will review your ID and verify your account. This usually takes 1–2 business days.</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>Back</Button>
              {step < STEPS.length - 1 ? (
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0" onClick={() => setStep(s => s + 1)}>Continue</Button>
              ) : (
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0" onClick={handleSubmit} disabled={loading}>
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