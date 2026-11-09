export type Role = 'paciente' | 'recepcion' | 'profesional' | 'admin';

export type ServiceCategory = 'medicina_general' | 'medicina_interna' | 'fisioterapia' | 'enfermeria';

export type FigmaScreenId =
  | 'P01' // Inicio
  | 'P02' // Registro
  | 'P03' // Servicios
  | 'P04' // Calendario
  | 'P05' // Confirmar
  | 'P06' // Confirmación
  | 'P07' // Mis citas
  | 'P08' // Cancelar
  | 'P09' // Reprogramar
  | 'P10' // Agenda recepción
  | 'P11' // Agendar por paciente
  | 'P12' // Mi horario
  | 'P13' // Bloquear fechas
  | 'P14' // Citas profesional
  | 'P15' // Notificaciones
  | 'P16' // Lista de espera
  | 'P17'; // Reportes

export interface FigmaScreenMeta {
  id: FigmaScreenId;
  name: string;
  role: Role;
  description: string;
  userStory: string;
}

export const FIGMA_SCREENS: FigmaScreenMeta[] = [
  { id: 'P01', name: 'Inicio', role: 'paciente', description: 'Bienvenida, presentación de la clínica y accesos directos', userStory: 'HU-01 / General' },
  { id: 'P02', name: 'Registro', role: 'paciente', description: 'Registro breve con nombre, DUI, teléfono y correo opcional', userStory: 'HU-01 / HU-15' },
  { id: 'P03', name: 'Servicios', role: 'paciente', description: 'Selección de especialidad y destinatario (personal o familiar)', userStory: 'HU-02 / HU-19' },
  { id: 'P04', name: 'Calendario', role: 'paciente', description: 'Disponibilidad de cupos por profesional, fecha y edificio', userStory: 'HU-02 / RN-05 / RN-07' },
  { id: 'P05', name: 'Confirmar', role: 'paciente', description: 'Revisión de datos, motivo de consulta y plazo visible de cancelación', userStory: 'HU-03 / HU-16' },
  { id: 'P06', name: 'Confirmación', role: 'paciente', description: 'Comprobante oficial de cita, código de reserva y descarga', userStory: 'HU-03 / Confirmación' },
  { id: 'P07', name: 'Mis Citas', role: 'paciente', description: 'Historial de citas activas y pasadas del paciente y familiares', userStory: 'HU-03 / HU-04' },
  { id: 'P08', name: 'Cancelar', role: 'paciente', description: 'Validación de plazo de 24 horas y liberación solidaria de cupo', userStory: 'HU-04 / RN-03' },
  { id: 'P09', name: 'Reprogramar', role: 'paciente', description: 'Elección de nuevo horario libre antes del límite de 24 horas', userStory: 'HU-05 / RN-03' },
  { id: 'P10', name: 'Agenda Recepción', role: 'recepcion', description: 'Agenda diaria unificada con marcado de llegada e inasistencias', userStory: 'HU-07 / HU-12' },
  { id: 'P11', name: 'Agendar por Paciente', role: 'recepcion', description: 'Reserva asistida por teléfono, WhatsApp o presencial con canal', userStory: 'HU-06 / RF-05' },
  { id: 'P12', name: 'Mi Horario', role: 'profesional', description: 'Configuración de días, horas, duración de turnos y edificio', userStory: 'HU-13 / RN-07' },
  { id: 'P13', name: 'Bloquear Fechas', role: 'profesional', description: 'Bloqueo médico con advertencia y traslado a reprogramación', userStory: 'HU-08 / RN-06' },
  { id: 'P14', name: 'Citas Profesional', role: 'profesional', description: 'Cola diaria privada de pacientes en espera con motivo clínico', userStory: 'HU-09 / RNF-03' },
  { id: 'P15', name: 'Notificaciones', role: 'paciente', description: 'Simulador de recordatorios de 24h y 2h con confirmación activa', userStory: 'HU-10 / HU-17' },
  { id: 'P16', name: 'Lista de Espera', role: 'paciente', description: 'Gestión por antigüedad y aceptación interactiva de cupos liberados', userStory: 'HU-11 / RF-11' },
  { id: 'P17', name: 'Reportes', role: 'admin', description: 'Métricas de ocupación, inasistencias y exportación a PDF y CSV', userStory: 'HU-14 / RF-12' },
];

