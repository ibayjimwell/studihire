import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProfileAvatarUpload({ profile, onAvatarUpdate }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.StudentProfile.update(profile.id, { avatar_url: file_url });
    onAvatarUpdate(file_url);
    setUploading(false);
  };

  return (
    <div className="relative shrink-0">
      <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
        <AvatarImage src={profile.avatar_url} />
        <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
          {profile.full_name?.[0] || 'S'}
        </AvatarFallback>
      </Avatar>
      <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow">
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5" />
        )}
        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}