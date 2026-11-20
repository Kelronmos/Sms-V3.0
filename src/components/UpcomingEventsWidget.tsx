import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Plus, 
  ExternalLink,
  Search,
  Filter,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  type: 'google' | 'internal';
  description?: string;
  color?: string;
}

interface UpcomingEventsWidgetProps {
  events?: Event[];
  onEventClick?: (event: Event) => void;
}

export const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({ events: initialEvents, onEventClick }) => {
  const [events, setEvents] = useState<Event[]>(initialEvents || []);
  const [isLoading, setIsLoading] = useState(!initialEvents);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    if (initialEvents) {
      setEvents(initialEvents);
      setIsLoading(false);
      return;
    }
    // Simulate fetching events
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would fetch from your API
        // which would in turn fetch from Google Calendar if connected
        const mockEvents: Event[] = [
          {
            id: '1',
            title: 'Mathematics Advanced Seminar',
            start: new Date().toISOString(),
            end: new Date(Date.now() + 3600000).toISOString(),
            location: 'Room 302',
            type: 'internal',
            color: 'bg-indigo-500'
          },
          {
            id: '2',
            title: 'Project Presentation',
            start: new Date(Date.now() + 86400000).toISOString(),
            end: new Date(Date.now() + 90000000).toISOString(),
            location: 'Main Hall',
            type: 'internal',
            color: 'bg-emerald-500'
          },
          {
            id: '3',
            title: 'Counseling Session',
            start: new Date(Date.now() + 172800000).toISOString(),
            end: new Date(Date.now() + 176400000).toISOString(),
            location: 'Virtual',
            type: 'google',
            color: 'bg-rose-500'
          }
        ];
        
        setEvents(mockEvents);
        setIsGoogleConnected(false); // Mock state
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getEventDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Upcoming Events
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Your schedule at a glance</p>
        </div>
        <div className="flex gap-2">
          {!isGoogleConnected && (
            <button className="p-2 bg-slate-50 rounded-xl border border-black/5 hover:bg-slate-100 transition-all text-slate-400 hover:text-indigo-600 group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>
          )}
          <button className="p-2 bg-slate-50 rounded-xl border border-black/5 hover:bg-slate-100 transition-all text-slate-400">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : events.length > 0 ? (
          events.map((event, i) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onEventClick?.(event)}
              className="group relative p-4 bg-slate-50 rounded-2xl border border-black/5 hover:bg-white hover:shadow-md transition-all cursor-pointer"
            >
              <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${event.color || 'bg-indigo-500'}`} />
              
              <div className="flex items-start justify-between">
                <div className="flex-1 ml-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-white rounded-full border border-black/5 text-slate-500">
                      {getEventDateLabel(event.start)}
                    </span>
                    {event.type === 'google' && (
                      <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-600">
                        <ExternalLink className="w-2 h-2" /> Google
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(event.start), 'HH:mm')} - {format(parseISO(event.end), 'HH:mm')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500">No upcoming events</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Enjoy your free time!</p>
          </div>
        )}
      </div>

      {!isGoogleConnected && (
        <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between group cursor-pointer hover:bg-indigo-100 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Sync Calendar</p>
              <p className="text-[8px] font-bold text-indigo-400">Connect Google Calendar</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-all" />
        </div>
      )}
    </div>
  );
};
