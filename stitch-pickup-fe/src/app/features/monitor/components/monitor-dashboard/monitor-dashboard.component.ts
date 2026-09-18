import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MonitorService, LevelFilter, AlertStatusFilter } from '../../services/monitor.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { TeacherService, TeacherGroup, TeacherStudent, FamilyMemberDto, TeacherStudentUpdatePayload, TeacherParentAccount, TeacherStudentCreatePayload, TeacherParentAccountInput } from '../../../../core/services/teacher.service';
import { ImageUploadService } from '../../../../core/services/image-upload.service';
import { WakeLockService } from '../../../../core/services/wake-lock.service';
import { StatsHeaderComponent } from '../stats-header/stats-header.component';
import { LevelFilterSidebarComponent } from '../level-filter-sidebar/level-filter-sidebar.component';
import { StudentMonitorCardComponent } from '../student-monitor-card/student-monitor-card.component';
import { DispatchConfirmationComponent } from '../dispatch-confirmation/dispatch-confirmation.component';
import { TableSkeletonComponent } from '../../../../shared/components/table-skeleton/table-skeleton.component';
import { PwaInstallBannerComponent } from '../../../../shared/components/pwa-install-banner/pwa-install-banner.component';

import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-monitor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatsHeaderComponent,
    LevelFilterSidebarComponent,
    StudentMonitorCardComponent,
    DispatchConfirmationComponent,
    TableSkeletonComponent,
    PwaInstallBannerComponent
  ],
  templateUrl: './monitor-dashboard.component.html',
  styleUrl: './monitor-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitorDashboardComponent implements OnInit, OnDestroy {
  readonly monitorService = inject(MonitorService);
  readonly authService = inject(AuthService);
  readonly teacherService = inject(TeacherService);
  readonly imageUpload = inject(ImageUploadService);
  readonly ws = inject(WebSocketService);
  readonly wakeLock = inject(WakeLockService);
  private readonly router = inject(Router);
  readonly appVersion = environment.appVersion;

  readonly currentTheme = signal<'light' | 'dark'>(
    (localStorage.getItem('monitor_theme') as 'light' | 'dark') || 'light'
  );

  readonly activeTab = signal<'MONITOR' | 'GROUPS'>('MONITOR');

  // Fullscreen / TV Mode (80 inch screens)
  readonly isFullscreen = signal<boolean>(false);
  private onFullscreenChange?: () => void;

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Error al activar pantalla completa:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn('Error al salir de pantalla completa:', err);
        });
      }
    }
  }

  // Mobile drawer state for delivered students history
  readonly isMobileDeliveriesOpen = signal<boolean>(false);

  toggleMobileDeliveries(): void {
    this.isMobileDeliveriesOpen.update(v => !v);
  }

  // Student Edit Modal for Teacher
  readonly showEditModal = signal<boolean>(false);
  readonly editingStudent = signal<TeacherStudent | null>(null);
  editName = '';
  editGrade = '';
  editBirthday = '';
  editGender: 'M' | 'F' = 'M';
  editCurp = '';
  editAvatarUrl = '';
  editError = '';
  isSavingStudent = signal<boolean>(false);
  readonly isUploadingPhoto = signal<boolean>(false);

  // 3 Authorized Pickup Tutors for currently edited student
  tutors: FamilyMemberDto[] = [
    { name: '', relationship: 'Mamá', phone: '', photoUrl: '', authorized: true },
    { name: '', relationship: 'Papá', phone: '', photoUrl: '', authorized: true },
    { name: '', relationship: 'Tutor / Familiar', phone: '', photoUrl: '', authorized: true }
  ];

  // WhatsApp Share Credentials Modal
  readonly showShareModal = signal<boolean>(false);
  readonly selectedStudentForShare = signal<TeacherStudent | null>(null);
  readonly selectedParentIndex = signal<number>(0);
  readonly isResettingPassword = signal<boolean>(false);
  readonly copySuccess = signal<boolean>(false);
  readonly resetSuccessMsg = signal<string>('');

  // Group selection filter in GROUPS tab
  readonly selectedGroupId = signal<string | null>(null);

  // Active status filter in group roster: 'ALL' | 'ACTIVE' | 'INACTIVE'
  readonly activeFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // New Student Modal State
  readonly showCreateModal = signal<boolean>(false);
  readonly isCreatingStudent = signal<boolean>(false);
  readonly isUploadingNewPhoto = signal<boolean>(false);
  readonly createError = signal<string>('');
  newName = '';
  newGrade = '';
  newBirthday = '';
  newGender: 'M' | 'F' = 'M';
  newCurp = '';
  newAvatarUrl = '';
  newParentName = '';
  newParentEmail = '';
  newParentPhone = '';
  copyParentToPickup = true;
  newTutors: FamilyMemberDto[] = [
    { name: '', relationship: 'Mamá', phone: '', photoUrl: '', authorized: true },
    { name: '', relationship: 'Papá', phone: '', photoUrl: '', authorized: true },
    { name: '', relationship: 'Tutor / Familiar', phone: '', photoUrl: '', authorized: true }
  ];

  // Deactivate / Reactivate Confirmation Modal State
  readonly showConfirmDeactivateModal = signal<boolean>(false);
  readonly studentForDeactivate = signal<TeacherStudent | null>(null);
  readonly isTogglingActive = signal<boolean>(false);

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.ws.connect(token);
    }

    this.monitorService.initialize();
    this.wakeLock.requestWakeLock();

    this.onFullscreenChange = () => {
      this.isFullscreen.set(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', this.onFullscreenChange);

    if (this.authService.userRole() === 'TEACHER' || this.authService.userRole() === 'ADMIN') {
      this.teacherService.loadMyGroups().subscribe(groups => {
        if (groups.length === 1) {
          this.selectedGroupId.set(groups[0].id);
        } else if (groups.length > 1 && (!this.selectedGroupId() || this.selectedGroupId() === 'ALL')) {
          this.selectedGroupId.set('ALL');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
    this.monitorService.destroy();
    this.wakeLock.releaseWakeLock();
    if (this.onFullscreenChange) {
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    }
  }

  get teacherName(): string {
    return this.authService.currentUser()?.nombre || '';
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
    localStorage.setItem('monitor_theme', newTheme);
  }

  setTab(tab: 'MONITOR' | 'GROUPS'): void {
    this.activeTab.set(tab);
    if (tab === 'GROUPS') {
      this.teacherService.loadMyGroups().subscribe(groups => {
        if (groups.length === 1) {
          this.selectedGroupId.set(groups[0].id);
        } else if (groups.length > 1 && (!this.selectedGroupId() || this.selectedGroupId() === 'ALL')) {
          this.selectedGroupId.set('ALL');
        }
      });
    }
  }

  onAvatarError(student: TeacherStudent): void {
    student.avatarUrl = undefined;
  }

  studentSearchQuery = '';

  // Cascading filters for GROUPS tab
  readonly selectedGroupLevel = signal<'ALL' | 'KINDER' | 'PRIMARIA' | 'SECUNDARIA'>('ALL');
  readonly selectedGradeFilter = signal<string>('ALL');

  get availableLevels(): { level: string; label: string; count: number }[] {
    const groups = this.teacherService.myGroups();
    const levelsMap = new Map<string, number>();
    groups.forEach(g => {
      const lvl = g.level ? g.level.toUpperCase() : 'PRIMARIA';
      levelsMap.set(lvl, (levelsMap.get(lvl) || 0) + 1);
    });

    const list: { level: string; label: string; count: number }[] = [];
    if (levelsMap.size > 1) {
      list.push({ level: 'ALL', label: '🏢 Todos los Niveles', count: groups.length });
    }
    if (levelsMap.has('KINDER')) list.push({ level: 'KINDER', label: '🌱 Kinder', count: levelsMap.get('KINDER')! });
    if (levelsMap.has('PRIMARIA')) list.push({ level: 'PRIMARIA', label: '📚 Primaria', count: levelsMap.get('PRIMARIA')! });
    if (levelsMap.has('SECUNDARIA')) list.push({ level: 'SECUNDARIA', label: '🎓 Secundaria', count: levelsMap.get('SECUNDARIA')! });
    return list;
  }

  get groupsByLevel(): TeacherGroup[] {
    const groups = this.teacherService.myGroups();
    const lvl = this.selectedGroupLevel();
    if (lvl === 'ALL') return groups;
    return groups.filter(g => (g.level || '').toUpperCase() === lvl);
  }

  get availableGradesInLevel(): string[] {
    const groups = this.groupsByLevel;
    const gradesSet = new Set<string>();
    groups.forEach(g => {
      const dashIdx = g.name.lastIndexOf('-');
      const grade = dashIdx !== -1 ? g.name.substring(0, dashIdx).trim() : g.name.trim();
      if (grade) gradesSet.add(grade);
    });
    return Array.from(gradesSet);
  }

  get filteredGroupsDropdown(): TeacherGroup[] {
    const groups = this.groupsByLevel;
    const grade = this.selectedGradeFilter();
    if (grade === 'ALL') return groups;
    return groups.filter(g => g.name.startsWith(grade));
  }

  setGroupLevel(level: string): void {
    this.selectedGroupLevel.set(level as 'ALL' | 'KINDER' | 'PRIMARIA' | 'SECUNDARIA');
    this.selectedGradeFilter.set('ALL');
    const available = this.filteredGroupsDropdown;
    if (available.length > 0) {
      this.selectedGroupId.set(available[0].id);
    }
  }

  setGradeFilter(grade: string): void {
    this.selectedGradeFilter.set(grade);
    const available = this.filteredGroupsDropdown;
    if (available.length > 0) {
      this.selectedGroupId.set(available[0].id);
    }
  }

  goToPreviousGroup(): void {
    const groups = this.filteredGroupsDropdown;
    if (groups.length <= 1) return;
    const currentId = this.selectedGroupId();
    const currentIndex = groups.findIndex(g => g.id === currentId);
    if (currentIndex > 0) {
      this.selectGroup(groups[currentIndex - 1].id);
    } else {
      this.selectGroup(groups[groups.length - 1].id);
    }
  }

  goToNextGroup(): void {
    const groups = this.filteredGroupsDropdown;
    if (groups.length <= 1) return;
    const currentId = this.selectedGroupId();
    const currentIndex = groups.findIndex(g => g.id === currentId);
    if (currentIndex >= 0 && currentIndex < groups.length - 1) {
      this.selectGroup(groups[currentIndex + 1].id);
    } else {
      this.selectGroup(groups[0].id);
    }
  }

  selectGroup(groupId: string): void {
    this.selectedGroupId.set(groupId);
    this.studentSearchQuery = '';
  }

  readonly rosterSortField = signal<'name' | 'grade' | 'curp' | 'tutors'>('name');
  readonly rosterSortDirection = signal<'asc' | 'desc'>('asc');

  toggleRosterSort(field: 'name' | 'grade' | 'curp' | 'tutors'): void {
    if (this.rosterSortField() === field) {
      this.rosterSortDirection.set(this.rosterSortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.rosterSortField.set(field);
      this.rosterSortDirection.set('asc');
    }
  }

  get totalAllStudentsCount(): number {
    return this.teacherService.myGroups().reduce((acc, g) => acc + (g.students?.length || 0), 0);
  }

  get currentGroup(): TeacherGroup | undefined {
    const gid = this.selectedGroupId();
    const groups = this.teacherService.myGroups();
    if (groups.length === 0) return undefined;
    if (gid === 'ALL' || !gid) {
      if (groups.length === 1) return groups[0];
      const allStudents: TeacherStudent[] = [];
      groups.forEach(g => {
        (g.students || []).forEach(s => {
          allStudents.push({ ...s, groupName: s.groupName || g.name });
        });
      });
      return {
        id: 'ALL',
        name: 'Todos tus Salones',
        level: groups.map(g => g.level).filter((v, i, a) => a.indexOf(v) === i).join(', '),
        students: allStudents
      };
    }
    return groups.find(g => g.id === gid) || groups[0];
  }

  setActiveFilter(filter: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.activeFilter.set(filter);
  }

  get activeStudentsCount(): number {
    return this.currentGroup?.students.filter(s => s.active).length || 0;
  }

  get inactiveStudentsCount(): number {
    return this.currentGroup?.students.filter(s => !s.active).length || 0;
  }

  get totalStudentsCount(): number {
    return this.currentGroup?.students.length || 0;
  }

  get filteredGroupStudents(): TeacherStudent[] {
    const grp = this.currentGroup;
    if (!grp || !grp.students) return [];
    let list = grp.students;

    const filter = this.activeFilter();
    if (filter === 'ACTIVE') {
      list = list.filter(s => s.active);
    } else if (filter === 'INACTIVE') {
      list = list.filter(s => !s.active);
    }

    if (this.studentSearchQuery.trim()) {
      const q = this.studentSearchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.curp && s.curp.toLowerCase().includes(q)) ||
        (s.grade && s.grade.toLowerCase().includes(q))
      );
    }

    const field = this.rosterSortField();
    const dir = this.rosterSortDirection();
    return [...list].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (field === 'name') {
        valA = a.name || '';
        valB = b.name || '';
      } else if (field === 'grade') {
        valA = a.grade || '';
        valB = b.grade || '';
      } else if (field === 'curp') {
        valA = a.curp || '';
        valB = b.curp || '';
      } else if (field === 'tutors') {
        const countA = a.familyMembers ? a.familyMembers.length : 0;
        const countB = b.familyMembers ? b.familyMembers.length : 0;
        return dir === 'asc' ? countA - countB : countB - countA;
      }
      const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base', numeric: true });
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  openEditStudentModal(student: TeacherStudent): void {
    this.editingStudent.set(student);
    this.editName = student.name;
    this.editGrade = student.grade || '';
    this.editBirthday = student.birthday || '';
    this.editGender = (student.gender as 'M' | 'F') || 'M';
    this.editCurp = student.curp || '';
    this.editAvatarUrl = student.avatarUrl || '';
    this.editError = '';

    // Load tutors or populate defaults up to 3
    const existing = student.familyMembers || [];
    this.tutors = [
      existing[0] ? { ...existing[0] } : { name: '', relationship: 'Mamá', phone: '', photoUrl: '', authorized: true },
      existing[1] ? { ...existing[1] } : { name: '', relationship: 'Papá', phone: '', photoUrl: '', authorized: true },
      existing[2] ? { ...existing[2] } : { name: '', relationship: 'Tutor / Familiar', phone: '', photoUrl: '', authorized: true }
    ];

    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingStudent.set(null);
  }

  onPhotoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.editError = 'La fotografía no debe superar 5MB.';
      return;
    }

    this.editError = '';
    this.isUploadingPhoto.set(true);

    this.imageUpload
      .uploadFile(file, 'student', this.editingStudent()?.id, this.editName || undefined)
      .subscribe({
        next: (url) => {
          this.editAvatarUrl = this.imageUpload.applyTransform(url, {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face',
            format: 'auto',
            quality: 'auto'
          });
          this.isUploadingPhoto.set(false);
        },
        error: (err) => {
          this.editError = err.message || 'Error al subir la fotografía.';
          this.isUploadingPhoto.set(false);
        }
      });
  }

  clearPhoto(): void {
    this.editAvatarUrl = '';
  }

  saveStudent(): void {
    const s = this.editingStudent();
    if (!s) return;

    if (!this.editName.trim()) {
      this.editError = 'El nombre del alumno es obligatorio.';
      return;
    }

    this.isSavingStudent.set(true);
    this.editError = '';

    // Filter valid filled tutors
    const validTutors = this.tutors
      .filter((t) => t.name && t.name.trim().length > 0)
      .map((t) => ({
        id: t.id,
        name: t.name.trim(),
        relationship: t.relationship || 'Tutor',
        phone: t.phone ? t.phone.trim() : '',
        photoUrl: t.photoUrl || '',
        authorized: t.authorized !== false
      }));

    const payload: TeacherStudentUpdatePayload = {
      name: this.editName.trim(),
      grade: this.editGrade.trim() || undefined,
      birthday: this.editBirthday || undefined,
      gender: this.editGender,
      curp: this.editCurp.trim().toUpperCase() || undefined,
      avatarUrl: this.editAvatarUrl.trim() || undefined,
      familyMembers: validTutors
    };

    this.teacherService.updateStudent(s.id, payload).subscribe({
      next: () => {
        this.isSavingStudent.set(false);
        this.closeEditModal();
      },
      error: (err) => {
        this.isSavingStudent.set(false);
        this.editError = err.error?.message || 'Error al actualizar el alumno.';
      }
    });
  }

  // ─── Create New Student Methods ────────────────────────────────────────────

  openCreateStudentModal(): void {
    const grp = this.currentGroup;
    this.createError.set('');
    this.newName = '';
    this.newGrade = grp?.name || '';
    this.newBirthday = '';
    this.newGender = 'M';
    this.newCurp = '';
    this.newAvatarUrl = '';
    this.newParentName = '';
    this.newParentEmail = '';
    this.newParentPhone = '';
    this.copyParentToPickup = true;
    this.newTutors = [
      { name: '', relationship: 'Mamá', phone: '', photoUrl: '', authorized: true },
      { name: '', relationship: 'Papá', phone: '', photoUrl: '', authorized: true },
      { name: '', relationship: 'Tutor / Familiar', phone: '', photoUrl: '', authorized: true }
    ];
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onParentDataChange(): void {
    if (this.copyParentToPickup && this.newTutors.length > 0) {
      if (this.newParentName.trim()) {
        this.newTutors[0].name = this.newParentName.trim();
      }
      if (this.newParentPhone.trim()) {
        this.newTutors[0].phone = this.newParentPhone.trim();
      }
    }
  }

  onNewPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.createError.set('La fotografía no debe superar 5MB.');
      return;
    }

    this.isUploadingNewPhoto.set(true);
    this.imageUpload
      .uploadFile(file, 'student', undefined, this.newName || undefined)
      .subscribe({
        next: (url: string) => {
          this.newAvatarUrl = this.imageUpload.applyTransform(url, {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face',
            format: 'auto',
            quality: 'auto'
          });
          this.isUploadingNewPhoto.set(false);
        },
        error: (err: any) => {
          this.isUploadingNewPhoto.set(false);
          alert(err.error?.message || err.message || 'Error al subir la fotografía.');
        }
      });
  }

  saveNewStudent(): void {
    if (!this.newName.trim()) {
      this.createError.set('El nombre del alumno es obligatorio.');
      return;
    }
    const grp = this.currentGroup;
    if (!grp) {
      this.createError.set('No hay un grupo escolar seleccionado.');
      return;
    }

    if (this.newParentEmail.trim() && !this.newParentEmail.includes('@')) {
      this.createError.set('Por favor ingresa un correo electrónico válido para el padre.');
      return;
    }

    this.isCreatingStudent.set(true);
    this.createError.set('');

    const parentAccounts: TeacherParentAccountInput[] = [];
    if (this.newParentEmail.trim()) {
      parentAccounts.push({
        nombre: this.newParentName.trim() || undefined,
        email: this.newParentEmail.trim().toLowerCase(),
        phone: this.newParentPhone.trim() || undefined
      });
    }

    const validTutors = this.newTutors
      .filter(t => t.name && t.name.trim().length > 0)
      .map(t => ({
        ...t,
        name: t.name.trim(),
        relationship: t.relationship || 'Tutor',
        phone: t.phone ? t.phone.trim() : '',
        photoUrl: t.photoUrl || '',
        authorized: t.authorized !== false
      }));

    const payload: TeacherStudentCreatePayload = {
      name: this.newName.trim(),
      groupId: grp.id,
      grade: this.newGrade.trim() || grp.name,
      birthday: this.newBirthday || undefined,
      gender: this.newGender,
      curp: this.newCurp.trim() ? this.newCurp.trim().toUpperCase() : undefined,
      avatarUrl: this.newAvatarUrl ? this.newAvatarUrl.trim() : undefined,
      parentAccounts: parentAccounts.length > 0 ? parentAccounts : undefined,
      familyMembers: validTutors.length > 0 ? validTutors : undefined
    };

    this.teacherService.createStudent(payload).subscribe({
      next: (created) => {
        this.isCreatingStudent.set(false);
        this.closeCreateModal();
        // Si se vinculó cuenta de padre, abrir automáticamente la ficha de WhatsApp para enviar accesos
        if (created.parentAccounts && created.parentAccounts.length > 0) {
          this.openShareModal(created);
        }
      },
      error: (err) => {
        this.isCreatingStudent.set(false);
        this.createError.set(err.error?.message || 'Error al registrar al alumno.');
      }
    });
  }

  // ─── Deactivate / Reactivate Student Methods ───────────────────────────────

  openConfirmToggleActive(student: TeacherStudent): void {
    this.studentForDeactivate.set(student);
    this.showConfirmDeactivateModal.set(true);
  }

  closeConfirmToggleActive(): void {
    this.showConfirmDeactivateModal.set(false);
    this.studentForDeactivate.set(null);
  }

  executeToggleActive(): void {
    const student = this.studentForDeactivate();
    if (!student) return;

    this.isTogglingActive.set(true);
    this.teacherService.toggleStudentActive(student.id).subscribe({
      next: () => {
        this.isTogglingActive.set(false);
        this.closeConfirmToggleActive();
      },
      error: (err) => {
        this.isTogglingActive.set(false);
        alert(err.error?.message || 'Error al actualizar el estado del alumno.');
      }
    });
  }

  onFilterChange(level: LevelFilter): void {
    this.monitorService.setLevelFilter(level);
  }

  onStatusFilterChange(status: AlertStatusFilter): void {
    this.monitorService.setStatusFilter(status);
  }

  onRefreshMonitor(): void {
    this.monitorService.refresh();
  }

  onDispatch(alertId: string): void {
    this.monitorService.dispatch(alertId);
  }

  onDispatchAll(): void {
    const count = this.monitorService.totalActive();
    if (count === 0) return;
    if (window.confirm(`¿Confirmas que deseas registrar la entrega de los ${count} alumnos pendientes de hoy?`)) {
      this.monitorService.dispatchAllActive();
    }
  }

  onRevertDelivery(event: { deliveryId: string; studentName: string }): void {
    this.monitorService.revertDelivery(event.deliveryId, event.studentName);
  }

  // ─── WhatsApp / Parent Access Share Modal Methods ──────────────────────────

  openShareModal(student: TeacherStudent): void {
    this.selectedStudentForShare.set(student);
    this.selectedParentIndex.set(0);
    this.copySuccess.set(false);
    this.resetSuccessMsg.set('');
    this.showShareModal.set(true);
  }

  closeShareModal(): void {
    this.showShareModal.set(false);
    this.selectedStudentForShare.set(null);
  }

  selectParentForShare(index: number): void {
    this.selectedParentIndex.set(index);
    this.copySuccess.set(false);
    this.resetSuccessMsg.set('');
  }

  get currentParentAccount(): TeacherParentAccount | null {
    const student = this.selectedStudentForShare();
    if (!student || !student.parentAccounts || student.parentAccounts.length === 0) return null;
    return student.parentAccounts[this.selectedParentIndex()] || student.parentAccounts[0];
  }

  get shareMessage(): string {
    const student = this.selectedStudentForShare();
    const parent = this.currentParentAccount;
    if (!student || !parent) return '';

    const groupName = student.groupName || 'Colegio';
    const portalUrl = 'https://pickup.institutoingles.edu.mx/auth/padres';

    if (parent.tempPassword) {
      return `🚗 *IIT Pickup — Acceso al Portal de Padres*\n\n` +
        `Estimado/a *${parent.nombre}*, le compartimos sus credenciales de acceso para *${student.name}* (${groupName}):\n\n` +
        `🌐 *Portal:* ${portalUrl}\n` +
        `👤 *Usuario:* ${parent.email}\n` +
        `🔑 *Contraseña temporal:* IIT2026\n\n` +
        `⚠️ _Por la seguridad de su hijo/a, al ingresar por primera vez el sistema le solicitará crear su contraseña personal e intransferible._`;
    } else {
      return `🚗 *IIT Pickup — Acceso al Portal de Padres*\n\n` +
        `Estimado/a *${parent.nombre}*, le compartimos el enlace de acceso al sistema para *${student.name}* (${groupName}):\n\n` +
        `🌐 *Portal:* ${portalUrl}\n` +
        `👤 *Usuario:* ${parent.email}\n` +
        `🔑 *Contraseña:* Ya configurada previamente por usted.\n\n` +
        `💡 _Si olvidó su contraseña, puede solicitarnos restablecerla temporalmente a IIT2026._`;
    }
  }

  copyShareMessage(): void {
    const msg = this.shareMessage;
    if (!msg) return;

    navigator.clipboard.writeText(msg).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 3000);
    });
  }

  openWhatsAppDirect(): void {
    const msg = this.shareMessage;
    if (!msg) return;
    const parent = this.currentParentAccount;
    const phone = parent?.phone ? parent.phone.replace(/\D/g, '') : '';
    const cleanPhone = phone.length === 10 ? `52${phone}` : phone;
    const url = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  resetPassword(parentId: string): void {
    if (!confirm('¿Deseas restablecer la contraseña a IIT2026 para esta cuenta de padre?')) return;

    this.isResettingPassword.set(true);
    this.resetSuccessMsg.set('');

    this.teacherService.resetParentPassword(parentId).subscribe({
      next: () => {
        this.isResettingPassword.set(false);
        this.resetSuccessMsg.set('¡Contraseña restablecida a IIT2026 exitosamente!');
        // Update local state in modal
        const current = this.selectedStudentForShare();
        if (current && current.parentAccounts) {
          const updatedAccounts = current.parentAccounts.map((p) =>
            p.id === parentId ? { ...p, tempPassword: true } : p
          );
          this.selectedStudentForShare.set({ ...current, parentAccounts: updatedAccounts });
        }
      },
      error: (err) => {
        this.isResettingPassword.set(false);
        alert(err.error?.message || 'Error al restablecer la contraseña.');
      }
    });
  }

  logout(): void {
    this.ws.disconnect();
    this.authService.logout();
    this.router.navigate(['/auth/maestros']);
  }
}
