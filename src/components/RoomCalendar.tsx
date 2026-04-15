import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Room, Reservation } from '../types';

interface RoomCalendarProps {
  rooms: Room[];
  reservations: Reservation[];
}

const STATUS_COLORS: Record<Reservation['status'], string> = {
  Confirmed: 'bg-blue-500',
  'Checked In': 'bg-emerald-500',
  'Checked Out': 'bg-slate-300',
  Cancelled: 'bg-red-200',
};

const STATUS_TEXT: Record<Reservation['status'], string> = {
  Confirmed: 'text-white',
  'Checked In': 'text-white',
  'Checked Out': 'text-slate-500',
  Cancelled: 'text-red-400',
};

export default function RoomCalendar({ rooms, reservations }: RoomCalendarProps) {
  const [startOffset, setStartOffset] = useState(0);
  const DAYS = 28;

  const dates = useMemo(() => {
    const result: Date[] = [];
    const base = new Date();
    base.setDate(base.getDate() + startOffset);
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      result.push(d);
    }
    return result;
  }, [startOffset]);

  const today = new Date().toISOString().split('T')[0];

  function dateStr(d: Date) {
    return d.toISOString().split('T')[0];
  }

  function getReservationForRoomOnDate(roomNumber: string, date: Date): Reservation | null {
    const ds = dateStr(date);
    return reservations.find(r =>
      r.roomNumber === roomNumber &&
      r.status !== 'Cancelled' &&
      r.checkIn <= ds &&
      r.checkOut > ds
    ) ?? null;
  }

  function isCheckIn(reservation: Reservation, date: Date) {
    return reservation.checkIn === dateStr(date);
  }

  function isCheckOut(reservation: Reservation, date: Date) {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return reservation.checkOut === dateStr(next);
  }

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const months = useMemo(() => {
    const seen = new Set<string>();
    return dates.filter(d => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dates]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Room Calendar</h1>
          <p className="text-slate-500 text-sm">Availability overview — {DAYS}-day view</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-3 text-xs mr-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Confirmed</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Checked In</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" /> Available</span>
          </div>
          <button
            onClick={() => setStartOffset(p => p - 7)}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setStartOffset(0)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all"
          >
            Today
          </button>
          <button
            onClick={() => setStartOffset(p => p + 7)}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr>
              <th className="sticky left-0 bg-slate-50 border-b border-r border-slate-200 px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-widest w-24 z-10">
                Room
              </th>
              {dates.map((date, i) => {
                const ds = dateStr(date);
                const isToday = ds === today;
                const isFirstOfMonth = date.getDate() === 1 || i === 0;
                return (
                  <th
                    key={ds}
                    className={`border-b border-slate-200 px-1 py-2 text-center min-w-[36px] ${
                      isToday ? 'bg-blue-50' : 'bg-slate-50'
                    } ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-100' : ''}`}
                  >
                    {isFirstOfMonth && (
                      <div className="text-[9px] font-bold text-slate-400 uppercase">
                        {date.toLocaleString('en', { month: 'short' })}
                      </div>
                    )}
                    <div className={`text-[10px] font-bold ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                      {dayNames[date.getDay()]}
                    </div>
                    <div className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mx-auto ${
                      isToday ? 'bg-blue-500 text-white' : 'text-slate-700'
                    }`}>
                      {date.getDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="sticky left-0 bg-white px-4 py-2 border-r border-slate-200 z-10">
                  <div className="font-bold text-slate-900 text-sm">{room.number}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{room.type}</div>
                </td>
                {dates.map((date, colIdx) => {
                  const ds = dateStr(date);
                  const isToday = ds === today;
                  const reservation = getReservationForRoomOnDate(room.number, date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  if (reservation) {
                    const cin = isCheckIn(reservation, date);
                    const cout = isCheckOut(reservation, date);
                    const isStart = reservation.checkIn === ds;
                    const isEnd = reservation.checkOut === dateStr(new Date(date.getTime() + 86400000));

                    return (
                      <td
                        key={ds}
                        className={`px-0 py-1.5 relative ${isToday ? 'bg-blue-50/40' : ''}`}
                      >
                        <div
                          className={`h-7 flex items-center px-1.5 text-[10px] font-bold truncate transition-all cursor-default
                            ${STATUS_COLORS[reservation.status]} ${STATUS_TEXT[reservation.status]}
                            ${isStart ? 'rounded-l-lg ml-0.5' : ''}
                            ${isEnd ? 'rounded-r-lg mr-0.5' : ''}
                          `}
                          title={`${reservation.guestName} (${reservation.status})`}
                        >
                          {isStart && (
                            <span className="truncate text-[9px]">
                              {reservation.guestName.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={ds}
                      className={`px-0 py-1.5 ${
                        isToday ? 'bg-blue-50/40' : isWeekend ? 'bg-slate-50' : ''
                      }`}
                    >
                      <div className="h-7" />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
