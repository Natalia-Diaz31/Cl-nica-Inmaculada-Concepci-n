import {
  Appointment,
  ClinicService,
  HealthcareProfessional,
  Patient,
  ReceptionNotification,
  WaitlistEntry,
} from '../types';

export const CLINIC_SERVICES: ClinicService[] = [
  {
    id: 'medicina_general',
    name: 'Medicina General',
    description: 'Atención primaria, evaluación integral preventiva, diagnóstico y control de enfermedades comunes.',
    estimatedDurationMinutes: 20,
    iconName: 'Stethoscope',
    color: '#244A86',
    defaultBuilding: 'Edificio Principal',
    imageUrl: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'medicina_interna',
    name: 'Medicina Interna',
    description: 'Diagnóstico y manejo clínico de patologías crónicas, hipertensión, diabetes y adultos mayores.',
    estimatedDurationMinutes: 30,
    iconName: 'HeartPulse',
    color: '#1E40AF',
    defaultBuilding: 'Edificio Principal',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'fisioterapia',
    name: 'Fisioterapia y Rehabilitación',
    description: 'Terapia física muscular, rehabilitación motriz, alivio del dolor y recuperación funcional.',
    estimatedDurationMinutes: 40,
    iconName: 'Activity',
    color: '#0D9488',
    defaultBuilding: 'Edificio Principal',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'enfermeria',
    name: 'Enfermería Parroquial',
    description: 'Curaciones, retiro de puntos, toma de signos vitales, inyecciones y control glucémico.',
    estimatedDurationMinutes: 20,
    iconName: 'Syringe',
    color: '#0284C7',
    defaultBuilding: 'Edificio Principal',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_PROFESSIONALS: HealthcareProfessional[] = [
  {
    id: 'prof-1',
    name: 'Dr. Ricardo Morales',
    title: 'Médico General y Familiar',
    serviceId: 'medicina_general',
    serviceName: 'Medicina General',
    email: 'rmorales@clinicainmaculada.sv',
    room: 'Consultorio 101',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    workingDays: [1, 2, 3, 4, 5, 6], // Lun - Sab
    startHour: '08:00',
    endHour: '17:00',
    slotDurationMinutes: 20,
    building: 'Edificio Principal',
    blockedDates: [],
  },
  {
    id: 'prof-2',
    name: 'Dra. Elena Fuentes',
    title: 'Especialista en Medicina Interna',
    serviceId: 'medicina_interna',
    serviceName: 'Medicina Interna',
    email: 'efuentes@clinicainmaculada.sv',
    room: 'Consultorio 102',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813591-92576b2eb3f5?w=150&auto=format&fit=crop&q=80',
    workingDays: [1, 2, 3, 4, 5], // Lun - Vie
    startHour: '08:00',
    endHour: '16:00',
    slotDurationMinutes: 30,
    building: 'Edificio Principal',
    blockedDates: [],
  },
  {
    id: 'prof-3',
    name: 'Lic. Carlos Mendoza',
    title: 'Licenciado en Fisioterapia y Rehabilitación',
    serviceId: 'fisioterapia',
    serviceName: 'Fisioterapia y Rehabilitación',
    email: 'cmendoza@clinicainmaculada.sv',
    room: 'Área de Terapia 1',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    workingDays: [1, 2, 3, 4, 5, 6], // Lun - Sab
    startHour: '08:30',
    endHour: '16:30',
    slotDurationMinutes: 40,
    building: 'Edificio Principal',
    blockedDates: [],
  },
  {
    id: 'prof-4',
    name: 'Licda. Sofía Rivas',
    title: 'Enfermera Clínica Parroquial',
    serviceId: 'enfermeria',
    serviceName: 'Enfermería Parroquial',
    email: 'srivas@clinicainmaculada.sv',
    room: 'Clínica de Curaciones',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    workingDays: [1, 2, 3, 4, 5, 6], // Lun - Sab
    startHour: '08:00',
    endHour: '17:00',
    slotDurationMinutes: 20,
    building: 'Edificio Principal',
    blockedDates: [],
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    fullName: 'Juan Antonio Pérez',
    documentId: '02458912-3',
    phone: '7845-1234',
    email: 'juan.perez@ejemplo.com',
    isSuspended: false,
    unexcusedAbsencesCount: 0,
    absenceHistory: [],
    familyMembers: [
      {
        id: 'fam-1',
        fullName: 'María Elena Pérez (Madre)',
        relationship: 'Madre',
        documentId: '00984512-1',
        birthDate: '1958-04-12',
        notes: 'Adulto mayor, hipertensión controlada',
      },
      {
        id: 'fam-2',
        fullName: 'Mateo Pérez (Hijo)',
        relationship: 'Hijo/a',
        birthDate: '2019-09-20',
        notes: 'Menor de edad, control pediátrico escolar',
      },
    ],
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'pat-2',
    fullName: 'María del Carmen Gómez',
    documentId: '03847291-5',
    phone: '7123-4567',
    email: 'carmen.gomez@ejemplo.com',
    isSuspended: false,
    unexcusedAbsencesCount: 2,
    absenceHistory: [
      {
        id: 'abs-1',
        date: '2026-09-15',
        appointmentId: 'MCP-HIST-01',
        serviceName: 'Medicina General',
        markedAt: '2026-09-15T09:30:00Z',
        markedBy: 'Carmen Menjívar (Recepción)',
      },
      {
        id: 'abs-2',
        date: '2026-10-02',
        appointmentId: 'MCP-HIST-02',
        serviceName: 'Fisioterapia',
        markedAt: '2026-10-02T11:45:00Z',
        markedBy: 'Carmen Menjívar (Recepción)',
      },
    ],
    familyMembers: [],
    createdAt: '2026-08-15T14:30:00Z',
  },
  {
    id: 'pat-3',
    fullName: 'Carlos Alberto Romero',
    documentId: '01928374-9',
    phone: '7982-3412',
    email: 'carlos.romero@ejemplo.com',
    isSuspended: true,
    suspensionReason: '3 inasistencias en un periodo menor a 6 meses (20/08, 14/09, 22/10). Requiere intervención de recepción.',
    suspensionDate: '2026-10-22T12:00:00Z',
    unexcusedAbsencesCount: 3,
    absenceHistory: [
      {
        id: 'abs-3-1',
        date: '2026-08-20',
        appointmentId: 'MCP-HIST-03',
        serviceName: 'Medicina General',
        markedAt: '2026-08-20T10:00:00Z',
        markedBy: 'Carmen Menjívar (Recepción)',
      },
      {
        id: 'abs-3-2',
        date: '2026-09-14',
        appointmentId: 'MCP-HIST-04',
        serviceName: 'Medicina General',
        markedAt: '2026-09-14T14:15:00Z',
        markedBy: 'Carmen Menjívar (Recepción)',
      },
      {
        id: 'abs-3-3',
        date: '2026-10-22',
        appointmentId: 'MCP-HIST-05',
        serviceName: 'Enfermería',
        markedAt: '2026-10-22T08:30:00Z',
        markedBy: 'Carmen Menjívar (Recepción)',
      },
    ],
    familyMembers: [],
    createdAt: '2026-07-10T09:00:00Z',
  },
  {
    id: 'pat-4',
    fullName: 'Rosa Elizabeth Henríquez',
    documentId: '05612348-1',
    phone: '7456-7890',
    email: '',
    isSuspended: false,
    unexcusedAbsencesCount: 0,
    absenceHistory: [],
    familyMembers: [],
    createdAt: '2026-10-05T16:20:00Z',
  },
];

// Helper to calculate cancellation deadline (24 hours prior to appointment)
export const calculateCancelDeadline = (dateStr: string, timeStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);
  const appDate = new Date(year, month - 1, day, hour, min);
  const deadline = new Date(appDate.getTime() - 24 * 60 * 60 * 1000);
  return deadline.toISOString();
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  // Citas para mañana lunes 9 de noviembre de 2026 (activa para Juan Pérez)
  {
    id: 'apt-1',
    code: 'MCP-2026-1081',
    patientId: 'pat-1',
    patientName: 'Juan Antonio Pérez',
    patientPhone: '7845-1234',
    patientEmail: 'juan.perez@ejemplo.com',
    isForFamilyMember: false,
    serviceId: 'medicina_general',
    serviceName: 'Medicina General',
    professionalId: 'prof-1',
    professionalName: 'Dr. Ricardo Morales',
    date: '2026-11-09',
    time: '09:00',
    durationMinutes: 20,
    building: 'Edificio Principal',
    room: 'Consultorio 101',
    reason: 'Control de rutina y revisión de presión arterial',
    status: 'confirmada',
    cancelDeadline: calculateCancelDeadline('2026-11-09', '09:00'),
    createdByRole: 'paciente',
    channel: 'web',
    reminder24hSent: true,
    reminder2hSent: false,
    reminderStatus: 'confirmada',
    auditLogs: [
      {
        timestamp: '2026-11-05T10:12:00Z',
        actor: 'Juan Antonio Pérez',
        role: 'paciente',
        action: 'Creación de cita en línea',
        details: 'Agendó cita para Medicina General',
      },
      {
        timestamp: '2026-11-08T09:00:00Z',
        actor: 'Sistema',
        role: 'paciente',
        action: 'Recordatorio 24h enviado',
        details: 'Paciente confirmó asistencia vía WhatsApp simulado',
      },
    ],
    createdAt: '2026-11-05T10:12:00Z',
  },
  // Cita para familiar de Juan Pérez en Fisioterapia
  {
    id: 'apt-2',
    code: 'MCP-2026-1082',
    patientId: 'pat-1',
    patientName: 'Juan Antonio Pérez',
    patientPhone: '7845-1234',
    isForFamilyMember: true,
    familyMemberName: 'María Elena Pérez (Madre)',
    familyMemberRelationship: 'Madre',
    serviceId: 'fisioterapia',
    serviceName: 'Fisioterapia y Rehabilitación',
    professionalId: 'prof-3',
    professionalName: 'Lic. Carlos Mendoza',
    date: '2026-11-10',
    time: '10:00',
    durationMinutes: 40,
    building: 'Edificio Principal',
    room: 'Área de Terapia 1',
    reason: 'Dolor crónico en hombro derecho y terapia de movilidad',
    status: 'programada',
    cancelDeadline: calculateCancelDeadline('2026-11-10', '10:00'),
    createdByRole: 'paciente',
    channel: 'web',
    reminder24hSent: false,
    reminder2hSent: false,
    reminderStatus: 'pendiente',
    auditLogs: [
      {
        timestamp: '2026-11-06T15:00:00Z',
        actor: 'Juan Antonio Pérez',
        role: 'paciente',
        action: 'Creación de cita para familiar',
        details: 'Agendó para María Elena Pérez (Madre)',
      },
    ],
    createdAt: '2026-11-06T15:00:00Z',
  },
  // Cita para hoy 8 de noviembre a las 15:00 en Edificio Anexo (Sábado/Domingo de guardia)
  {
    id: 'apt-3',
    code: 'MCP-2026-1083',
    patientId: 'pat-4',
    patientName: 'Rosa Elizabeth Henríquez',
    patientPhone: '7456-7890',
    isForFamilyMember: false,
    serviceId: 'enfermeria',
    serviceName: 'Enfermería Parroquial',
    professionalId: 'prof-4',
    professionalName: 'Licda. Sofía Rivas',
    date: '2026-11-08',
    time: '14:20',
    durationMinutes: 20,
    building: 'Edificio Anexo',
    room: 'Clínica de Curaciones',
    reason: 'Curación de herida operatoria leve y cambio de vendaje',
    status: 'en_espera', // Marked arrived by reception!
    cancelDeadline: calculateCancelDeadline('2026-11-08', '14:20'),
    createdByRole: 'recepcion',
    channel: 'telefono',
    receptionStaffName: 'Carmen Menjívar',
    reminder24hSent: true,
    reminder2hSent: true,
    reminderStatus: 'confirmada',
    auditLogs: [
      {
        timestamp: '2026-11-07T08:30:00Z',
        actor: 'Carmen Menjívar',
        role: 'recepcion',
        action: 'Agendamiento asistido',
        details: 'Paciente llamó por teléfono',
      },
      {
        timestamp: '2026-11-08T14:15:00Z',
        actor: 'Carmen Menjívar',
        role: 'recepcion',
        action: 'Marcar llegada del paciente',
        details: 'Paciente presente en sala de espera del Edificio Anexo',
      },
    ],
    createdAt: '2026-11-07T08:30:00Z',
  },
  // Cita atendida en el pasado para reportes
  {
    id: 'apt-4',
    code: 'MCP-2026-1070',
    patientId: 'pat-2',
    patientName: 'María del Carmen Gómez',
    patientPhone: '7123-4567',
    isForFamilyMember: false,
    serviceId: 'medicina_general',
    serviceName: 'Medicina General',
    professionalId: 'prof-1',
    professionalName: 'Dr. Ricardo Morales',
    date: '2026-11-04',
    time: '10:00',
    durationMinutes: 20,
    building: 'Edificio Principal',
    room: 'Consultorio 101',
    reason: 'Seguimiento por faringoamigdalitis',
    status: 'atendida',
    cancelDeadline: calculateCancelDeadline('2026-11-04', '10:00'),
    createdByRole: 'paciente',
    channel: 'web',
    reminder24hSent: true,
    reminder2hSent: true,
    reminderStatus: 'confirmada',
    auditLogs: [],
    createdAt: '2026-11-01T11:00:00Z',
  },
  // Inasistencia pasada
  {
    id: 'apt-5',
    code: 'MCP-2026-1065',
    patientId: 'pat-2',
    patientName: 'María del Carmen Gómez',
    patientPhone: '7123-4567',
    isForFamilyMember: false,
    serviceId: 'fisioterapia',
    serviceName: 'Fisioterapia y Rehabilitación',
    professionalId: 'prof-3',
    professionalName: 'Lic. Carlos Mendoza',
    date: '2026-10-02',
    time: '11:30',
    durationMinutes: 40,
    building: 'Edificio Principal',
    room: 'Área de Terapia 1',
    reason: 'Tendinitis rotuliana',
    status: 'inasistencia',
    cancelDeadline: calculateCancelDeadline('2026-10-02', '11:30'),
    createdByRole: 'paciente',
    channel: 'web',
    reminder24hSent: true,
    reminder2hSent: true,
    reminderStatus: 'sin_avisar',
    auditLogs: [],
    createdAt: '2026-09-28T09:00:00Z',
  },
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wait-1',
    patientId: 'pat-4',
    patientName: 'Rosa Elizabeth Henríquez',
    patientPhone: '7456-7890',
    serviceId: 'medicina_interna',
    serviceName: 'Medicina Interna',
    preferredProfessionalId: 'prof-2',
    preferredDate: '2026-11-11',
    requestedAt: '2026-11-07T08:15:00Z',
    status: 'esperando',
    notes: 'Solicitó cupo si alguien cancela en la mañana',
  },
];

