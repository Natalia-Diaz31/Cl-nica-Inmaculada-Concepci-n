import { Appointment, HealthcareProfessional, Patient, ServiceCategory } from '../types';
import { ClinicStorage } from './storage';

export interface ValidationResult {
  allowed: boolean;
  message?: string;
  code?: 'DUPLICATE_TIME' | 'ACTIVE_LIMIT' | 'OUT_OF_RANGE' | 'WITHIN_24H' | 'SUSPENDED' | 'INVALID_HOURS' | 'OK';
  nearestSlots?: string[];
}

export class RulesEngine {
  // Reference date: current system time
  static getNow(): Date {
    // Current simulated date from context: Nov 8, 2026
    return new Date();
  }

  // RN-05: Anticipación para agendar citas (mínimo 2 horas, máximo 60 días)
  static validateAnticipation(dateStr: string, timeStr: string): ValidationResult {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const targetDate = new Date(year, month - 1, day, hours, minutes);
    const now = this.getNow();

    const diffMs = targetDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 2) {
      return {
        allowed: false,
        code: 'OUT_OF_RANGE',
        message: 'Las citas deben reservarse con al menos 2 horas de anticipación.',
      };
    }

    if (diffDays > 60) {
      return {
        allowed: false,
        code: 'OUT_OF_RANGE',
        message: 'No es posible agendar con más de 60 días de anticipación.',
      };
    }

