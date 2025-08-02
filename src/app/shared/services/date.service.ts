import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {

  constructor() { }

  getNextHours() {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHours = [];
    
    // Generate hours from current hour to 23 (11 PM)
    for (let hour = currentHour; hour <= 23; hour++) {
        nextHours.push(hour);
    }
    
    return nextHours;
  }

  getNextHours24Format() {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHours = [];
    
    for (let hour = currentHour; hour <= 23; hour++) {
        nextHours.push(hour.toString().padStart(2, '0') + ':00');
    }
    
    return nextHours;
  }

}
