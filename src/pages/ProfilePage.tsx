import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, ChevronDown, KeyRound, Mail, Pencil, Phone, Shield, Trash2, User as UserIcon } from 'lucide-react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { deactivateAccount, getProfile, updatePassword, updateProfile } from '@/api/profile';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/utils';

function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const outputSize = crop.width * scaleX;
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, outputSize, outputSize,
  );
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9));
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, clearAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [isSavingPw, setIsSavingPw] = useState(false);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateText, setDeactivateText] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  const initials = user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U';

  useEffect(() => {
    void getProfile().then((fresh) => {
      updateUser(fresh);
      setName(fresh.name ?? '');
      setMobile(fresh.mobile ?? '');
    }).catch(() => {});
  }, []);

  const handleCancelEdit = () => {
    setName(user?.name ?? '');
    setMobile(user?.mobile ?? '');
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updated = await updateProfile({ name, mobile: mobile || undefined, currency: user?.currency ?? 'INR' });
      updateUser(updated);
      setIsEditing(false);
      toast.success('Profile updated.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsSavingProfile(false); }
  };

  const handleSavePassword = async () => {
    if (newPw !== confirmPw) { toast.error('Passwords do not match.'); return; }
    setIsSavingPw(true);
    try {
      await updatePassword({ current_password: currentPw, password: newPw, password_confirmation: confirmPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPwSection(false);
      toast.success('Password updated.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsSavingPw(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImgSrc(reader.result as string); setCropDialogOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const percentCrop = centerCrop(makeAspectCrop({ unit: '%', width: 80 }, 1, width, height), width, height);
    setCrop(percentCrop);
    setCompletedCrop({
      unit: 'px',
      x: (percentCrop.x / 100) * width,
      y: (percentCrop.y / 100) * height,
      width: (percentCrop.width / 100) * width,
      height: (percentCrop.height / 100) * height,
    });
  };

  const handleSaveAvatar = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsSavingAvatar(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('currency', user?.currency ?? 'INR');
      formData.append('profile_picture', blob, 'profile.jpg');
      const updated = await updateProfile(formData);
      updateUser(updated);
      setCropDialogOpen(false);
      toast.success('Profile picture updated.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsSavingAvatar(false); }
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await deactivateAccount();
      clearAuth();
      navigate('/login');
      toast.success('Account deactivated.');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setIsDeactivating(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Profile header card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-24 bg-muted" />
        <div className="px-6 pb-6 -mt-12 relative z-10">
          <div className="flex items-end gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-card shadow-md">
                {user?.profile_picture && <AvatarImage src={user.profile_picture} />}
                <AvatarFallback className="text-xl bg-muted">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors shadow-sm">
                <Camera size={12} />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <div className="pb-1">
              <p className="text-lg font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail size={13} />
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal information */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon size={16} className="text-muted-foreground" />
            <h2 className="text-base font-semibold">Personal Information</h2>
          </div>
          {!isEditing && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground cursor-pointer" onClick={() => setIsEditing(true)}>
              <Pencil size={13} /> Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-1">
                <Label>Mobile</Label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9876543210" className="pl-9" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSavingProfile}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium">{user?.name || '—'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Mobile</p>
              <p className="text-sm font-medium">{user?.mobile || '—'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user?.email || '—'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPwSection((v) => !v)}
          className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-muted-foreground" />
            <h2 className="text-base font-semibold">Change Password</h2>
          </div>
          <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showPwSection ? 'rotate-180' : ''}`} />
        </button>
        {showPwSection && (
          <div className="px-6 pb-6 space-y-4 border-t pt-4">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <PasswordInput value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>New Password</Label>
                <PasswordInput value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Confirm New Password</Label>
                <PasswordInput value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSavePassword} disabled={isSavingPw}>
              {isSavingPw ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-destructive" />
          <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Deactivating your account will remove access to all your data. This action cannot be reversed.
        </p>
        <Button variant="destructive" className="gap-2" onClick={() => setDeactivateOpen(true)}>
          <Trash2 size={14} /> Deactivate Account
        </Button>
      </div>

      {/* Deactivate dialog */}
      <Dialog open={deactivateOpen} onOpenChange={(open) => { setDeactivateOpen(open); if (!open) setDeactivateText(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Deactivate Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will deactivate your account and log you out. All your data will be preserved but inaccessible until a superadmin restores your account.
            </p>
            <div className="space-y-1">
              <Label>Type <span className="font-semibold text-foreground">Deactivate my account</span> to confirm</Label>
              <Input value={deactivateText} onChange={(e) => setDeactivateText(e.target.value)} placeholder="Deactivate my account" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeactivateOpen(false); setDeactivateText(''); }}>Cancel</Button>
            <Button variant="destructive" disabled={deactivateText !== 'Deactivate my account' || isDeactivating} onClick={handleDeactivate}>
              {isDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar crop dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Crop Profile Picture</DialogTitle></DialogHeader>
          <div className="mt-3 flex justify-center overflow-hidden">
            {imgSrc && (
              <ReactCrop crop={crop} onChange={(_, pc) => setCrop(pc)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop>
                <img ref={imgRef} src={imgSrc} alt="Crop preview" onLoad={onImageLoad} className="max-h-[60vh] max-w-full object-contain" />
              </ReactCrop>
            )}
          </div>
          <Button className="mt-4 w-full" onClick={handleSaveAvatar} disabled={isSavingAvatar}>
            {isSavingAvatar ? 'Saving...' : 'Save'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfilePage;
