import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationService, SimulateAlertPayload } from '../../../core/services/simulation.service';
import { ConnectivityService, NetworkSimulationMode } from '../../../core/services/connectivity.service';
import { MonitorService } from '../../../features/monitor/services/monitor.service';

@Component({
  selector: 'app-simulation-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulation-panel.component.html',
  styleUrl: './simulation-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimulationPanelComponent {
  readonly sim = inject(SimulationService);
  readonly connectivity = inject(ConnectivityService);
  readonly monitor = inject(MonitorService);

  // Form State
  selectedStudentId = 'RANDOM';
  selectedStatus: 'TEN_MIN' | 'FIVE_MIN' | 'EN_FILA' | 'URGENTE' = 'EN_FILA';
  selectedPickupMethod: 'CAR' | 'WALK' = 'CAR';
  selectedMinutesAgo = 0;

  get students() {
    return this.sim.availableStudents;
  }

  setNetwork(mode: NetworkSimulationMode): void {
    this.sim.setNetworkMode(mode);
  }

  resetNetwork(): void {
    this.sim.setNetworkMode('normal');
  }

  sendSimulatedAlert(): void {
    const payload: SimulateAlertPayload = {
      studentId: this.selectedStudentId === 'RANDOM' ? undefined : this.selectedStudentId,
      status: this.selectedStatus,
      pickupMethod: this.selectedPickupMethod,
      minutesAgo: Number(this.selectedMinutesAgo) || 0
    };

    if (this.selectedStudentId !== 'RANDOM') {
      const found = this.students.find(s => s.id === this.selectedStudentId);
      if (found) {
        payload.studentName = found.name;
      }
    }

    this.sim.simulateAlert(payload).subscribe();
  }

  sendBurst(): void {
    this.sim.simulateBurst();
  }

  dispatchAll(): void {
    this.monitor.dispatchAllActive();
  }

  refreshMonitor(): void {
    this.monitor.refresh();
  }

  close(): void {
    this.sim.closePanel();
  }
}
