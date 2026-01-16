import { useAuth } from '@/contexts/AuthContext';
import { useClubs, useEvents } from '@/hooks/useData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Bell, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const { getMyClubs, getAdminClubs, loading: clubsLoading } = useClubs();
  const { events, loading: eventsLoading } = useEvents();

  const myClubs = isAdmin ? getAdminClubs() : getMyClubs();
  const upcomingEvents = events
    .filter((e) => !e.is_completed && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const displayName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {displayName}!</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Manage your clubs and track event performance.'
            : 'Discover events and stay connected with your clubs.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Clubs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubsLoading ? '...' : myClubs.length}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Clubs you manage' : 'Active memberships'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsLoading ? '...' : upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Events this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">New this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Attendance rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Clubs</CardTitle>
            <CardDescription>
              {isAdmin ? 'Clubs you manage' : 'Clubs you are a member of'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clubsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : myClubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clubs yet. Join a club to get started!</p>
            ) : (
              <div className="space-y-3">
                {myClubs.map((club) => (
                  <div key={club.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{club.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{club.description}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events happening soon</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={isAdmin ? '/admin/events' : '/events'}
                    className="block rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge>{event.location}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
