import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ExternalLink,
  Plus,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface GoogleCalendarWidgetProps {
  isConnected: boolean;
  events: GoogleEvent[];
  onConnect: () => void;
  onEventClick?: (event: GoogleEvent) => void;
}

export const GoogleCalendarWidget: React.FC<GoogleCalendarWidgetProps> = ({ isConnected, events, onConnect, onEventClick }) => {
  const upcomingEvents = [...events]
    .filter(e => {
      const start = new Date(e.start.dateTime || e.start.date || '');
      return start >= new Date();
    })
    .sort((a, b) => {
      const startA = new Date(a.start.dateTime || a.start.date || '').getTime();
      const startB = new Date(b.start.dateTime || b.start.date || '').getTime();
      return startA - startB;
    })
    .slice(0, 5);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Google Calendar</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upcoming Events</p>
          </div>
        </div>
        {isConnected && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            Connected
          </span>
        )}
      </div>

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8 text-slate-300" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-2">Connect Your Calendar</h4>
          <p className="text-sm text-slate-500 mb-6 max-w-[200px]">Sync your Google Calendar events directly to your student dashboard.</p>
          <button 
            onClick={onConnect}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Connect Now
          </button>
        </div>
      ) : upcomingEvents.length > 0 ? (
        <div className="space-y-4 flex-1">
          {upcomingEvents.map((event, i) => {
            const startDate = new Date(event.start.dateTime || event.start.date || '');
            const endDate = new Date(event.end.dateTime || event.end.date || '');
            const isToday = startDate.toDateString() === new Date().toDateString();

            return (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onEventClick?.(event)}
                className="group p-4 bg-slate-50 rounded-2xl border border-black/5 hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {event.summary}
                      </h5>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[8px] font-black uppercase tracking-widest">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="w-12 h-12 text-slate-200 mb-3" />
          <p className="text-sm text-slate-500 font-medium">No upcoming events</p>
          <p className="text-[10px] text-slate-400 mt-1">Your Google Calendar is clear!</p>
        </div>
      )}

      {isConnected && (
        <button 
          onClick={() => window.open('https://calendar.google.com', '_blank')}
          className="mt-6 w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open Google Calendar
        </button>
      )}
    </div>
  );
};
