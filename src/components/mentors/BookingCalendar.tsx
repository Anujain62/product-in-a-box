import { useMemo } from 'react';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MentorAvailability } from '@/hooks/useMentorBooking';

interface BookingCalendarProps {
  availability: MentorAvailability[];
  selectedDate: Date | undefined;
  selectedTime: string | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string | undefined) => void;
}

export function BookingCalendar({
  availability,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
}: BookingCalendarProps) {
  // Get available days of week from availability
  const availableDaysOfWeek = useMemo(() => {
    return new Set(availability.map(a => a.day_of_week));
  }, [availability]);

  // Disable dates that are not in availability
  const disabledDays = (date: Date) => {
    const today = startOfDay(new Date());
    if (date < today) return true;
    
    // If no availability set, allow all future dates
    if (availability.length === 0) return false;
    
    const dayOfWeek = date.getDay();
    return !availableDaysOfWeek.has(dayOfWeek);
  };

  // Get available time slots for the selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);

    if (dayAvailability.length === 0) {
      // Default slots if no specific availability
      return generateTimeSlots('09:00', '18:00');
    }

    const slots: string[] = [];
    dayAvailability.forEach(a => {
      slots.push(...generateTimeSlots(a.start_time, a.end_time));
    });

    return [...new Set(slots)].sort();
  }, [selectedDate, availability]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h4 className="font-medium mb-3">Select Date</h4>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onDateSelect(date);
            onTimeSelect(undefined);
          }}
          disabled={disabledDays}
          fromDate={new Date()}
          toDate={addDays(new Date(), 30)}
          className="rounded-md border pointer-events-auto"
        />
      </div>

      <div>
        <h4 className="font-medium mb-3">
          {selectedDate 
            ? `Available Times - ${format(selectedDate, 'MMM d, yyyy')}`
            : 'Select a date first'
          }
        </h4>
        {selectedDate ? (
          <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
            {timeSlots.length > 0 ? (
              timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTimeSelect(time)}
                  className={cn(
                    'text-sm',
                    selectedTime === time && 'ring-2 ring-primary/20'
                  )}
                >
                  {time}
                </Button>
              ))
            ) : (
              <p className="col-span-3 text-muted-foreground text-sm">
                No available slots for this date
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Please select a date to view available time slots
          </p>
        )}
      </div>
    </div>
  );
}

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    slots.push(
      `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
    );
    
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  return slots;
}
