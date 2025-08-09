import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { addWeeks, eachDayOfInterval, endOfWeek, format, isToday, startOfWeek } from 'date-fns';

interface WeekData {
  offset: number;
  weekStart: Date;
  weekEnd: Date;
  dates: Date[];
  formatted: string[];
  dayNames: string[];
  shortNames: string[];
  dayNumbers: string[];
  monthDays: string[];
  isCurrentWeek: boolean;
}

@Component({
  selector: 'app-simple-calendar',
  templateUrl: './simple-calendar.component.html',
  styleUrls: ['./simple-calendar.component.scss'],
  imports: [
    ReactiveFormsModule,
    FormsModule,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ]
})
export class SimpleCalendarComponent  implements OnInit {

  @Output() weekRangeLabel: EventEmitter<string> = new EventEmitter<string>();
  @Output() weekDataResult: EventEmitter<string> = new EventEmitter<string>();

  // Signals for reactive state
  currentWeekOffset = signal<number>(0);
  weekStartsOn = signal<number>(0); // 0 = Sunday, 1 = Monday

  // Computed signal for week data
  weekData = computed<WeekData>(() => {
    return this.getWeekDays(this.currentWeekOffset(), this.weekStartsOn());
  });

  // Computed signal for week label
  weekLabel = computed<string>(() => {
    const offset = this.currentWeekOffset();
    if (offset === 0) return 'This Week';
    if (offset === 1) return 'Next Week';
    if (offset === -1) return 'Last Week';
    if (offset > 1) return `${offset} Weeks Ahead`;
    return `${Math.abs(offset)} Weeks Ago`;
  });

  // Computed signal for week range text using date-fns
  weekRangeText = computed<string>(() => {
    const data = this.weekData();
    return `${format(data.weekStart, 'MMM d')} - ${format(data.weekEnd, 'MMM d')}, ${format(data.weekEnd, 'yyyy')}`;
  });

  // Computed signal for JSON display
  weekDataJson = computed<string>(() => {
    const data = this.weekData();
    return JSON.stringify({
      offset: data.offset,
      formatted: data.formatted,
      dayNames: data.dayNames,
      shortNames: data.shortNames,
      isCurrentWeek: data.isCurrentWeek
    }, null, 2);
  });

  constructor() { }

  ngOnInit() { 
    this.weekRangeLabel.emit(this.weekRangeText());
    this.weekDataResult.emit(this.weekDataJson());
  }

  // Get week days based on offset using date-fns
  getWeekDays(offset: number = 0, startDay: number = 0): WeekData {
    const today = new Date();
    const targetDate = addWeeks(today, offset);
    
    const weekStart = startOfWeek(targetDate, { weekStartsOn: startDay as 0 | 1 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: startDay as 0 | 1 });
    
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: weekEnd
    });
    
    return {
      offset,
      weekStart,
      weekEnd,
      dates: weekDays,
      formatted: weekDays.map(day => format(day, 'yyyy-MM-dd')),
      dayNames: weekDays.map(day => format(day, 'EEEE')),
      shortNames: weekDays.map(day => format(day, 'EEEEE')),
      dayNumbers: weekDays.map(day => format(day, 'd')),
      monthDays: weekDays.map(day => format(day, 'MMM d')),
      isCurrentWeek: offset === 0
    };
  }

  // Navigation methods
  navigateToPreviousWeek(): void {
    this.currentWeekOffset.update(prev => prev - 1);
    this.weekRangeLabel.emit(this.weekRangeText());
    this.weekDataResult.emit(this.weekDataJson());
  }

  navigateToNextWeek(): void {
    this.currentWeekOffset.update(prev => prev + 1);
    this.weekRangeLabel.emit(this.weekRangeText());
    this.weekDataResult.emit(this.weekDataJson());
  }

  navigateToCurrentWeek(): void {
    this.currentWeekOffset.set(0);
    this.weekRangeLabel.emit(this.weekRangeText());
    this.weekDataResult.emit(this.weekDataJson());
  }

  // Handle week start change
  onWeekStartChange(value: number): void {
    this.weekStartsOn.set(value);
  }

  // Get CSS classes for day cells using date-fns
  getDayClasses(day: Date, index: number): string {
    const isTodayCheck = this.weekData().isCurrentWeek && isToday(day);
    
    const baseClasses = 'p-1 text-center rounded-lg border-1 transition-all';
    const todayClasses = 'bg-lime-100 text-lime-800 border-lime-300';
    const normalClasses = 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    
    return `${baseClasses} ${isTodayCheck ? todayClasses : normalClasses}`;
  }

  // Handle day click
  onDayClick(day: Date): void {
    console.log('Day clicked:', day);
  }

}
