import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-professional-schedule',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss']
})
export class ProfessionalSchedulePage implements OnInit {
  weekDays = [
    { name: 'Lunes', hasSchedule: true, timeRange: '9:00 - 18:00', isToday: false },
    { name: 'Martes', hasSchedule: true, timeRange: '9:00 - 18:00', isToday: false },
    { name: 'Miércoles', hasSchedule: true, timeRange: '9:00 - 18:00', isToday: false },
    { name: 'Jueves', hasSchedule: true, timeRange: '9:00 - 18:00', isToday: true },
    { name: 'Viernes', hasSchedule: true, timeRange: '9:00 - 18:00', isToday: false },
    { name: 'Sábado', hasSchedule: false, timeRange: '', isToday: false },
    { name: 'Domingo', hasSchedule: false, timeRange: '', isToday: false },
  ];

  constructor() {}

  ngOnInit() {}
}
