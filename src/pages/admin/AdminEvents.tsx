import { useState, useEffect } from 'react';
import { useClubs, useEvents } from '@/hooks/useData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Plus, Eye, Loader2, Trash2, Edit, CheckCircle, Image as ImageIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Event } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AdminEvents() {
  const { getAdminClubs, loading: clubsLoading } = useClubs();
  const { events, createEvent, deleteEvent, updateEvent, uploadEventPoster, getEventRegistrations, refreshEvents, loading: eventsLoading } = useEvents();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    club_id: '',
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: 50,
    image_url: '',
  });

  const adminClubs = getAdminClubs();
  const adminClubIds = adminClubs.map((c) => c.id);
  const adminEvents = events.filter((e) => adminClubIds.includes(e.club_id));

  const getClubName = (clubId: string) => {
    return adminClubs.find((c) => c.id === clubId)?.name || 'Unknown Club';
  };

  const handleCreate = async () => {
    if (!formData.club_id || !formData.title || !formData.date || !formData.location) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    let imageUrl = formData.image_url;

    const result = await createEvent({
      ...formData,
      capacity: formData.capacity || null,
      description: formData.description || null,
      image_url: imageUrl || null,
      is_completed: false,
    });

    if (result) {
      toast({ title: 'Event created!', description: 'Your event has been created successfully.' });
      setIsCreateOpen(false);
      setFormData({
        club_id: '',
        title: '',
        description: '',
        date: '',
        location: '',
        capacity: 50,
        image_url: '',
      });
    } else {
      toast({ title: 'Error', description: 'Could not create event.', variant: 'destructive' });
    }
    setCreating(false);
  };

  const loading = clubsLoading || eventsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Events</h1>
          <p className="text-muted-foreground">Create and manage club events</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Fill in the details for your new event.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Club</Label>
                <Select value={formData.club_id} onValueChange={(v) => setFormData({ ...formData, club_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminClubs.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., AI Workshop"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your event..."
                />
              </div>

              <div className="space-y-2">
                <Label>Poster Image</Label>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Image URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      id="poster-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCreating(true);
                          const url = await uploadEventPoster(file);
                          if (url) {
                            setFormData({ ...formData, image_url: url });
                            toast({ title: 'Image uploaded', description: 'Poster uploaded successfully.' });
                          } else {
                            toast({ title: 'Upload failed', description: 'Could not upload image.', variant: 'destructive' });
                          }
                          setCreating(false);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('poster-upload')?.click()}
                      disabled={creating}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload from Device
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Room 101"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 50 })}
                  />
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {adminEvents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No events yet</h3>
            <p className="text-muted-foreground">Create your first event to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              getClubName={getClubName}
              getEventRegistrations={getEventRegistrations}
              deleteEvent={deleteEvent}
              updateEvent={updateEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  getClubName,
  getEventRegistrations,
  deleteEvent,
  updateEvent
}: {
  event: Event;
  getClubName: (id: string) => string;
  getEventRegistrations: (eventId: string) => Promise<any[]>;
  deleteEvent: (id: string) => Promise<boolean>;
  updateEvent: (id: string, data: Partial<Event>) => Promise<any>;
  uploadEventPoster: (file: File) => Promise<string | null>;
}) {
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: event.title,
    description: event.description || '',
    date: event.date.slice(0, 16),
    location: event.location,
    capacity: event.capacity || 50,
    image_url: event.image_url || '',
  });
  const { toast } = useToast();

  const isPast = new Date(event.date) < new Date() || event.is_completed;

  useEffect(() => {
    getEventRegistrations(event.id).then((regs) => setRegistrationCount(regs.length));
  }, [event.id, getEventRegistrations]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteEvent(event.id);
    if (success) {
      toast({ title: 'Event deleted', description: 'The event has been removed.' });
    } else {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    const success = await updateEvent(event.id, {
      ...editFormData,
      capacity: editFormData.capacity || null,
      description: editFormData.description || null,
      image_url: editFormData.image_url || null,
    });
    if (success) {
      toast({ title: 'Event updated', description: 'Changes saved successfully.' });
      setIsEditing(false);
    } else {
      toast({ title: 'Error', description: 'Failed to update event.', variant: 'destructive' });
    }
    setIsUpdating(false);
  };

  const toggleCompleted = async () => {
    setIsUpdating(true);
    const success = await updateEvent(event.id, { is_completed: !event.is_completed });
    if (success) {
      toast({
        title: event.is_completed ? 'Event reopened' : 'Event completed',
        description: event.is_completed ? 'Event status updated to upcoming.' : 'Event marked as completed.'
      });
    }
    setIsUpdating(false);
  };

  return (
    <Card className="flex flex-col overflow-hidden h-full">
      {event.image_url && (
        <div className="h-48 w-full relative overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
          <div className="absolute top-2 right-2">
            <Badge variant={event.is_completed ? 'success' : isPast ? 'secondary' : 'default'}>
              {event.is_completed ? 'Completed' : isPast ? 'Past' : 'Upcoming'}
            </Badge>
          </div>
        </div>
      )}
      <CardHeader>
        {!event.image_url && (
          <div className="flex items-start justify-between">
            <Badge variant="outline">{getClubName(event.club_id)}</Badge>
            <Badge variant={event.is_completed ? 'secondary' : isPast ? 'secondary' : 'default'}>
              {event.is_completed ? 'Completed' : isPast ? 'Past' : 'Upcoming'}
            </Badge>
          </div>
        )}
        {event.image_url && <Badge variant="outline" className="w-fit">{getClubName(event.club_id)}</Badge>}
        <CardTitle className="mt-2 line-clamp-1">{event.title}</CardTitle>
        <CardDescription className="line-clamp-2">{event.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {event.location}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{registrationCount}</span>
          <span className="text-muted-foreground">/ {event.capacity || '∞'} registered</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <div className="w-full flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/admin/reports?event=${event.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Details
            </Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link to={`/admin/events/${event.id}/attendance`}>
              <Users className="mr-2 h-4 w-4" />
              Attendance
            </Link>
          </Button>
        </div>
        <div className="w-full flex gap-2">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>Update the event details and poster.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Poster Image</Label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={editFormData.image_url}
                        onChange={(e) => setEditFormData({ ...editFormData, image_url: e.target.value })}
                        placeholder="Image URL"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        id={`edit-poster-upload-${event.id}`}
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUpdating(true);
                            const url = await uploadEventPoster(file);
                            if (url) {
                              setEditFormData({ ...editFormData, image_url: url });
                              toast({ title: 'Image uploaded', description: 'New poster uploaded successfully.' });
                            } else {
                              toast({ title: 'Upload failed', description: 'Could not upload image.', variant: 'destructive' });
                            }
                            setIsUpdating(false);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById(`edit-poster-upload-${event.id}`)?.click()}
                        disabled={isUpdating}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload from Device
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value) || 50 })}
                  />
                </div>
                <Button onClick={handleUpdate} className="w-full" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant={event.is_completed ? "outline" : "outline"}
            size="sm"
            className={event.is_completed ? "flex-1 text-primary" : "flex-1"}
            onClick={toggleCompleted}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : event.is_completed ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                Complete
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="px-3" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the event
                  "{event.title}" and all its registrations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
