import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './locations.html',
  styleUrl: './locations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationsComponent {}
