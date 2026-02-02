import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Shield, Calendar, Upload, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

export default function Profile() {
    const { profile, user, isAdmin, refreshProfile } = useAuth();
    const { uploadAvatar } = useProfiles();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setAvatarUrl(profile.avatar_url || '');
            setRollNumber(profile.roll_number || '');
        }
    }, [profile]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const url = await uploadAvatar(file, user.id);
            if (url) {
                setAvatarUrl(url + '?t=' + Date.now()); // Cache bust
                toast({
                    title: 'Avatar uploaded',
                    description: 'Your profile picture has been updated.',
                });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error: any) {
            toast({
                title: 'Upload failed',
                description: error.message || 'Could not upload avatar.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    roll_number: rollNumber,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            toast({
                title: 'Profile updated',
                description: 'Your changes have been saved successfully.',
            });
        } catch (error: any) {
            toast({
                title: 'Update failed',
                description: error.message || 'An error occurred while updating your profile.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const displayName = profile?.full_name || profile?.email || 'User';
    const initials = displayName.charAt(0).toUpperCase();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and personal information.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1 shadow-sm h-fit">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 relative group">
                            <Avatar className="h-24 w-24 border-2 border-primary/10">
                                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                            </Avatar>
                            <label
                                htmlFor="avatar-upload"
                                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-6 w-6 text-white" />
                                )}
                            </label>
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={isUploading}
                            />
                        </div>
                        <CardTitle>{displayName}</CardTitle>
                        <CardDescription className="capitalize">{isAdmin ? 'Administrator' : 'Student Member'}</CardDescription>
                        {user?.id && (
                            <div className="flex flex-col items-center justify-center p-4">
                                <QRCodeSVG value={user.id} className="w-full h-auto max-w-[160px]" level="H" />
                                <p className="text-xs text-muted-foreground mt-2">Scan this QR to mark attendance</p>
                            </div>
                        )}                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>{isAdmin ? 'Full Access' : 'Standard Member'}</span>
                        </div>
                        {profile?.roll_number && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="font-bold text-xs uppercase bg-secondary/50 px-2 py-0.5 rounded">ID</span>
                                <span className="font-medium">{profile.roll_number}</span>
                            </div>
                        )}
                        {profile?.created_at && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Form */}
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                        <CardDescription>Update your public profile information.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleUpdateProfile}>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="full_name"
                                            className="pl-9"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            className="pl-9 bg-muted cursor-not-allowed"
                                            type="email"
                                            value={user?.email || ''}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">Email cannot be changed.</p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="avatar_upload_form">Profile Picture</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            id="avatar_upload_form"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            disabled={isUploading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('avatar_upload_form')?.click()}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Upload className="mr-2 h-4 w-4" />
                                            )}
                                            {isUploading ? 'Uploading...' : 'Upload Photo'}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">Or hover over your avatar to change it.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roll_number">Roll Number</Label>
                                    <Input
                                        id="roll_number"
                                        placeholder="2024CS01"
                                        value={rollNumber}
                                        onChange={(e) => setRollNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                                    <div>
                                        <h4 className="text-sm font-semibold">Account Role</h4>
                                        <p className="text-xs text-muted-foreground">Your permissions are managed by system administrators.</p>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                        {isAdmin ? 'Admin' : 'Student'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto px-8"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
