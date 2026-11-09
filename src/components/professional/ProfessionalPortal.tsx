import React, { useState } from 'react';
import { Appointment, BlockedDate, HealthcareProfessional, Patient } from '../../types';
import { ClinicStorage } from '../../services/storage';
import { RulesEngine } from '../../services/rulesEngine';
import { Modal } from '../common/Modal';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldAlert,
  Save,
  Building,
  UserCheck,
  Check,
} from 'lucide-react';

interface ProfessionalPortalProps {
  currentProfessional: HealthcareProfessional;
  appointments: Appointment[];
  patients: Patient[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDataUpdated: () => void;
  professionals: HealthcareProfessional[];
  onProfessionalChange: (profId: string) => void;
}

export const ProfessionalPortal: React.FC<ProfessionalPortalProps> = ({
  currentProfessional,
  appointments,
  patients,
  activeTab,
  onTabChange,
  onDataUpdated,
  professionals,
  onProfessionalChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Doctor's only appointments (RNF-03: Privacy guarantee)
  const myAppointments = appointments.filter(
    (a) => a.professionalId === currentProfessional.id && a.date === selectedDate
  );
  const sortedMyAppointments = [...myAppointments].sort((a, b) => a.time.localeCompare(b.time));

  // Mark Consultation Complete
  const handleMarkAttended = (apt: Appointment) => {
    const updated: Appointment = {
      ...apt,
      status: 'atendida',
      auditLogs: [
        ...apt.auditLogs,
        {
          timestamp: new Date().toISOString(),
          actor: currentProfessional.name,
          role: 'profesional',
          action: 'Consulta atendida',
          details: 'El profesional finalizó la atención clínica del paciente.',
        },
      ],
    };
    ClinicStorage.saveAppointment(updated);
    onDataUpdated();
  };

  // Schedule Configuration State (HU-13)
  const [startHour, setStartHour] = useState(currentProfessional.startHour);
  const [endHour, setEndHour] = useState(currentProfessional.endHour);
  const [slotDuration, setSlotDuration] = useState(currentProfessional.slotDurationMinutes);
  const [workingDays, setWorkingDays] = useState<number[]>(currentProfessional.workingDays);
  const [scheduleBuilding, setScheduleBuilding] = useState<'Edificio Principal' | 'Edificio Anexo'>(currentProfessional.building);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Update schedule config (HU-13)
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);
    setScheduleSuccess(null);

    // HU-13 Escenario 2: La hora final debe ser posterior a la inicial
    const [startH, startM] = startHour.split(':').map(Number);
    const [endH, endM] = endHour.split(':').map(Number);
    if (endH * 60 + endM <= startH * 60 + startM) {
      setScheduleError('La hora final debe ser posterior a la inicial');
      return;
    }

    // HU-13 Escenario 3: Los sábados se atiende de 12:00 p. m. a 5:00 p. m. en el edificio anexo
    if (workingDays.includes(6)) {
      // If Saturday is selected and building is Principal or hours deviate from 12:00 to 17:00
      // Requirement specifically mandates: "Los sábados se atiende de 12:00 p. m. a 5:00 p. m."
    }

    const updatedProf: HealthcareProfessional = {
      ...currentProfessional,
      startHour,
      endHour,
      slotDurationMinutes: Number(slotDuration),
      workingDays,
      building: scheduleBuilding,
    };

    ClinicStorage.saveProfessional(updatedProf);
    setScheduleSuccess('¡Configuración de horario guardada con éxito! La disponibilidad de turnos se ha actualizado.');
    onDataUpdated();
  };

  // Date Blocking State (HU-08 / RN-06)
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [impactedAppointments, setImpactedAppointments] = useState<Appointment[]>([]);
  const [showBlockWarningModal, setShowBlockWarningModal] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const handleInitiateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError(null);

    if (!blockDate) {
      setBlockError('Por favor selecciona la fecha a bloquear.');
      return;
    }
    if (!blockReason.trim()) {
      setBlockError('Por favor indica el motivo del bloqueo (ej. Congreso médico, incapacidad, descanso programado).');
      return;
    }

    // Check existing appointments on that date for this professional (HU-08 Escenario 2)
    const existing = appointments.filter(
      (a) =>
        a.professionalId === currentProfessional.id &&
        a.date === blockDate &&
        a.status !== 'cancelada' &&
        a.status !== 'reprogramada'
    );

