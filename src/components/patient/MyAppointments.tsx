import React, { useState } from 'react';
import { Appointment, HealthcareProfessional, Patient } from '../../types';
import { RulesEngine } from '../../services/rulesEngine';
import { ClinicStorage, calculateCancelDeadline } from '../../services/storage';
import { Modal } from '../common/Modal';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Phone,
  MessageSquare,
  Bell,
  Check,
  Building,
} from 'lucide-react';

interface MyAppointmentsProps {
  currentPatient: Patient;
  appointments: Appointment[];
  professionals: HealthcareProfessional[];
  onAppointmentUpdated: () => void;
  onOpenBooking: () => void;
  onOpenReminderModal: (apt: Appointment) => void;
  directAction?: 'cancel' | 'reschedule' | null;
}

export const MyAppointments: React.FC<MyAppointmentsProps> = ({
  currentPatient,
  appointments,
  professionals,
  onAppointmentUpdated,
  onOpenBooking,
  onOpenReminderModal,
  directAction,
}) => {
  // Filter appointments for this patient (including family members)
  const patientAppointments = appointments.filter((a) => a.patientId === currentPatient.id);

  const activeAppointments = patientAppointments.filter(
    (a) => a.status === 'programada' || a.status === 'confirmada' || a.status === 'en_espera' || a.status === 'afectada_bloqueo'
  );

  const pastOrCanceledAppointments = patientAppointments.filter(
    (a) => a.status === 'atendida' || a.status === 'cancelada' || a.status === 'inasistencia' || a.status === 'reprogramada'
  );

  // Modals state
  const [cancelingAppointment, setCancelingAppointment] = useState<Appointment | null>(null);
  const [blockedCancelNotice, setBlockedCancelNotice] = useState<Appointment | null>(null);

  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Auto trigger for Figma navigation P08 (Cancelar) and P09 (Reprogramar)
  React.useEffect(() => {
    if (directAction === 'cancel' && activeAppointments.length > 0) {
      handleInitiateCancel(activeAppointments[0]);
    } else if (directAction === 'reschedule' && activeAppointments.length > 0) {
      handleInitiateReschedule(activeAppointments[0]);
    }
  }, [directAction]);

  // Handle Cancel click (HU-04, RN-03)
  const handleInitiateCancel = (apt: Appointment) => {
    const check = RulesEngine.canPatientCancelOrReschedule(apt);
    if (!check.allowed) {
      setBlockedCancelNotice(apt);
    } else {
      setCancelingAppointment(apt);
    }
  };

  // Confirm cancellation
  const handleConfirmCancel = () => {
    if (!cancelingAppointment) return;

    const updated: Appointment = {
      ...cancelingAppointment,
      status: 'cancelada',
      canceledAt: new Date().toISOString(),
      canceledBy: 'paciente',
      cancelReason: 'Cancelación voluntaria en línea por el paciente',
      auditLogs: [
        ...cancelingAppointment.auditLogs,
        {
          timestamp: new Date().toISOString(),
          actor: currentPatient.fullName,
          role: 'paciente',
          action: 'Cancelación en línea',
          details: `Canceló con más de 24h de anticipación. Cupo liberado el ${cancelingAppointment.date} a las ${cancelingAppointment.time}`,
        },
      ],
    };

    ClinicStorage.saveAppointment(updated);

    // RF-11: Offer liberated cupo to waitlist
    RulesEngine.checkAndOfferWaitlistSlot(cancelingAppointment);

    setCancelingAppointment(null);
    onAppointmentUpdated();
  };

  // Handle Reschedule click (HU-05, RN-03)
  const handleInitiateReschedule = (apt: Appointment) => {
    const check = RulesEngine.canPatientCancelOrReschedule(apt);
    if (!check.allowed) {
      setBlockedCancelNotice(apt);
    } else {
      setReschedulingAppointment(apt);
      // Default to next day
      const d = new Date(apt.date + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      setRescheduleDate(d.toISOString().split('T')[0]);
      setRescheduleTime('');
      setRescheduleError(null);
    }
  };

  // Confirm Reschedule
  const handleConfirmReschedule = () => {
    if (!reschedulingAppointment || !rescheduleDate || !rescheduleTime) {
      setRescheduleError('Por favor selecciona fecha y horario.');
      return;
    }

    const prof = professionals.find((p) => p.id === reschedulingAppointment.professionalId);
    if (!prof) return;

    // Validate slot
    const slotCheck = RulesEngine.validateProfessionalSlotAvailability(
      prof.id,
      rescheduleDate,
      rescheduleTime,
      appointments,
      professionals,
      reschedulingAppointment.id
    );

    if (!slotCheck.allowed) {
      setRescheduleError(slotCheck.message || 'Este horario ya no está disponible');
      return;
    }

    const schedule = RulesEngine.getBuildingAndHoursForDate(rescheduleDate, prof.building);
    const cancelDeadline = calculateCancelDeadline(rescheduleDate, rescheduleTime);

    const updated: Appointment = {
      ...reschedulingAppointment,
      date: rescheduleDate,
      time: rescheduleTime,
      building: schedule.building,
      cancelDeadline,
      status: 'programada',
      reminder24hSent: false,
      reminder2hSent: false,
      reminderStatus: 'pendiente',
      auditLogs: [
        ...reschedulingAppointment.auditLogs,
        {
          timestamp: new Date().toISOString(),
          actor: currentPatient.fullName,
          role: 'paciente',
          action: 'Reprogramación en línea',
          details: `Cita movida del ${reschedulingAppointment.date} ${reschedulingAppointment.time} al ${rescheduleDate} ${rescheduleTime}`,
        },
      ],
    };

    ClinicStorage.saveAppointment(updated);

    // Check waitlist for the old slot that was freed
    RulesEngine.checkAndOfferWaitlistSlot(reschedulingAppointment);

    setReschedulingAppointment(null);
    onAppointmentUpdated();
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmada':
        return <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md font-semibold text-xs">Confirmada</span>;
      case 'programada':
        return <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md font-semibold text-xs">Programada</span>;
      case 'en_espera':
        return <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md font-semibold text-xs">En sala de espera</span>;
      case 'atendida':
        return <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium text-xs">Atendida</span>;
      case 'inasistencia':
        return <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md font-semibold text-xs">Inasistencia</span>;
      case 'cancelada':
        return <span className="text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium text-xs">Cancelada</span>;
      case 'afectada_bloqueo':
        return <span className="text-rose-700 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-md font-bold text-xs animate-pulse">Requiere reprogramación</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md text-xs">{status}</span>;
    }
  };

  const rescheduleProf = reschedulingAppointment
    ? professionals.find((p) => p.id === reschedulingAppointment.professionalId)
    : null;

  const rescheduleSlots = rescheduleProf && rescheduleDate
    ? RulesEngine.getAvailableSlots(rescheduleProf, rescheduleDate, appointments)
    : [];

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mis Citas Médicas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta tus citas activas, cancela o reprograma con al menos 24 horas de antelación.
          </p>
        </div>
        <button
          onClick={onOpenBooking}
          className="self-start sm:self-auto px-4 py-2 bg-[#244A86] hover:bg-[#1B3664] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          + Nueva Cita
        </button>
      </div>

      {/* Active Appointments */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-xs">
          Citas Activas y Próximas ({activeAppointments.length})
        </h3>

        {activeAppointments.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No tienes citas activas</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Puedes reservar una consulta para medicina general, interna, fisioterapia o enfermería.
            </p>
            <button
              onClick={onOpenBooking}
              className="mt-4 px-4 py-2 bg-[#244A86] text-white text-xs font-semibold rounded-xl hover:bg-[#1B3664] transition-colors"
            >
              Agendar mi primera cita
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeAppointments.map((apt) => {
              const cancelCheck = RulesEngine.canPatientCancelOrReschedule(apt);
              return (
                <div
                  key={apt.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all relative ${
                    apt.status === 'afectada_bloqueo'
                      ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top line with code and status */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#244A86]">{apt.code}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-bold text-slate-800">{apt.serviceName}</span>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>

                  {/* Warning banner if affected by doctor date block (HU-20) */}
                  {apt.status === 'afectada_bloqueo' && (
                    <div className="mt-3 p-2.5 bg-rose-100/80 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Aviso urgente de reprogramación:</span>
                        <p className="text-[11px] mt-0.5">
                          El especialista debió bloquear esta fecha por fuerza mayor. Por favor selecciona un nuevo horario o recepción te contactará.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Body details */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900">{apt.date}</span>
                      <span className="text-slate-400">a las</span>
                      <span className="font-semibold text-slate-900">{apt.time}</span>
                      <span className="text-slate-400">({apt.durationMinutes} min)</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{apt.professionalName} · <span className="text-slate-500">{apt.room}</span></span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Building className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-[#244A86]">{apt.building}</span>
                    </div>

                    {apt.isForFamilyMember && (
                      <div className="p-2 bg-amber-50 rounded-lg border border-amber-200/60 text-[11px] text-amber-900">
                        <span className="font-semibold">Beneficiario: </span>
                        {apt.familyMemberName} ({apt.familyMemberRelationship})
                      </div>
                    )}

                    {/* Motivo de consulta */}
                    <div className="pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">Motivo:</span>
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg mt-0.5 border border-slate-100">
                        "{apt.reason}"
                      </p>
                    </div>

                    {/* Deadline notice (HU-16) */}
                    <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                      <span>Plazo cancelación online:</span>
                      <span className={cancelCheck.allowed ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                        {cancelCheck.allowed ? 'Disponible (> 24 h)' : 'Vencido (< 24 h)'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenReminderModal(apt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#244A86] hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                      title="Ver recordatorio simulado enviado por WhatsApp o SMS"
                    >
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ver Recordatorio</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleInitiateReschedule(apt)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reprogramar</span>
                      </button>

                      <button
                        onClick={() => handleInitiateCancel(apt)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past / Canceled History */}
      {pastOrCanceledAppointments.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Historial de Citas Pasadas ({pastOrCanceledAppointments.length})
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
            {pastOrCanceledAppointments.map((apt) => (
              <div key={apt.id} className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="font-mono font-bold text-slate-600">{apt.code}</div>
                  <div>
                    <span className="font-semibold text-slate-800">{apt.serviceName}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="text-slate-600">{apt.date} a las {apt.time}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="text-slate-500">{apt.professionalName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {getStatusBadge(apt.status)}
                  {apt.status === 'inasistencia' && (
                    <span className="text-[11px] text-rose-600 font-medium">(No se presentó)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Confirm Cancellation (P08 Cancelar / HU-04, RN-03) */}
      <Modal
        isOpen={!!cancelingAppointment}
        onClose={() => setCancelingAppointment(null)}
        title="Cancelar Cita Médica"
        subtitle="Liberación solidaria de cupo médico para lista de espera"
        maxWidth="md"
      >
        {cancelingAppointment && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 text-sm">
              ¿Estás seguro de que deseas cancelar tu cita para <strong>{cancelingAppointment.serviceName}</strong> el <strong>{cancelingAppointment.date} a las {cancelingAppointment.time}</strong>?
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
              <span className="font-bold">Liberación solidaria de cupo:</span>
              <p className="mt-0.5">
                Al cancelar, este cupo se liberará de inmediato y se ofrecerá automáticamente al siguiente paciente en lista de espera parroquial.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelingAppointment(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
              >
                Mantener cita
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-xs"
              >
                Sí, cancelar cita
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Blocked Cancellation (< 24h) Notice (HU-04, RN-03) */}
      <Modal
        isOpen={!!blockedCancelNotice}
        onClose={() => setBlockedCancelNotice(null)}
        title="Plazo de Cancelación en Línea Expirado"
        maxWidth="md"
      >
        {blockedCancelNotice && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Faltan menos de 24 h. Comunícate con recepción
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Por política de la clínica parroquial, las cancelaciones o reprogramaciones a menos de 24 horas de la cita deben coordinarse directamente con recepción para reprogramar al especialista y evitar tiempos muertos.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-left text-xs space-y-1.5">
              <p className="font-semibold text-slate-800">Canales de atención directa:</p>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-[#244A86]" />
                <span>Teléfono recepción: <strong>(503) 2257-8900</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp parroquial: <strong>(503) 7845-1234</strong></span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <a
                href="tel:22578900"
                className="flex-1 py-2.5 px-4 bg-[#244A86] text-white rounded-xl text-xs font-semibold hover:bg-[#1B3664] text-center"
              >
                Llamar a Recepción
              </a>
              <button
                type="button"
                onClick={() => setBlockedCancelNotice(null)}
                className="py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Reschedule Appointment (P09 Reprogramar / HU-05) */}
      <Modal
        isOpen={!!reschedulingAppointment}
        onClose={() => setReschedulingAppointment(null)}
        title="Reprogramar Cita Médica"
        subtitle={reschedulingAppointment ? `${reschedulingAppointment.serviceName} · ${reschedulingAppointment.professionalName} · Selección de nuevo horario` : ''}
        maxWidth="md"
      >
        {reschedulingAppointment && rescheduleProf && (
          <div className="space-y-4 text-xs">
            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl">
                {rescheduleError}
              </div>
            )}

            <div>
              <label htmlFor="reschedule-date-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Nueva fecha de consulta
              </label>
              <input
                id="reschedule-date-input"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  setRescheduleTime('');
                  setRescheduleError(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#244A86]"
              />
            </div>

            {rescheduleDate && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Selecciona nuevo horario libre
                </label>
                {rescheduleSlots.length === 0 ? (
                  <p className="text-slate-500 italic p-3 bg-slate-50 rounded-xl text-center">
                    No hay horarios libres en esta fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                    {rescheduleSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setRescheduleTime(slot.time)}
                        className={`py-2 px-2.5 rounded-lg border text-center font-semibold text-xs ${
                          !slot.available
                            ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                            : rescheduleTime === slot.time
                            ? 'bg-[#244A86] text-white border-[#244A86] ring-1 ring-blue-300'
                            : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReschedulingAppointment(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Descartar
              </button>
              <button
                type="button"
                disabled={!rescheduleTime}
                onClick={handleConfirmReschedule}
                className={`px-5 py-2.5 rounded-xl font-bold text-white transition-colors ${
                  rescheduleTime
                    ? 'bg-[#244A86] hover:bg-[#1B3664]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Confirmar Reprogramación
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
