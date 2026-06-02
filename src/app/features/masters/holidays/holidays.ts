import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './holidays.html',
  styleUrl: './holidays.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HolidaysComponent {}
