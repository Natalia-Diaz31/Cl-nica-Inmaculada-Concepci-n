import React, { useState } from 'react';
import { Appointment, ClinicService, HealthcareProfessional, Patient, ServiceCategory } from '../../types';
import { CLINIC_SERVICES, ClinicStorage, calculateCancelDeadline } from '../../services/storage';
import { RulesEngine, ValidationResult } from '../../services/rulesEngine';
import { Modal } from '../common/Modal';
import { InteractiveCalendar } from '../common/InteractiveCalendar';
import { Calendar, Clock, MapPin, User, ChevronRight, ChevronLeft, Check, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPatient: Patient;
  appointments: Appointment[];
  professionals: HealthcareProfessional[];
  onAppointmentBooked: (newApt: Appointment) => void;
  onJoinWaitlist: (serviceId: ServiceCategory, date?: string) => void;
  initialStep?: 1 | 2 | 3 | 4;
  initialServiceId?: ServiceCategory;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  currentPatient,
  appointments,
  professionals,
  onAppointmentBooked,
  onJoinWaitlist,
  initialStep = 1,
  initialServiceId = 'medicina_general',
}) => {
  // Step 1: P03 Selección de Servicio y Beneficiario
  // Step 2: P04 Profesional, Edificio y Fecha
  // Step 3: P04 Horario Disponible (RN-01, RN-07)
  // Step 4: P05 Confirmación de Datos, Motivo y Plazo Visible (HU-16)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);

  const [selectedServiceId, setSelectedServiceId] = useState<ServiceCategory>(initialServiceId);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('self');
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      if (initialServiceId) setSelectedServiceId(initialServiceId);
    }
  }, [isOpen, initialStep, initialServiceId]);

  // Check suspension (RN-04)
  const suspensionCheck = RulesEngine.isPatientSuspended(currentPatient);

  // Filter professionals offering the selected service
  const serviceProfessionals = professionals.filter((p) => p.serviceId === selectedServiceId);
  const activeService = CLINIC_SERVICES.find((s) => s.id === selectedServiceId);

  // Auto-select first professional if not selected or mismatched
  React.useEffect(() => {
    if (serviceProfessionals.length > 0 && (!selectedProfId || !serviceProfessionals.some((p) => p.id === selectedProfId))) {
      setSelectedProfId(serviceProfessionals[0].id);
    }
  }, [selectedServiceId, serviceProfessionals, selectedProfId]);

  // Set default date to tomorrow if empty
  React.useEffect(() => {
    if (!selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Format YYYY-MM-DD
      const dateStr = tomorrow.toISOString().split('T')[0];
      setSelectedDate(dateStr);
    }
  }, [selectedDate]);

  // Selected professional object
  const currentProf = professionals.find((p) => p.id === selectedProfId) || serviceProfessionals[0];

  // Available slots for the selected date & professional
  const availableSlots = currentProf && selectedDate
    ? RulesEngine.getAvailableSlots(currentProf, selectedDate, appointments)
    : [];

  // Building & Hours info for the chosen date (RN-07)
  const scheduleInfo = selectedDate && currentProf
    ? RulesEngine.getBuildingAndHoursForDate(selectedDate, currentProf.building)
    : null;

  const handleStep1Next = () => {
    setErrorMessage(null);

    // Validate RN-02: Maximum 1 active appointment per service for this patient
    const activeCheck = RulesEngine.validateSingleActivePerService(
      currentPatient.id,
      selectedServiceId,
      appointments
    );

    if (!activeCheck.allowed) {
      setErrorMessage(activeCheck.message || 'Ya tienes una cita activa de este servicio.');
      return;
    }

    setStep(2);
  };

  const handleStep2Next = () => {
    setErrorMessage(null);
    if (!selectedProfId) {
      setErrorMessage('Por favor selecciona un profesional de la salud.');
      return;
    }
    if (!selectedDate) {
      setErrorMessage('Por favor selecciona una fecha para tu consulta.');
      return;
    }

    // Check anticipation rule
    const minCheck = RulesEngine.validateAnticipation(selectedDate, '12:00');
    if (!minCheck.allowed && minCheck.code === 'OUT_OF_RANGE') {
      setErrorMessage(minCheck.message || 'La fecha seleccionada está fuera del rango permitido (2 horas a 60 días).');
      return;
    }

    // Check if professional blocked this date (RN-06)
    if (currentProf?.blockedDates.some((b) => b.date === selectedDate)) {
      setErrorMessage(`El profesional no tiene disponibilidad el ${selectedDate} debido a un bloqueo programado.`);
      return;
    }

    setStep(3);
  };

  const handleStep3Next = () => {
    setErrorMessage(null);
    if (!selectedTime) {
      setErrorMessage('Por favor selecciona un horario disponible.');
      return;
    }

    // Validate double booking RN-01
    const slotCheck = RulesEngine.validateProfessionalSlotAvailability(
      selectedProfId,
      selectedDate,
      selectedTime,
      appointments,
      professionals
    );

    if (!slotCheck.allowed) {
      setErrorMessage(slotCheck.message || 'Este horario ya no está disponible.');
      if (slotCheck.nearestSlots && slotCheck.nearestSlots.length > 0) {
        setSuggestedSlots(slotCheck.nearestSlots);
      }
      return;
    }

    setStep(4);
  };

  const handleConfirmBooking = () => {
    setErrorMessage(null);
    if (!reason.trim()) {
      setErrorMessage('Por favor escribe un breve motivo de consulta (ej. Control de rutina, dolor lumbar, revisión).');
      return;
    }

    // Final checks before creation
    const slotCheck = RulesEngine.validateProfessionalSlotAvailability(
      selectedProfId,
      selectedDate,
      selectedTime,
      appointments,
      professionals
    );

    if (!slotCheck.allowed) {
      setErrorMessage(slotCheck.message || 'Este horario ya no está disponible.');
      if (slotCheck.nearestSlots) setSuggestedSlots(slotCheck.nearestSlots);
      setStep(3);
      return;
    }

    const isFamily = selectedBeneficiaryId !== 'self';
    const familyMember = isFamily
      ? currentPatient.familyMembers.find((f) => f.id === selectedBeneficiaryId)
      : undefined;

    const building = scheduleInfo ? scheduleInfo.building : currentProf.building;
    const cancelDeadline = calculateCancelDeadline(selectedDate, selectedTime);

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      code: `MCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: currentPatient.id,
      patientName: currentPatient.fullName,
      patientPhone: currentPatient.phone,
      patientEmail: currentPatient.email,
      isForFamilyMember: isFamily,
      familyMemberName: familyMember ? familyMember.fullName : undefined,
      familyMemberRelationship: familyMember ? familyMember.relationship : undefined,
      serviceId: selectedServiceId,
      serviceName: activeService ? activeService.name : 'Medicina General',
      professionalId: currentProf.id,
      professionalName: currentProf.name,
      date: selectedDate,
      time: selectedTime,
      durationMinutes: currentProf.slotDurationMinutes || 20,
      building,
      room: currentProf.room,
      reason: reason.trim(),
      status: 'programada',
      cancelDeadline,
      createdByRole: 'paciente',
      channel: 'web',
      reminder24hSent: false,
      reminder2hSent: false,
      reminderStatus: 'pendiente',
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          actor: currentPatient.fullName,
          role: 'paciente',
          action: 'Reserva creada en línea',
          details: `Cita reservada para ${selectedDate} a las ${selectedTime} (${building})`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    ClinicStorage.saveAppointment(newAppointment);
    onAppointmentBooked(newAppointment);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setErrorMessage(null);
    setSuggestedSlots([]);
    setReason('');
    setSelectedTime('');
    onClose();
  };

  // If patient is suspended, show suspension notice directly (RN-04)
  if (!suspensionCheck.allowed) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Agendamiento en Línea Suspendido" maxWidth="md">
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Atención requerida con Recepción</h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Tu agendamiento en línea está temporalmente suspendido debido a 3 inasistencias en los últimos 6 meses.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 text-left">
            <p className="font-semibold mb-1">¿Cómo reactivar tu cuenta?</p>
            <p>
              Comunícate con recepción parroquial o preséntate en ventanilla para justificar tus ausencias. El personal de recepción puede agendar tu cita y desbloquear tu cuenta.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="tel:22578900"
              className="flex-1 py-2.5 px-4 bg-[#244A86] hover:bg-[#1B3664] text-white rounded-xl text-xs font-semibold text-center transition-colors"
            >
              Llamar a Recepción (2257-8900)
            </a>
            <button
              onClick={handleClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Calculate 60 days limit for calendar min & max
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reservar Cita Médica Parroquial"
      subtitle={`${
        step === 1
          ? 'Paso 1: Selección de Especialidad y Beneficiario'
          : step === 2
          ? 'Paso 2: Profesional de la Salud, Sede y Fecha'
          : step === 3
          ? 'Paso 3: Selección de Horario Disponible'
          : 'Paso 4: Confirmación de Cita, Motivo y Plazo Límite'
      }`}
      maxWidth="lg"
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-between gap-1 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 flex items-center">
            <div
              className={`h-1.5 w-full rounded-full transition-all ${
                s < step
                  ? 'bg-emerald-500'
                  : s === step
                  ? 'bg-[#244A86]'
                  : 'bg-slate-200'
              }`}
            />
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            {suggestedSlots.length > 0 && (
              <div className="mt-2 pt-2 border-t border-rose-200">
                <span className="font-medium text-slate-700">Horarios alternativos más cercanos hoy:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {suggestedSlots.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const timeOnly = s.split(' ')[0];
                        setSelectedTime(timeOnly);
                        setErrorMessage(null);
                        setSuggestedSlots([]);
                        setStep(4);
                      }}
                      className="px-2 py-1 bg-white border border-rose-300 rounded text-slate-800 text-[11px] font-medium hover:bg-rose-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 1: Service & Beneficiary */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Beneficiary selection (HU-19: Agendar para un familiar) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ¿Para quién es la cita?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedBeneficiaryId('self')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  selectedBeneficiaryId === 'self'
                    ? 'border-[#244A86] bg-blue-50/50 text-[#244A86] ring-1 ring-[#244A86]'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#244A86] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">{currentPatient.fullName}</p>
                  <p className="text-[11px] text-slate-500">Titular de la cuenta</p>
                </div>
              </button>

              {currentPatient.familyMembers.map((fam) => (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() => setSelectedBeneficiaryId(fam.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    selectedBeneficiaryId === fam.id
                      ? 'border-[#244A86] bg-blue-50/50 text-[#244A86] ring-1 ring-[#244A86]'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight truncate">{fam.fullName}</p>
                    <p className="text-[11px] text-slate-500">{fam.relationship}</p>
                  </div>
                </button>
              ))}
            </div>

            {currentPatient.familyMembers.length === 0 && (
              <p className="text-[11px] text-slate-500 mt-2">
                ¿Deseas agendar para tu mamá, papá o hijos? Puedes registrar familiares desde la pestaña "Familiares".
              </p>
            )}
          </div>

          {/* Service selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Selecciona el Servicio Parroquial
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLINIC_SERVICES.map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => setSelectedServiceId(srv.id)}
                  className={`rounded-2xl border text-left transition-all overflow-hidden flex flex-col justify-between ${
                    selectedServiceId === srv.id
                      ? 'border-[#244A86] bg-blue-50/40 shadow-xs ring-2 ring-[#244A86]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {srv.imageUrl && (
                    <div className="h-20 w-full overflow-hidden relative bg-slate-100">
                      <img
                        src={srv.imageUrl}
                        alt={srv.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                      <div className="absolute bottom-1.5 left-2.5 text-white font-bold text-xs">
                        {srv.name}
                      </div>
                      <div className="absolute top-1.5 right-2 bg-white/90 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded text-slate-800 font-semibold">
                        ~{srv.estimatedDurationMinutes}m
                      </div>
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    {!srv.imageUrl && (
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-xs font-bold text-slate-900">{srv.name}</h5>
                        <span className="text-[10px] text-slate-500 font-mono">~{srv.estimatedDurationMinutes} min</span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{srv.description}</p>
                    <span className="text-[10px] text-slate-400 block pt-1">{srv.defaultBuilding}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleStep1Next}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#244A86] hover:bg-[#1B3664] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs active:scale-95"
            >
              <span>Continuar a Profesional y Fecha</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Professional & Date */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Professional selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Profesional de la Salud
              </label>
              <span className="text-[10px] text-slate-400 italic">
                * Fotografías ilustrativas de demostración
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {serviceProfessionals.map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => setSelectedProfId(prof.id)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                    selectedProfId === prof.id
                      ? 'border-[#244A86] bg-blue-50/40 ring-2 ring-[#244A86]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prof.avatarUrl}
                      alt={prof.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border-2 border-slate-200 shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{prof.name}</p>
                      <p className="text-[11px] text-[#244A86] font-medium truncate">{prof.title}</p>
                      <p className="text-[10px] text-slate-500">{prof.room}</p>
                    </div>
                  </div>
                  {selectedProfId === prof.id && (
                    <div className="w-5 h-5 rounded-full bg-[#244A86] text-white flex items-center justify-center text-xs shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Visual Calendar Date Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#244A86]" />
                <span>Selecciona la Fecha en el Calendario</span>
              </label>
            </div>
            <InteractiveCalendar
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              minDate={todayStr}
              maxDate={maxDateStr}
              blockedDates={currentProf.blockedDates.map((b) => b.date)}
            />
          </div>

          {/* Saturday rule banner (RN-07) */}
          {scheduleInfo && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              scheduleInfo.isSaturday
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${scheduleInfo.isSaturday ? 'text-amber-600' : 'text-[#244A86]'}`} />
              <div>
                <p className="font-semibold">
                  {scheduleInfo.building} · {scheduleInfo.startHour} a {scheduleInfo.endHour}
                </p>
                <p className="text-[11px] mt-0.5 opacity-90">{scheduleInfo.note}</p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              onClick={handleStep2Next}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#244A86] hover:bg-[#1B3664] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs active:scale-95"
            >
              <span>Ver Horarios Libres</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Time Slot Selection */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <div>
                <label className="text-xs font-bold text-slate-900">
                  Horarios para el {selectedDate}
                </label>
                <p className="text-[11px] text-slate-500">
                  {currentProf.name} · {scheduleInfo?.building} · Turnos de {currentProf.slotDurationMinutes} min
                </p>
              </div>
              <div className="text-xs font-medium text-slate-600">
                <span className="font-bold text-[#244A86]">{availableSlots.filter((s) => s.available).length}</span> cupos libres de {availableSlots.length}
              </div>
            </div>

            {availableSlots.length === 0 || availableSlots.filter((s) => s.available).length === 0 ? (
              <div className="p-6 text-center border border-dashed border-blue-200 rounded-2xl bg-blue-50/40">
                <Clock className="w-8 h-8 text-[#244A86] mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">No hay horarios disponibles para esta fecha</p>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Todos los cupos de atención para esta jornada están reservados o el profesional no atiende este día. Puedes elegir la siguiente fecha o unirte como opción secundaria a la lista de espera.
                </p>

                {(() => {
                  const nextD = new Date(selectedDate);
                  nextD.setDate(nextD.getDate() + 1);
                  const nextDateStr = nextD.toISOString().split('T')[0];
                  return (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-blue-100 max-w-xs mx-auto text-xs text-slate-700 shadow-2xs">
                      <p className="font-semibold text-[#244A86]">Fecha recomendada:</p>
                      <p className="mt-0.5 font-medium">{nextDateStr}</p>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(nextDateStr)}
                        className="mt-2 text-xs font-bold text-[#244A86] hover:underline block mx-auto"
                      >
                        Consultar horarios del {nextDateStr} →
                      </button>
                    </div>
                  );
                })()}

                <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      onJoinWaitlist(selectedServiceId, selectedDate);
                      handleClose();
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                  >
                    Unirme a la lista de espera
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100"
                  >
                    Elegir otra fecha
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
                {availableSlots.map((slot) => {
                  const isChosen = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-all text-xs font-semibold flex flex-col items-center justify-center gap-0.5 ${
                        !slot.available
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          : isChosen
                          ? 'bg-[#244A86] text-white border-[#244A86] shadow-md ring-2 ring-blue-300 scale-102'
                          : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200 hover:border-blue-300 shadow-2xs'
                      }`}
                    >
                      <span>{slot.time}</span>
                      <span className="text-[9px] font-normal leading-none opacity-80">
                        {isChosen ? '✓ Elegido' : slot.available ? 'Disponible' : 'Ocupado'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300"></span>
              Libre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#244A86]"></span>
              Seleccionado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
              Ocupado
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              disabled={!selectedTime}
              onClick={handleStep3Next}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl transition-colors shadow-xs ${
                selectedTime
                  ? 'bg-[#244A86] hover:bg-[#1B3664] text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Continuar a Confirmación</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Reason & Confirmation */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-start justify-between pb-2 border-b border-slate-200">
              <div>
                <p className="text-[11px] text-slate-500">Servicio y Paciente</p>
                <h5 className="font-bold text-slate-900 text-sm">{activeService?.name}</h5>
                <p className="text-slate-600 font-medium">
                  {selectedBeneficiaryId === 'self'
                    ? currentPatient.fullName
                    : currentPatient.familyMembers.find((f) => f.id === selectedBeneficiaryId)?.fullName}
                </p>
              </div>
              <span className="bg-blue-100 text-[#244A86] px-2.5 py-1 rounded-lg font-bold text-[11px]">
                {scheduleInfo?.building}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block">Profesional:</span>
                <span className="font-semibold text-slate-800">{currentProf.name}</span>
                <span className="text-[10px] text-slate-500 block">{currentProf.room}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Fecha y Hora:</span>
                <span className="font-semibold text-slate-800">{selectedDate} a las {selectedTime}</span>
                <span className="text-[10px] text-slate-500 block">Duración: {currentProf.slotDurationMinutes} min</span>
              </div>
            </div>

            {/* Plazo visible al confirmar */}
            <div className="mt-2 pt-2 border-t border-slate-200 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 text-[11px] text-amber-900">
              <span className="font-bold block">Plazo límite de cancelación en línea:</span>
              <span>
                Hasta el {new Date(calculateCancelDeadline(selectedDate, selectedTime)).toLocaleDateString('es-SV', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })} (24 horas antes). Posterior a este plazo deberás comunicarte directamente con recepción.
              </span>
            </div>
          </div>

          {/* Reason for visit (confidential) */}
          <div>
            <label htmlFor="appointment-reason-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo breve de consulta <span className="text-slate-400 font-normal">(confidencial)</span>
            </label>
            <textarea
              id="appointment-reason-input"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Dolor lumbar tras esfuerzo físico, control de glucosa, retiro de puntos, tos seca..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244A86]"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmBooking}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar y Agendar Cita</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
