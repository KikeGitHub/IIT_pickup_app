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
    this.adminService.loadKpis('day').subscribe();
  }

  setPeriod(period: 'day' | 'week' | 'month'): void {
    this.adminService.loadKpis(period).subscribe();
  }

  getLevelPercent(level: string): number {
    const kpis = this.adminService.kpis();
    if (!kpis || !kpis.alertsByLevel) return 0;
    const total = (kpis.alertsByLevel['KINDER'] || 0) + (kpis.alertsByLevel['PRIMARIA'] || 0) + (kpis.alertsByLevel['SECUNDARIA'] || 0);
    if (total === 0) return 0;
    const val = kpis.alertsByLevel[level] || 0;
    return Math.round((val / total) * 100);
  }

  getMethodPercent(method: string): number {
    const kpis = this.adminService.kpis();
    if (!kpis || !kpis.alertsByMethod) return 0;
    const total = (kpis.alertsByMethod['CAR'] || 0) + (kpis.alertsByMethod['WALK'] || 0);
    if (total === 0) return 0;
    const val = kpis.alertsByMethod[method] || 0;
    return Math.round((val / total) * 100);
  }
}
