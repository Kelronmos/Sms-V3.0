import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  type: 'personal' | 'assignment' | 'class';
}

interface MonthlyCalendarProps {
  events: Event[];
  onAddEvent: (title: string, date: string, type: string) => void;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ events, onAddEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState<'personal' | 'assignment' | 'class'>('personal');

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = [];
  const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const startDay = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  // Add empty slots for days of previous month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 border border-black/5 bg-slate-50/30" />);
  }

  // Add days of current month
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
    const dateString = date.toISOString().split('T')[0];
    const dayEvents = events.filter(e => e.start_time.startsWith(dateString));
    const isToday = new Date().toDateString() === date.toDateString();
    const isSelected = selectedDate?.toDateString() === date.toDateString();

    days.push(
      <div 
        key={d} 
        onClick={() => setSelectedDate(date)}
        className={`h-24 border border-black/5 p-2 transition-all cursor-pointer relative group ${
          isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex justify-between items-start">
          <span className={`text-xs font-bold ${
            isToday ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-500'
          }`}>
            {d}
          </span>
          {dayEvents.length > 0 && (
            <div className="flex gap-1">
              {dayEvents.slice(0, 3).map((e, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full ${
                    e.type === 'assignment' ? 'bg-rose-500' :
                    e.type === 'class' ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`} 
                />
              ))}
              {dayEvents.length > 3 && <span className="text-[8px] font-black text-slate-400">+{dayEvents.length - 3}</span>}
            </div>
          )}
        </div>
        
        <div className="mt-1 space-y-1 overflow-hidden">
          {dayEvents.slice(0, 2).map((e, idx) => (
            <div 
              key={idx} 
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${
                e.type === 'assignment' ? 'bg-rose-100 text-rose-700' :
                e.type === 'class' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {e.title}
            </div>
          ))}
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setNewEventDate(dateString);
            setShowAddModal(true);
          }}
          className="absolute bottom-1 right-1 p-1 bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const selectedDateEvents = selectedDate 
    ? events.filter(e => e.start_time.startsWith(selectedDate.toISOString().split('T')[0]))
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
        <div className="p-6 border-b border-black/5 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-black text-slate-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-black/5">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-black/5">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
          <button 
            onClick={() => {
              setNewEventDate(new Date().toISOString().split('T')[0]);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-black/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>

      {/* Sidebar for Event Details */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 h-full">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select a day'}
            </h4>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {selectedDateEvents.length} Events
            </span>
          </div>

          <div className="space-y-4">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event, i) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-2xl border ${
                    event.type === 'assignment' ? 'bg-rose-50 border-rose-100' :
                    event.type === 'class' ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      event.type === 'assignment' ? 'bg-rose-200 text-rose-700' :
                      event.type === 'class' ? 'bg-emerald-200 text-emerald-700' : 'bg-indigo-200 text-indigo-700'
                    }`}>
                      {event.type}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900 mb-1">{event.title}</h5>
                  {event.description && <p className="text-xs text-slate-500 line-clamp-2">{event.description}</p>}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">No events scheduled</p>
                <p className="text-[10px] text-slate-400 mt-1">Click a day to add an event</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Add New Event</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Event Title</label>
                  <input 
                    type="text" 
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g., Math Study Session"
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                  <input 
                    type="date" 
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Event Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['personal', 'assignment', 'class'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setNewEventType(type)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          newEventType === type ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 border border-black/5'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (newEventTitle && newEventDate) {
                    onAddEvent(newEventTitle, newEventDate, newEventType);
                    setShowAddModal(false);
                    setNewEventTitle('');
                  }
                }}
                className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-black/10"
              >
                Create Event
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
