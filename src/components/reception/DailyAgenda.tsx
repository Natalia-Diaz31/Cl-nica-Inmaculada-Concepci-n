import React, { useState } from 'react';
import { Appointment, HealthcareProfessional, Patient } from '../../types';
import { RulesEngine } from '../../services/rulesEngine';
import { ClinicStorage } from '../../services/storage';
import { Modal } from '../common/Modal';
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  UserX,
  MapPin,
  Building,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Phone,
  MessageSquare,
  Search,
  Filter,
} from 'lucide-react';

interface DailyAgendaProps {
  appointments: Appointment[];
  professionals: HealthcareProfessional[];
  patients: Patient[];
  onDataUpdated: () => void;
  onOpenAssistedBooking: () => void;
}

export const DailyAgenda: React.FC<DailyAgendaProps> = ({
  appointments,
  professionals,
  patients,
  onDataUpdated,
  onOpenAssistedBooking,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Current simulated date or tomorrow
    return new Date().toISOString().split('T')[0];
  });
  const [selectedProfId, setSelectedProfId] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Attendance confirmation modal (HU-07)
  const [confirmAttendanceApt, setConfirmAttendanceApt] = useState<Appointment | null>(null);
  const [confirmNoShowApt, setConfirmNoShowApt] = useState<Appointment | null>(null);

  // Cancellation by reception modal
  const [receptionCancelApt, setReceptionCancelApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Sábado check (RN-07)
  const scheduleInfo = RulesEngine.getBuildingAndHoursForDate(selectedDate, 'Edificio Principal');

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (apt.date !== selectedDate) return false;
    if (selectedProfId !== 'all' && apt.professionalId !== selectedProfId) return false;
    if (selectedBuilding !== 'all' && apt.building !== selectedBuilding) return false;
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false;
    return true;
  });

  // Sort by time
  const sortedAppointments = [...filteredAppointments].sort((a, b) => a.time.localeCompare(b.time));

  // Handle Mark "Llegó" (HU-07 Escenario 1)
  const handleMarkArrived = (apt: Appointment) => {
    const updated: Appointment = {
      ...apt,
      status: 'en_espera',
      auditLogs: [
        ...apt.auditLogs,
        {
          timestamp: new Date().toISOString(),
          actor: 'Carmen Menjívar (Recepción)',
          role: 'recepcion',
          action: 'Llegada registrada',
          details: 'Paciente presente en la clínica. Pasó a sala de espera.',
        },
      ],
    };

    ClinicStorage.saveAppointment(updated);
    setConfirmAttendanceApt(null);
    onDataUpdated();
  };

  // Handle Mark "No llegó" (HU-07 Escenario 2 & 3)
  const handleMarkNoShow = (apt: Appointment) => {
    const patient = patients.find((p) => p.id === apt.patientId);

    // Update appointment status to 'inasistencia'
    const updatedApt: Appointment = {
      ...apt,
      status: 'inasistencia',
      auditLogs: [
        ...apt.auditLogs,
        {
          timestamp: new Date().toISOString(),
          actor: 'Carmen Menjívar (Recepción)',
          role: 'recepcion',
          action: 'Inasistencia marcada',
          details: 'Pasaron 15 minutos sin presentación del paciente. Registrada inasistencia.',
        },
      ],
    };

    ClinicStorage.saveAppointment(updatedApt);

    // Register absence in patient's profile
    if (patient) {
      const newAbsenceHistory = [
        ...patient.absenceHistory,
        {
          id: `abs-${Date.now()}`,
          date: apt.date,
          appointmentId: apt.code,
          serviceName: apt.serviceName,
          markedAt: new Date().toISOString(),
          markedBy: 'Carmen Menjívar (Recepción)',
        },
      ];

      const newAbsencesCount = patient.unexcusedAbsencesCount + 1;
      let shouldSuspend = patient.isSuspended;
      let suspensionReason = patient.suspensionReason;

      // RN-04: If 3 or more absences in last 6 months -> suspend online booking!
      if (newAbsencesCount >= 3 && !patient.isSuspended) {
        shouldSuspend = true;
        suspensionReason = `Agendamiento suspendido automáticamente tras 3 inasistencias acumuladas (${newAbsenceHistory
          .slice(-3)
          .map((a) => a.date)
          .join(', ')}).`;

        ClinicStorage.addNotification({
          type: 'suspension',
          title: `Suspensión automática: ${patient.fullName}`,
          message: `El paciente ${patient.fullName} (DUI: ${patient.documentId}) ha acumulado 3 inasistencias y sus reservas en línea han sido bloqueadas.`,
          patientName: patient.fullName,
          patientPhone: patient.phone,
          actionRequired: true,
        });
      }

      const updatedPatient: Patient = {
        ...patient,
        unexcusedAbsencesCount: newAbsencesCount,
        absenceHistory: newAbsenceHistory,
        isSuspended: shouldSuspend,
        suspensionReason,
        suspensionDate: shouldSuspend ? new Date().toISOString() : undefined,
      };

      ClinicStorage.savePatient(updatedPatient);
    }

    setConfirmNoShowApt(null);
    onDataUpdated();
  };

  // Handle Cancellation by Reception
  const handleReceptionCancel = () => {
    if (!receptionCancelApt) return;

    const updated: Appointment = {
      ...receptionCancelApt,
      status: 'cancelada',
      canceledAt: new Date().toISOString(),
      canceledBy: 'recepcion',
      cancelReason: cancelReason.trim() || 'Cancelación gestionada en ventanilla de recepción',
      auditLogs: [
        ...receptionCancelApt.auditLogs,
        {
          timestamp: new Date().toISOString(),
          actor: 'Carmen Menjívar (Recepción)',
          role: 'recepcion',
          action: 'Cancelación por recepción',
          details: cancelReason.trim() || 'Cancelado por personal de recepción',
        },
      ],
    };

    ClinicStorage.saveAppointment(updated);
    RulesEngine.checkAndOfferWaitlistSlot(receptionCancelApt);

    setReceptionCancelApt(null);
    setCancelReason('');
    onDataUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Agenda Central de Recepción</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de asistencia, llegadas, inasistencias y visualización unificada de cupos.
          </p>
        </div>
        <button
          onClick={onOpenAssistedBooking}
          className="self-start sm:self-auto px-4 py-2 bg-[#244A86] hover:bg-[#1B3664] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <UserCheck className="w-4 h-4 text-blue-200" />
          <span>+ Agendar por Teléfono/WhatsApp</span>
        </button>
      </div>

      {/* Saturday & Building Banner (RN-07) */}
      <div className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
        scheduleInfo.isSaturday ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-[#244A86] shrink-0" />
          <span className="font-bold text-slate-900">{scheduleInfo.building}:</span>
          <span>{scheduleInfo.note}</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Fecha seleccionada: {selectedDate}
        </span>
      </div>

      {/* Filter Bar (HU-12) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Profesional</label>
          <select
            value={selectedProfId}
            onChange={(e) => setSelectedProfId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
          >
            <option value="all">Todos los profesionales</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.serviceName})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Edificio</label>
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
          >
            <option value="all">Todos los edificios</option>
            <option value="Edificio Principal">Edificio Principal</option>
            <option value="Edificio Anexo">Edificio Anexo</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Estado de Cita</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
          >
            <option value="all">Todos los estados</option>
            <option value="programada">Programada</option>
            <option value="confirmada">Confirmada</option>
            <option value="en_espera">En Sala de Espera</option>
            <option value="atendida">Atendida</option>
            <option value="inasistencia">Inasistencia (No llegó)</option>
            <option value="cancelada">Cancelada</option>
            <option value="afectada_bloqueo">Afectada por Bloqueo</option>
          </select>
        </div>
      </div>

      {/* Appointments List for the Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Citas Programadas para {selectedDate} ({sortedAppointments.length})
          </h3>
          <span className="text-xs text-slate-500">
            Regla de llegada: Marcar "No llegó" tras 15 min de tolerancia
          </span>
        </div>

        {sortedAppointments.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No hay citas con los filtros seleccionados</h4>
            <p className="text-xs text-slate-500 mt-1">
              Puedes cambiar los filtros o crear una nueva cita asistida.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {sortedAppointments.map((apt) => {
              const patient = patients.find((p) => p.id === apt.patientId);
              return (
                <div
                  key={apt.id}
                  className={`p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                    apt.status === 'en_espera' ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Left Column: Time and Patient Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 text-center shrink-0">
                      <span className="font-mono text-sm font-extrabold text-[#244A86] block">
                        {apt.time}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{apt.durationMinutes} min</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                        {apt.isForFamilyMember && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                            Para: {apt.familyMemberName} ({apt.familyMemberRelationship})
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-slate-500">DUI: {patient?.documentId}</span>
                        <span className="text-[11px] text-slate-500">Tel: {apt.patientPhone}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 flex-wrap">
                        <span className="font-semibold text-slate-800">{apt.serviceName}</span>
                        <span>·</span>
                        <span>{apt.professionalName}</span>
                        <span>·</span>
                        <span className="text-[#244A86]">{apt.building} ({apt.room})</span>
                        <span>·</span>
                        <span className="text-[11px] text-slate-400 capitalize">Canal: {apt.channel}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 italic">
                        "{apt.reason}"
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Status & Operational Buttons (HU-07) */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-auto shrink-0">
                    {/* Status Badge */}
                    <div className="mr-1">
                      {apt.status === 'en_espera' && (
                        <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          En Espera
                        </span>
                      )}
                      {apt.status === 'confirmada' && (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold">
                          Confirmada
                        </span>
                      )}
                      {apt.status === 'programada' && (
                        <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-semibold">
                          Programada
                        </span>
                      )}
                      {apt.status === 'atendida' && (
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                          Atendida
                        </span>
                      )}
                      {apt.status === 'inasistencia' && (
                        <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg font-bold">
                          Inasistencia
                        </span>
                      )}
                      {apt.status === 'cancelada' && (
                        <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">
                          Cancelada
                        </span>
                      )}
                      {apt.status === 'afectada_bloqueo' && (
                        <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg font-bold">
                          Bloqueo
                        </span>
                      )}
                    </div>

                    {/* Operational Buttons */}
                    {(apt.status === 'programada' || apt.status === 'confirmada') && (
                      <>
                        <button
                          onClick={() => handleMarkArrived(apt)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                          title="Registrar que el paciente se presentó en la clínica"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Llegó</span>
                        </button>

                        <button
                          onClick={() => setConfirmNoShowApt(apt)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl transition-colors flex items-center gap-1 border border-rose-200"
                          title="Marcar inasistencia (tras 15 min de tolerancia)"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>No llegó</span>
                        </button>
                      </>
                    )}

                    {apt.status !== 'cancelada' && apt.status !== 'atendida' && (
                      <button
                        onClick={() => setReceptionCancelApt(apt)}
                        className="px-2 py-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Cancelar cita en recepción"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for No-Show (HU-07) */}
      <Modal
        isOpen={!!confirmNoShowApt}
        onClose={() => setConfirmNoShowApt(null)}
        title="Registrar Inasistencia"
        maxWidth="md"
      >
        {confirmNoShowApt && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-700 text-sm">
              ¿Confirmas registrar inasistencia para <strong>{confirmNoShowApt.patientName}</strong> en su cita de las <strong>{confirmNoShowApt.time}</strong>?
            </p>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Política de 3 inasistencias en 6 meses:
              </span>
              <p>
                Esta falta se sumará al historial del paciente. Al acumular 3 inasistencias en 6 meses, su agendamiento en línea quedará suspendido automáticamente.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmNoShowApt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleMarkNoShow(confirmNoShowApt)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-xs"
              >
                Confirmar Inasistencia
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reception Cancellation Modal */}
      <Modal
        isOpen={!!receptionCancelApt}
        onClose={() => setReceptionCancelApt(null)}
        title="Cancelar Cita desde Recepción"
        maxWidth="md"
      >
        {receptionCancelApt && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-700">
              Estás cancelando la cita de <strong>{receptionCancelApt.patientName}</strong> ({receptionCancelApt.serviceName} el {receptionCancelApt.date} {receptionCancelApt.time}).
            </p>

            <div>
              <label htmlFor="reception-cancel-reason" className="block font-semibold text-slate-700 mb-1">
                Motivo de cancelación / llamada del paciente:
              </label>
              <input
                id="reception-cancel-reason"
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej: Paciente llamó indicando emergencia laboral"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
              Al confirmar, el horario quedará inmediatamente libre y se ofrecerá a la lista de espera por antigüedad.
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceptionCancelApt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleReceptionCancel}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                Confirmar y Liberar Cupo
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