const STORAGE_KEYS = {
  PATIENTS: 'mcp_patients_v1',
  PROFESSIONALS: 'mcp_professionals_v1',
  APPOINTMENTS: 'mcp_appointments_v1',
  WAITLIST: 'mcp_waitlist_v1',
  NOTIFICATIONS: 'mcp_notifications_v1',
  CURRENT_USER_ID: 'mcp_current_user_id_v1',
  CURRENT_ROLE: 'mcp_current_role_v1',
};

// Storage helper with fallback to initial seed
export class ClinicStorage {
  static initDefaults(force = false) {
    if (force || !localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
      localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(INITIAL_PROFESSIONALS));
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
      localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(INITIAL_WAITLIST));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'pat-1');
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, 'paciente');
    }
  }

  // Patients
  static getPatients(): Patient[] {
    this.initDefaults();
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return data ? JSON.parse(data) : INITIAL_PATIENTS;
  }

  static getPatientById(id: string): Patient | undefined {
    return this.getPatients().find((p) => p.id === id);
  }

  static getPatientByDocument(doc: string): Patient | undefined {
    const cleanDoc = doc.replace(/\D/g, '');
    return this.getPatients().find((p) => p.documentId.replace(/\D/g, '') === cleanDoc);
  }

  static savePatient(patient: Patient): void {
    const list = this.getPatients();
    const index = list.findIndex((p) => p.id === patient.id);
    if (index >= 0) {
      list[index] = patient;
    } else {
      list.push(patient);
    }
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(list));
  }

  // Professionals
  static getProfessionals(): HealthcareProfessional[] {
    this.initDefaults();
    const data = localStorage.getItem(STORAGE_KEYS.PROFESSIONALS);
    return data ? JSON.parse(data) : INITIAL_PROFESSIONALS;
  }

  static getProfessionalById(id: string): HealthcareProfessional | undefined {
    return this.getProfessionals().find((p) => p.id === id);
  }

  static saveProfessional(prof: HealthcareProfessional): void {
    const list = this.getProfessionals();
    const index = list.findIndex((p) => p.id === prof.id);
    if (index >= 0) {
      list[index] = prof;
    } else {
      list.push(prof);
    }
    localStorage.setItem(STORAGE_KEYS.PROFESSIONALS, JSON.stringify(list));
  }

  // Appointments
  static getAppointments(): Appointment[] {
    this.initDefaults();
    const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : INITIAL_APPOINTMENTS;
  }

  static saveAppointment(apt: Appointment): void {
    const list = this.getAppointments();
    const index = list.findIndex((a) => a.id === apt.id);
    if (index >= 0) {
      list[index] = apt;
    } else {
      list.unshift(apt);
    }
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(list));
  }

  // Waitlist
  static getWaitlist(): WaitlistEntry[] {
    this.initDefaults();
    const data = localStorage.getItem(STORAGE_KEYS.WAITLIST);
    return data ? JSON.parse(data) : INITIAL_WAITLIST;
  }

  static saveWaitlistEntry(entry: WaitlistEntry): void {
    const list = this.getWaitlist();
    const index = list.findIndex((w) => w.id === entry.id);
    if (index >= 0) {
      list[index] = entry;
    } else {
      list.push(entry);
    }
    localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(list));
  }

  // Notifications
  static getNotifications(): ReceptionNotification[] {
    this.initDefaults();
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  }

  static addNotification(notif: Omit<ReceptionNotification, 'id' | 'timestamp' | 'read'>): void {
    const list = this.getNotifications();
    const item: ReceptionNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    list.unshift(item);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }

  static markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
  }

  // Reset to original seed
  static resetAll(): void {
    this.initDefaults(true);
  }
}