    return { allowed: true, code: 'OK' };
  }

  // RN-04: Verificación de suspensión por inasistencias (3 inasistencias en 6 meses)
  static isPatientSuspended(patient: Patient): ValidationResult {
    if (patient.isSuspended) {
      return {
        allowed: false,
        code: 'SUSPENDED',
        message: 'Tu agendamiento en línea está suspendido por inasistencias reiteradas. Comunícate con recepción al 2257-8900 o por WhatsApp.',
      };
    }

    // Check last 6 months absences
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentAbsences = patient.absenceHistory.filter((abs) => {
      const d = new Date(abs.date);
      return d >= sixMonthsAgo;
    });

    if (recentAbsences.length >= 3) {
      return {
        allowed: false,
        code: 'SUSPENDED',
        message: 'Tu agendamiento en línea está suspendido. Registras 3 inasistencias en los últimos 6 meses. Comunícate con recepción.',
      };
    }

    return { allowed: true, code: 'OK' };
  }

  // RN-02: Límite de citas activas por servicio (máximo 1 cita activa por servicio)
  static validateSingleActivePerService(
    patientId: string,
    serviceId: ServiceCategory,
    appointments: Appointment[],
    excludeAppointmentId?: string
  ): ValidationResult {
    const activeStatuses: Appointment['status'][] = ['programada', 'confirmada', 'en_espera'];

    const existingActive = appointments.find((apt) => {
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      return apt.patientId === patientId && apt.serviceId === serviceId && activeStatuses.includes(apt.status);
    });

    if (existingActive) {
      return {
        allowed: false,
        code: 'ACTIVE_LIMIT',
        message: `Ya tienes una cita activa de este servicio para el ${existingActive.date} a las ${existingActive.time}. Puedes reprogramarla o cancelarla desde "Mis citas".`,
      };
    }

    return { allowed: true, code: 'OK' };
  }

  // RN-01: Prevención de citas duplicadas (un profesional no puede tener dos citas al mismo tiempo)
  static validateProfessionalSlotAvailability(
    professionalId: string,
    dateStr: string,
    timeStr: string,
    appointments: Appointment[],
    professionals: HealthcareProfessional[],
    excludeAppointmentId?: string
  ): ValidationResult {
    const prof = professionals.find((p) => p.id === professionalId);
    if (!prof) {
      return { allowed: false, message: 'Profesional no encontrado' };
    }

    // Check if professional blocked this date (RN-06)
    const isBlocked = prof.blockedDates.some((b) => b.date === dateStr);
    if (isBlocked) {
      return {
        allowed: false,
        code: 'DUPLICATE_TIME',
        message: `La fecha ${dateStr} se encuentra bloqueada por el profesional por razones médicas/administrativas.`,
      };
    }

    // Check existing overlapping appointment
    const occupied = appointments.find((apt) => {
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      const isNotCanceled = apt.status !== 'cancelada' && apt.status !== 'reprogramada';
      return apt.professionalId === professionalId && apt.date === dateStr && apt.time === timeStr && isNotCanceled;
    });

    if (occupied) {
      // Generate 3 nearest alternatives
      const alternatives = this.getNearestAlternativeSlots(prof, dateStr, timeStr, appointments);
      return {
        allowed: false,
        code: 'DUPLICATE_TIME',
        message: 'Este horario ya no está disponible.',
        nearestSlots: alternatives,
      };
    }

    return { allowed: true, code: 'OK' };
  }

  // RN-03: Plazo de cancelación y reprogramación (hasta 24h antes por el paciente)
  static canPatientCancelOrReschedule(apt: Appointment): ValidationResult {
    const [year, month, day] = apt.date.split('-').map(Number);
    const [hour, min] = apt.time.split(':').map(Number);
    const appointmentDate = new Date(year, month - 1, day, hour, min);
    const now = this.getNow();

    const diffMs = appointmentDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return {
        allowed: false,
        code: 'WITHIN_24H',
        message: 'Faltan menos de 24 h. Comunícate con recepción para coordinar cambios.',
      };
    }

    return { allowed: true, code: 'OK' };
  }

  // RN-07: Reglas para días sábados
  static getBuildingAndHoursForDate(
    dateStr: string,
    defaultBuilding: 'Edificio Principal' | 'Edificio Anexo'
  ): {
    building: 'Edificio Principal' | 'Edificio Anexo';
    isSaturday: boolean;
    startHour: string;
    endHour: string;
    note: string;
  } {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay(); // 6 = Saturday

    if (dayOfWeek === 6) {
      return {
        building: 'Edificio Anexo',
        isSaturday: true,
        startHour: '12:00',
        endHour: '17:00',
        note: 'Sábado: Atención exclusiva en Edificio Anexo de 12:00 p. m. a 5:00 p. m.',
      };
    }

    return {
      building: defaultBuilding,
      isSaturday: false,
      startHour: '08:00',
      endHour: '17:00',
      note: 'Lunes a Viernes: Edificio Principal',
    };
  }

  // Generate available slots for a professional on a given date
  static getAvailableSlots(
    prof: HealthcareProfessional,
    dateStr: string,
    appointments: Appointment[]
  ): Array<{ time: string; available: boolean; building: 'Edificio Principal' | 'Edificio Anexo' }> {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();

    // Check if professional works on this day
    if (!prof.workingDays.includes(dayOfWeek)) {
      return [];
    }

    // Check if date is blocked
    if (prof.blockedDates.some((b) => b.date === dateStr)) {
      return [];
    }

    const schedule = this.getBuildingAndHoursForDate(dateStr, prof.building);
    const [startH, startM] = (schedule.isSaturday ? '12:00' : prof.startHour).split(':').map(Number);
    const [endH, endM] = (schedule.isSaturday ? '17:00' : prof.endHour).split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const step = prof.slotDurationMinutes || 20;

    const slots: Array<{ time: string; available: boolean; building: 'Edificio Principal' | 'Edificio Anexo' }> = [];

    const bookedTimes = appointments
      .filter((a) => a.professionalId === prof.id && a.date === dateStr && a.status !== 'cancelada' && a.status !== 'reprogramada')
      .map((a) => a.time);

    for (let current = startMinutes; current + step <= endMinutes; current += step) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Check if slot is at least 2 hours from now if date is today
      const anticipationCheck = this.validateAnticipation(dateStr, timeStr);
      const isPastOrTooSoon = !anticipationCheck.allowed && anticipationCheck.code === 'OUT_OF_RANGE' && d.toDateString() === this.getNow().toDateString();

      const isBooked = bookedTimes.includes(timeStr);

      slots.push({
        time: timeStr,
        available: !isBooked && !isPastOrTooSoon,
        building: schedule.building,
      });
    }

    return slots;
  }

  // Helper to find 3 nearest alternatives when a slot is occupied
  private static getNearestAlternativeSlots(
    prof: HealthcareProfessional,
    dateStr: string,
    targetTime: string,
    appointments: Appointment[]
  ): string[] {
    const allSlots = this.getAvailableSlots(prof, dateStr, appointments);
    const available = allSlots.filter((s) => s.available);

    if (available.length <= 3) {
      return available.map((s) => `${s.time} (${s.building})`);
    }

    const [targetH, targetM] = targetTime.split(':').map(Number);
    const targetMin = targetH * 60 + targetM;

    const sorted = [...available].sort((a, b) => {
      const [ah, am] = a.time.split(':').map(Number);
      const [bh, bm] = b.time.split(':').map(Number);
      return Math.abs(ah * 60 + am - targetMin) - Math.abs(bh * 60 + bm - targetMin);
    });

    return sorted.slice(0, 3).map((s) => `${s.time} (${s.building})`);
  }

  // RF-11: Manejo de lista de espera al liberarse un cupo
  static checkAndOfferWaitlistSlot(freedApt: Appointment): {
    offered: boolean;
    waitlistEntryId?: string;
    patientName?: string;
  } {
    const waitlist = ClinicStorage.getWaitlist();
    // Sort by oldest request date (antigüedad)
    const pending = waitlist
      .filter((w) => w.status === 'esperando' && w.serviceId === freedApt.serviceId)
      .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());

    if (pending.length === 0) {
      return { offered: false };
    }

    const oldest = pending[0];
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins window for simulation

    oldest.status = 'cupo_ofrecido';
    oldest.offeredSlot = {
      date: freedApt.date,
      time: freedApt.time,
      professionalId: freedApt.professionalId,
      professionalName: freedApt.professionalName,
      building: freedApt.building,
      expiresAt,
    };

    ClinicStorage.saveWaitlistEntry(oldest);

    ClinicStorage.addNotification({
      type: 'cupo_liberado',
      title: 'Cupo liberado ofrecido a lista de espera',
      message: `Se notificó a ${oldest.patientName} (${oldest.patientPhone}) para el cupo de ${freedApt.serviceName} el ${freedApt.date} a las ${freedApt.time}.`,
      patientName: oldest.patientName,
      patientPhone: oldest.patientPhone,
      actionRequired: false,
    });

    return {
      offered: true,
      waitlistEntryId: oldest.id,
      patientName: oldest.patientName,
    };
  }
}