export interface ClinicService {
  id: ServiceCategory;
  name: string;
  description: string;
  estimatedDurationMinutes: number;
  iconName: string;
  color: string;
  defaultBuilding: 'Edificio Principal' | 'Edificio Anexo';
  imageUrl?: string;
}

export interface HealthcareProfessional {
  id: string;
  name: string;
  title: string;
  serviceId: ServiceCategory;
  serviceName: string;
  email: string;
  room: string;
  avatarUrl: string;
  workingDays: number[]; // 0=Sunday, 1=Monday... 6=Saturday
  startHour: string; // '08:00'
  endHour: string; // '17:00'
  slotDurationMinutes: number;
  building: 'Edificio Principal' | 'Edificio Anexo';
  blockedDates: BlockedDate[];
}

export interface BlockedDate {
  id: string;
  date: string; // YYYY-MM-DD
  reason: string;
  affectedAppointmentsCount: number;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  fullName: string;
  relationship: 'Hijo/a' | 'Madre' | 'Padre' | 'Cónyuge' | 'Abuelo/a' | 'Otro familiar';
  documentId?: string;
  birthDate?: string;
  notes?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  documentId: string; // DUI or equivalent (e.g., 04589213-4)
  phone: string; // 8 digits in El Salvador
  email?: string;
  isSuspended: boolean;
  suspensionReason?: string;
  suspensionDate?: string;
  unexcusedAbsencesCount: number;
  absenceHistory: Array<{
    id: string;
    date: string;
    appointmentId: string;
    serviceName: string;
    markedAt: string;
    markedBy: string;
  }>;
  familyMembers: FamilyMember[];
  createdAt: string;
}

export type AppointmentStatus =
  | 'programada'
  | 'confirmada'
  | 'en_espera'
  | 'atendida'
  | 'inasistencia'
  | 'cancelada'
  | 'reprogramada'
  | 'afectada_bloqueo';

export type BookingChannel = 'web' | 'telefono' | 'whatsapp' | 'presencial';

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  role: Role;
  action: string;
  details: string;
}

export interface Appointment {
  id: string;
  code: string; // e.g. MCP-2026-1042
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  isForFamilyMember: boolean;
  familyMemberName?: string;
  familyMemberRelationship?: string;
  serviceId: ServiceCategory;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  durationMinutes: number;
  building: 'Edificio Principal' | 'Edificio Anexo';
  room: string;
  reason: string; // Motivo breve de consulta (confidencial)
  status: AppointmentStatus;
  cancelDeadline: string; // ISO string 24h prior to appointment
  createdByRole: Role;
  channel: BookingChannel;
  receptionStaffName?: string;
  canceledAt?: string;
  cancelReason?: string;
  canceledBy?: 'paciente' | 'recepcion' | 'sistema';
  reminder24hSent: boolean;
  reminder2hSent: boolean;
  reminderStatus: 'pendiente' | 'confirmada' | 'rechazada' | 'sin_avisar';
  auditLogs: AuditLogEntry[];
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  serviceId: ServiceCategory;
  serviceName: string;
  preferredProfessionalId?: string;
  preferredDate?: string;
  notes?: string;
  requestedAt: string; // Antiquity timestamp
  status: 'esperando' | 'cupo_ofrecido' | 'aceptado' | 'expirado' | 'cancelado';
  offeredSlot?: {
    date: string;
    time: string;
    professionalId: string;
    professionalName: string;
    building: string;
    expiresAt: string; // Timestamp
  };
}

export interface ReceptionNotification {
  id: string;
  type: 'suspension' | 'bloqueo' | 'recordatorio_fallido' | 'cupo_liberado';
  title: string;
  message: string;
  patientName?: string;
  patientPhone?: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
}
