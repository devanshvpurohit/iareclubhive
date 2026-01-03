import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, UserPlus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useAuth } from '@/contexts/AuthContext';

// Define types for Event and Registration data
interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
}

interface Registration {
    id: string;
    user_id: string;
    registered_at: string;
    attended: boolean;
    checked_in_at: string | null;
    profiles: {
        full_name: string;
        email: string;
    };
}

export default function AdminAttendance() {
    const { id: eventId } = useParams<{ id: string }>();
    const { toast } = useToast();
    const { isAdmin } = useAuth();

    const [event, setEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [processingScan, setProcessingScan] = useState(false);
    const [processingManualId, setProcessingManualId] = useState<string | null>(null);

    const fetchEventData = useCallback(async () => {
        if (!eventId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) {
            toast({
                title: 'Error',
                description: `Failed to fetch event: ${error.message}`,
                variant: 'destructive',
            });
        } else {
            setEvent(data);
        }
        setLoading(false);
    }, [eventId, toast]);

    const fetchRegistrations = useCallback(async () => {
        if (!eventId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('event_registrations')
            .select(`
                id,
                user_id,
                registered_at,
                attended,
                checked_in_at,
                profiles (full_name, email)
            `)
            .eq('event_id', eventId)
            .order('registered_at', { ascending: true });

        if (error) {
            toast({
                title: 'Error',
                description: `Failed to fetch registrations: ${error.message}`,
                variant: 'destructive',
            });
        } else {
            setRegistrations(data || []);
        }
        setLoading(false);
    }, [eventId, toast]);

    useEffect(() => {
        if (!isAdmin) {
            toast({
                title: 'Access Denied',
                description: 'You do not have permission to view this page.',
                variant: 'destructive',
            });
            return;
        }
        fetchEventData();
        fetchRegistrations();
    }, [isAdmin, fetchEventData, fetchRegistrations, toast]);
    
    const markUserAsAttended = async (registration: Registration) => {
        const { error } = await supabase
            .from('event_registrations')
            .update({ attended: true, checked_in_at: new Date().toISOString() })
            .eq('id', registration.id);

        if (error) {
            toast({
                title: 'Update Error',
                description: `Failed to mark attendance: ${error.message}`,
                variant: 'destructive',
            });
            return false;
        }

        toast({
            title: 'Attendance Recorded',
            description: `${registration.profiles.full_name} marked as attended!`,
        });

        // Refresh registrations to update UI
        await fetchRegistrations();
        return true;
    }

    const handleScanResult = async (result: any) => {
        if (!result || processingScan) return;
        const scannedUserId = result.text;
        setProcessingScan(true);

        const existingRegistration = registrations.find(reg => reg.user_id === scannedUserId);

        if (!existingRegistration) {
            toast({ title: 'Scan Error', description: 'User not registered for this event.', variant: 'destructive' });
        } else if (existingRegistration.attended) {
            toast({ title: 'Already Attended', description: `${existingRegistration.profiles.full_name} has already been marked as attended.` });
        } else {
            await markUserAsAttended(existingRegistration);
        }
        
        // Add a small delay before allowing another scan
        setTimeout(() => setProcessingScan(false), 1000);
    };
    
    const handleManualMark = async (registration: Registration) => {
        setProcessingManualId(registration.id);
        await markUserAsAttended(registration);
        setProcessingManualId(null);
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-full text-lg text-muted-foreground">
                You do not have administrative access.
            </div>
        );
    }

    if (loading && !event) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!event) {
        return <div className="flex items-center justify-center h-full text-lg text-muted-foreground">Event not found.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Manage Attendance for "{event.title}"</h1>
                <p className="text-muted-foreground">
                    Scan QR codes or manually mark attendance for registered students.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>QR Code Scanner</CardTitle>
                        <CardDescription>Scan student QR codes to mark them as attended.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={() => setScanning(!scanning)}
                            disabled={processingScan}
                            className="w-full"
                        >
                            {scanning ? 'Stop Scanner' : 'Start Scanner'}
                        </Button>
                        {scanning && (
                            <div className="relative w-full aspect-video border rounded-lg overflow-hidden">
                                <Scanner
                                    onResult={(result, error) => {
                                        if (result) handleScanResult(result);
                                        if (error) console.error(error);
                                    }}
                                    onError={(error) => console.error(error)}
                                    constraints={{ audio: false, video: { facingMode: 'environment' } }}
                                    styles={{ container: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }, video: { width: '100%', height: '100%', objectFit: 'cover' } }}
                                />
                                {processingScan && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                        )}
                        {!scanning && (
                            <div className="flex items-center justify-center h-48 w-full border rounded-lg bg-muted text-muted-foreground">
                                Scanner stopped. Click "Start Scanner" to begin.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Registered Students ({registrations.length})</CardTitle>
                        <CardDescription>
                            List of students registered for this event.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[500px] overflow-y-auto">
                            <div className="relative w-full overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead className="hidden sm:table-cell">Email</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {registrations.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                    No students registered for this event yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            registrations.map((reg) => (
                                                <TableRow key={reg.id}>
                                                    <TableCell className="font-medium">{reg.profiles?.full_name || 'N/A'}</TableCell>
                                                    <TableCell className="hidden sm:table-cell">{reg.profiles?.email || 'N/A'}</TableCell>
                                                    <TableCell className="text-center">
                                                        {reg.attended ? (
                                                            <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100 pointer-events-none">
                                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Attended
                                                            </Badge>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={processingManualId === reg.id}
                                                                onClick={() => handleManualMark(reg)}
                                                            >
                                                                {processingManualId === reg.id ? (
                                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                ) : (
                                                                    <UserPlus className="h-3 w-3 mr-1" />
                                                                )}
                                                                Mark Attended
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
