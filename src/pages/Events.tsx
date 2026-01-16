import { useState } from 'react';
import { useClubs, useEvents } from '@/hooks/useData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Events() {
  const { clubs } = useClubs();
  const { events, registerForEvent, getMyRegistration, loading } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);

  const upcomingEvents = events
    .filter((e) => !e.is_completed && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getClubName = (clubId: string) => {
    return clubs.find((c) => c.id === clubId)?.name || 'Unknown Club';
  };

  const handleRegister = async (eventId: string) => {
    setRegistering(eventId);
    const registration = await registerForEvent(eventId);
    if (registration) {
      toast({ title: 'Registered!', description: 'Your entry pass has been generated.' });
      setSelectedEvent(eventId);
      setShowQRDialog(true);
    } else {
      toast({ title: 'Error', description: 'Could not register for event.', variant: 'destructive' });
    }
    setRegistering(null);
  };

  const handleViewPass = (eventId: string) => {
    setSelectedEvent(eventId);
    setShowQRDialog(true);
  };

  const selectedEventData = events.find((e) => e.id === selectedEvent);
  const selectedRegistration = selectedEvent ? getMyRegistration(selectedEvent) : null;
  const qrValue = selectedRegistration ? `CLUBHIVE-${selectedEvent}-${user?.id}-${selectedRegistration.id}` : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <p className="text-muted-foreground">Discover and register for upcoming events</p>
      </div>

      {upcomingEvents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No upcoming events</h3>
            <p className="text-muted-foreground">Check back later for new events.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => {
            const registration = getMyRegistration(event.id);
            const isRegistered = !!registration;

            return (
              <Card key={event.id} className="flex flex-col overflow-hidden">
                {event.image_url && (
                  <div className="h-48 w-full relative overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                    {isRegistered && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-600">
                          <Check className="mr-1 h-3 w-3" /> Registered
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline">{getClubName(event.club_id)}</Badge>
                    {isRegistered && !event.image_url && (
                      <Badge className="bg-green-600">
                        <Check className="mr-1 h-3 w-3" /> Registered
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 line-clamp-1">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.date), 'EEEE, MMMM d')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>

                  <div className="pt-4 mt-auto">
                    {isRegistered ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleViewPass(event.id)}
                      >
                        View Entry Pass
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleRegister(event.id)}
                        disabled={registering === event.id}
                      >
                        {registering === event.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          'Register Now'
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Entry Pass</DialogTitle>
            <DialogDescription>
              Show this QR code at the event entrance for check-in.
            </DialogDescription>
          </DialogHeader>
          {selectedEventData && qrValue && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="rounded-lg border bg-background p-4">
                <QRCodeSVG value={qrValue} size={200} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">{selectedEventData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedEventData.date), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">{selectedEventData.location}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