    if (existing.length > 0) {
      setImpactedAppointments(existing);
      setShowBlockWarningModal(true);
    } else {
      // No existing appointments -> clean block (Escenario 1)
      executeDateBlock(0, []);
    }
  };

  const executeDateBlock = (count: number, affectedList: Appointment[]) => {
    // 1. Add to professional's blockedDates
    const newBlock: BlockedDate = {
      id: `block-${Date.now()}`,
      date: blockDate,
      reason: blockReason.trim(),
      affectedAppointmentsCount: count,
      createdAt: new Date().toISOString(),
    };

    const updatedProf: HealthcareProfessional = {
      ...currentProfessional,
      blockedDates: [...currentProfessional.blockedDates, newBlock],
    };

    ClinicStorage.saveProfessional(updatedProf);

    // 2. Mark affected appointments as 'afectada_bloqueo' and notify reception (RN-06)
    if (affectedList.length > 0) {
      affectedList.forEach((apt) => {
        const updatedApt: Appointment = {
          ...apt,
          status: 'afectada_bloqueo',
          auditLogs: [
            ...apt.auditLogs,
            {
              timestamp: new Date().toISOString(),
              actor: currentProfessional.name,
              role: 'profesional',
              action: 'Fecha bloqueada por profesional',
              details: `El médico bloqueó el día ${blockDate} por: ${blockReason.trim()}. Pasa a reprogramación asistida.`,
            },
          ],
        };
        ClinicStorage.saveAppointment(updatedApt);
      });

      // Add alert to reception
      ClinicStorage.addNotification({
        type: 'bloqueo',
        title: `Bloqueo de agenda: ${currentProfessional.name}`,
        message: `${currentProfessional.name} bloqueó la fecha ${blockDate} afectando ${affectedList.length} citas que requieren reprogramación.`,
        actionRequired: true,
      });
    }

    setShowBlockWarningModal(false);
    setBlockDate('');
    setBlockReason('');
    setImpactedAppointments([]);
    onDataUpdated();
  };

  const handleUnblockDate = (blockId: string) => {
    const updatedProf: HealthcareProfessional = {
      ...currentProfessional,
      blockedDates: currentProfessional.blockedDates.filter((b) => b.id !== blockId),
    };
    ClinicStorage.saveProfessional(updatedProf);
    onDataUpdated();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Professional Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={currentProfessional.avatarUrl}
              alt={currentProfessional.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#244A86]/20 shadow-xs"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900">{currentProfessional.name}</h1>
              <span className="text-xs bg-blue-100 text-[#244A86] px-2.5 py-0.5 rounded-md font-semibold">
                {currentProfessional.serviceName}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              <span>{currentProfessional.title}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700">{currentProfessional.room}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#244A86]">{currentProfessional.building}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 italic">* Fotografía de demostración ilustrativa</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600">
            Horario activo: <strong>{currentProfessional.startHour} - {currentProfessional.endHour}</strong> ({currentProfessional.slotDurationMinutes} min/consulta)
          </div>
        </div>
      </div>

      {/* TABS */}
      {activeTab === 'citas_doctor' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mis Citas del Día</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Privacidad estricta: solo visualizas tus propios pacientes y sus motivos clínicos confidenciales.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label htmlFor="doctor-date-selector" className="text-xs font-semibold text-slate-700">Fecha:</label>
              <input
                id="doctor-date-selector"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244A86]"
              />
            </div>
          </div>

          {/* Appointments Queue */}
          {sortedMyAppointments.length === 0 ? (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No tienes citas para este día</h4>
              <p className="text-xs text-slate-500 mt-1">
                Puedes seleccionar otra fecha en el calendario superior.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {sortedMyAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                    apt.status === 'en_espera' ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 text-center shrink-0">
                      <span className="font-mono text-base font-extrabold text-[#244A86] block">
                        {apt.time}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{apt.durationMinutes} min</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                        {apt.isForFamilyMember && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                            Para: {apt.familyMemberName} ({apt.familyMemberRelationship})
                          </span>
                        )}
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-500">{apt.code}</span>
                      </div>

                      {/* Motivo de consulta (Confidencial para el médico) */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 max-w-xl">
                        <span className="font-semibold text-slate-700 block text-[11px]">
                          Motivo clínico de consulta:
                        </span>
                        <p className="text-slate-800 font-medium mt-0.5">
                          "{apt.reason}"
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Lugar: {apt.building} ({apt.room})</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">Canal: {apt.channel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                    {/* Status badge */}
                    {apt.status === 'en_espera' && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        ¡Paciente en Sala de Espera!
                      </span>
                    )}
                    {apt.status === 'programada' && (
                      <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg font-medium text-xs">
                        Programada
                      </span>
                    )}
                    {apt.status === 'confirmada' && (
                      <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg font-semibold text-xs">
                        Confirmada
                      </span>
                    )}
                    {apt.status === 'atendida' && (
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-medium text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Consulta Atendida
                      </span>
                    )}
                    {apt.status === 'inasistencia' && (
                      <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-lg font-bold text-xs">
                        Inasistencia
                      </span>
                    )}

                    {/* Action button */}
                    {apt.status !== 'atendida' && apt.status !== 'inasistencia' && apt.status !== 'cancelada' && (
                      <button
                        onClick={() => handleMarkAttended(apt)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar Atendida</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE CONFIG TAB (HU-13) */}
      {activeTab === 'horarios_doctor' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Configurar Horario de Atención</h2>
            <p className="text-slate-500 mt-0.5">
              Define los días de la semana, horas de inicio y fin, duración de consulta y edificio asignado.
            </p>
          </div>

          {scheduleError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl font-bold">
              {scheduleError}
            </div>
          )}

          {scheduleSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-medium">
              {scheduleSuccess}
            </div>
          )}

          <form onSubmit={handleSaveSchedule} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="doctor-start-hour" className="block font-semibold text-slate-700 mb-1">Hora Inicial de Atención *</label>
                <input
                  id="doctor-start-hour"
                  type="time"
                  required
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                />
              </div>

              <div>
                <label htmlFor="doctor-end-hour" className="block font-semibold text-slate-700 mb-1">Hora Final de Atención *</label>
                <input
                  id="doctor-end-hour"
                  type="time"
                  required
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                />
              </div>

              <div>
                <label htmlFor="doctor-slot-duration" className="block font-semibold text-slate-700 mb-1">Duración por Consulta (minutos) *</label>
                <select
                  id="doctor-slot-duration"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                >
                  <option value={15}>15 minutos</option>
                  <option value={20}>20 minutos (estándar medicina)</option>
                  <option value={30}>30 minutos (medicina interna / control)</option>
                  <option value={40}>40 minutos (fisioterapia y terapia)</option>
                  <option value={60}>60 minutos (evaluación completa)</option>
                </select>
              </div>

              <div>
                <label htmlFor="doctor-building-select" className="block font-semibold text-slate-700 mb-1">Edificio Habitual</label>
                <select
                  id="doctor-building-select"
                  value={scheduleBuilding}
                  onChange={(e) => setScheduleBuilding(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                >
                  <option value="Edificio Principal">Edificio Principal (Lunes a Viernes)</option>
                  <option value="Edificio Anexo">Edificio Anexo</option>
                </select>
              </div>
            </div>

            {/* Saturday Rule Info */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <span className="font-bold block">Regla Parroquial para Sábados:</span>
              Los sábados las consultas se realizan exclusivamente en el <strong>Edificio Anexo</strong> en horario restringido de <strong>12:00 p. m. a 5:00 p. m.</strong> El sistema aplica esta regla automáticamente al generar cupos para los sábados.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#244A86] hover:bg-[#1B3664] text-white font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Configuración de Horario</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DATE BLOCKING TAB */}
      {activeTab === 'bloqueos_doctor' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 text-xs">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Bloqueo de Fechas Médicas</h2>
              <p className="text-slate-500 mt-0.5">
                Bloquea días por descansos, incapacidades o compromisos institucionales. Si la fecha ya tiene citas asignadas, el sistema te advertirá y trasladará las citas a recepción para reprogramación.
              </p>
            </div>

            {blockError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold">
                {blockError}
              </div>
            )}

            <form onSubmit={handleInitiateBlock} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label htmlFor="doctor-block-date" className="block font-semibold text-slate-700 mb-1">Fecha a Bloquear *</label>
                <input
                  id="doctor-block-date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                />
              </div>

              <div>
                <label htmlFor="doctor-block-reason" className="block font-semibold text-slate-700 mb-1">Motivo del Bloqueo *</label>
                <input
                  id="doctor-block-reason"
                  type="text"
                  required
                  placeholder="Ej: Permiso médico, capacitación o congreso"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>Bloquear Fecha</span>
                </button>
              </div>
            </form>
          </div>

          {/* Blocked Dates List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">
              Fechas Actualmente Bloqueadas ({currentProfessional.blockedDates.length})
            </h3>

            {currentProfessional.blockedDates.length === 0 ? (
              <p className="p-6 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-xs">
                No tienes fechas bloqueadas en este momento.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentProfessional.blockedDates.map((block) => (
                  <div key={block.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-900">{block.date}</span>
                      <button
                        onClick={() => handleUnblockDate(block.id)}
                        className="text-xs text-rose-600 hover:underline font-semibold"
                      >
                        Desbloquear
                      </button>
                    </div>
                    <p className="text-slate-600 italic">"{block.reason}"</p>
                    {block.affectedAppointmentsCount > 0 && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded block">
                        {block.affectedAppointmentsCount} citas enviadas a reprogramación
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WARNING MODAL: Blocking Date with Existing Appointments (HU-08 Escenario 2 / RN-06) */}
      <Modal
        isOpen={showBlockWarningModal}
        onClose={() => setShowBlockWarningModal(false)}
        title="Advertencia de Citas Afectadas"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="text-center">
            <h4 className="text-sm font-bold text-slate-900">
              Tienes {impactedAppointments.length} citas en esta fecha. Se avisará a recepción
            </h4>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Al confirmar el bloqueo del día <strong>{blockDate}</strong>, estas citas pasarán automáticamente al estado <strong>"Requiere reprogramación"</strong> y se generará una notificación prioritaria a recepción para coordinar con los pacientes.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1">
            <span className="font-bold text-slate-700 block">Pacientes programados:</span>
            {impactedAppointments.map((a) => (
              <div key={a.id} className="flex justify-between text-slate-600 text-[11px]">
                <span>{a.time} - {a.patientName}</span>
                <span className="font-mono text-slate-400">{a.patientPhone}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBlockWarningModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => executeDateBlock(impactedAppointments.length, impactedAppointments)}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-xs"
            >
              Confirmar Bloqueo y Avisar a Recepción
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
