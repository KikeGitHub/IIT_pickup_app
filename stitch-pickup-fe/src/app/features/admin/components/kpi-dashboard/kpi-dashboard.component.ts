import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-dashboard.component.html',
  styleUrl: './kpi-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiDashboardComponent implements OnInit {
  readonly adminService = inject(AdminService);

  ngOnInit(): void {
    this.adminService.loadKpis().subscribe();
  }
}
