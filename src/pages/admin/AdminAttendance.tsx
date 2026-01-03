import { useState } from 'react';
import { useEvents, useProfiles } from '@/hooks/useData';
import QRScanner from '@/components/QRScanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Camera, User, Calendar as CalendarIcon, Info } from 'lucide-react';
import { Profile } from '@/types';

export default function AdminAttendance() {
    const { markAttendance, events } = useEvents();
    const { getProfile } = useProfiles();
    const { toast } = useToast();

    const [isScanning, setIsScanning] = useState(false);
    const [lastScannedUser, setLastScannedUser] = useState<Profile | null>(null);
    const [lastScannedEvent, setLastScannedEvent] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleScanSuccess = async (decodedText: string) => {
        // Expected format: CLUBHIVE-EVENT_ID-USER_ID-REGISTRATION_ID
        if (!decodedText.startsWith('CLUBHIVE-')) {
            toast({
                title: 'Invalid QR Code',
                description: 'This QR code is not valid for ClubHive attendance.',
                variant: 'destructive',
            });
            return;
        }

        const parts = decodedText.split('-');
        if (parts.length < 4) return;

        const [_, eventId, userId, registrationId] = parts;

        if (processing) return;
        setProcessing(true);
        setIsScanning(false);

        try {
            const event = events.find(e => e.id === eventId);
            setLastScannedEvent(event?.title || 'Unknown Event');

            const userProfile = await getProfile(userId);
            setLastScannedUser(userProfile);

            const success = await markAttendance(registrationId);

            if (success) {
                toast({
                    title: 'Attendance Marked!',
                    description: `Successfully checked in ${userProfile?.full_name || 'User'}.`,
                });
            } else {
                throw new Error('Failed to mark attendance');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to process attendance.',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
                <p className="text-muted-foreground">Scan student QR codes to verify their entry to events.</p>
            </div>

            {!isScanning ? (
                <Card className="border-dashed border-2 bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Camera className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Ready to Scan</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Use your camera to scan the QR code from a student's entry pass.
                        </p>
                        <Button size="lg" onClick={() => setIsScanning(true)} disabled={processing}>
                            {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                            Start Scanner
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <QRScanner
                        onScanSuccess={handleScanSuccess}
                        onScanFailure={(err) => console.log(err)}
                    />
                    <Button variant="outline" className="w-full" onClick={() => setIsScanning(false)}>
                        Cancel Scanning
                    </Button>
                </div>
            )}

            {lastScannedUser && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="bg-primary/5 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Last Checked In</CardTitle>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                                <CheckCircle className="mr-1 h-3 w-3" /> Success
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                {lastScannedUser.full_name?.charAt(0) || lastScannedUser.email.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{lastScannedUser.full_name || 'Student'}</h4>
                                <p className="text-sm text-muted-foreground">{lastScannedUser.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-2 text-sm">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{lastScannedEvent}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Roll: {lastScannedUser.roll_number || 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 flex justify-center">
                        <Button variant="ghost" size="sm" onClick={() => setLastScannedUser(null)}>
                            Clear Recent
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
