import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { TeacherDeliveryMetric } from '../../models/admin.models';

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
  protected readonly Math = Math;

  /** Modo de visualización de gráficos: 'deliveries' (entregas reales) o 'alerts' (solicitudes de llegada) */
  readonly dataMode = signal<'deliveries' | 'alerts'>('deliveries');

  /** Control para mostrar todos los maestros o solo los 5 principales */
  readonly showAllTeachers = signal<boolean>(false);

  /** Maestro seleccionado para ver modal de insights detallados */
  readonly selectedTeacher = signal<TeacherDeliveryMetric | null>(null);

  ngOnInit(): void {
    this.adminService.loadKpis('day').subscribe();
  }

  setPeriod(period: 'day' | 'week' | 'month'): void {
    this.adminService.loadKpis(period).subscribe();
  }

  setDataMode(mode: 'deliveries' | 'alerts'): void {
    this.dataMode.set(mode);
  }

  toggleShowAllTeachers(): void {
    this.showAllTeachers.update(v => !v);
  }

  selectTeacher(teacher: TeacherDeliveryMetric): void {
    this.selectedTeacher.set(teacher);
  }

  closeTeacherModal(): void {
    this.selectedTeacher.set(null);
  }

  // ─── Conteo y Porcentajes por Nivel ──────────────────────────────────────────
  getLevelCount(level: string): number {
    const kpis = this.adminService.kpis();
    if (!kpis) return 0;
    if (this.dataMode() === 'deliveries') {
      const map = kpis.deliveriesByLevel || {};
      return map[level] || 0;
    }
    const map = kpis.alertsByLevel || {};
    return map[level] || 0;
  }

  getTotalLevelCount(): number {
    return this.getLevelCount('KINDER') + this.getLevelCount('PRIMARIA') + this.getLevelCount('SECUNDARIA');
  }

  getLevelPercent(level: string): number {
    const total = this.getTotalLevelCount();
    if (total === 0) return 0;
    return Math.round((this.getLevelCount(level) / total) * 100);
  }

  // ─── Conteo y Porcentajes por Modalidad ──────────────────────────────────────
  getMethodCount(method: string): number {
    const kpis = this.adminService.kpis();
    if (!kpis) return 0;
    if (this.dataMode() === 'deliveries') {
      const map = kpis.deliveriesByMethod || {};
      return map[method] || 0;
    }
    const map = kpis.alertsByMethod || {};
    return map[method] || 0;
  }

  getTotalMethodCount(): number {
    return this.getMethodCount('CAR') + this.getMethodCount('WALK');
  }

  getMethodPercent(method: string): number {
    const total = this.getTotalMethodCount();
    if (total === 0) return 0;
    return Math.round((this.getMethodCount(method) / total) * 100);
  }

  // ─── Métrica de Cumplimiento / Efectividad ──────────────────────────────────
  get completionRate(): number {
    const kpis = this.adminService.kpis();
    if (!kpis || kpis.totalAlertsToday === 0) return 0;
    return Math.min(100, Math.round((kpis.totalDeliveredToday / kpis.totalAlertsToday) * 100));
  }

  get speedStatus(): { label: string; class: string; icon: string } {
    const kpis = this.adminService.kpis();
    const avg = kpis?.avgPickupTimeMinutes || 0;
    if (avg === 0) return { label: 'Sin datos', class: 'neutral', icon: '⏱' };
    if (avg <= 3.0) return { label: 'Rápido', class: 'fast', icon: '⚡' };
    if (avg <= 5.5) return { label: 'Óptimo', class: 'good', icon: '✅' };
    return { label: 'Demora', class: 'slow', icon: '⚠️' };
  }

  // ─── Lista Paginada de Maestros ─────────────────────────────────────────────
  getDisplayedTeachers(): TeacherDeliveryMetric[] {
    const kpis = this.adminService.kpis();
    const list = kpis?.teacherMetrics || [];
    if (this.showAllTeachers()) {
      return list;
    }
    return list.slice(0, 5);
  }

  // ─── Insights Inteligentes por Docente ──────────────────────────────────────
  getTeacherInsight(t: TeacherDeliveryMetric): string {
    const overallAvg = this.adminService.kpis()?.avgPickupTimeMinutes || 5.0;
    const levelStr = t.topLevel ? `el nivel ${t.topLevel}` : 'sus salones asignados';

    if (t.avgTimeMinutes <= 2.5) {
      return `⚡ Desempeño Sobresaliente: ${t.teacherName} despacha en un promedio récord de ${t.avgTimeMinutes} min por alumno. Su agilidad evita cuellos de botella en la salida para ${levelStr}.`;
    } else if (t.avgTimeMinutes <= overallAvg) {
      const diff = Math.round(((overallAvg - t.avgTimeMinutes) / Math.max(0.1, overallAvg)) * 100);
      return `✅ Flujo Eficiente: Mantiene un ritmo constante de ${t.avgTimeMinutes} min por entrega, siendo un ${diff}% más rápido que el promedio general escolar en ${levelStr}.`;
    } else {
      return `⏱️ Flujo Constante: Promedia ${t.avgTimeMinutes} min por alumno. Se sugiere apoyo del personal de guardia durante la hora pico para mantener el circuito vehicular ágil.`;
    }
  }

  getTeacherComparison(t: TeacherDeliveryMetric): { diffPercent: number; isFaster: boolean } {
    const overallAvg = this.adminService.kpis()?.avgPickupTimeMinutes || 5.0;
    if (overallAvg <= 0) return { diffPercent: 0, isFaster: true };
    const diff = Math.round(Math.abs((overallAvg - t.avgTimeMinutes) / overallAvg) * 100);
    return {
      diffPercent: diff,
      isFaster: t.avgTimeMinutes <= overallAvg
    };
  }
}
