import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminUser } from '../../services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements OnInit {
  readonly adminService = inject(AdminService);
  readonly selectedRoleFilter = signal<'ALL' | 'PARENT' | 'TEACHER' | 'ADMIN'>('ALL');

  ngOnInit(): void {
    this.adminService.loadUsers();
  }

  get filteredUsers(): AdminUser[] {
    const filter = this.selectedRoleFilter();
    const all = this.adminService.users();
    if (filter === 'ALL') return all;
    return all.filter(u => u.role === filter);
  }

  setRoleFilter(role: 'ALL' | 'PARENT' | 'TEACHER' | 'ADMIN'): void {
    this.selectedRoleFilter.set(role);
  }
}
