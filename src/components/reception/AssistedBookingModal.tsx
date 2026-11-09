import React, { useState } from 'react';
import { Appointment, BookingChannel, ClinicService, HealthcareProfessional, Patient, ServiceCategory } from '../../types';
import { CLINIC_SERVICES, ClinicStorage, calculateCancelDeadline } from '../../services/storage';
import { RulesEngine } from '../../services/rulesEngine';
import { Modal } from '../common/Modal';
import { User, Phone, Search, AlertTriangle, Check, Calendar, Clock, MapPin, Building, ShieldAlert } from 'lucide-react';

interface AssistedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  professionals: HealthcareProfessional[];
  appointments: Appointment[];
  onBookingCompleted: (apt: Appointment) => void;
  onPatientCreated: (p: Patient) => void;
}

export const AssistedBookingModal: React.FC<AssistedBookingModalProps> = ({
  isOpen,
  onClose,
  patients,
  professionals,
  appointments,
  onBookingCompleted,
  onPatientCreated,
}) => {
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Quick new patient fields if not found (HU-06 Escenario 2)
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newDocumentId, setNewDocumentId] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Booking details
  const [channel, setChannel] = useState<BookingChannel>('telefono');
  const [serviceId, setServiceId] = useState<ServiceCategory>('medicina_general');
  const [professionalId, setProfessionalId] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [receptionStaff, setReceptionStaff] = useState('Carmen Menjívar (Recepción)');
  const [error, setError] = useState<string | null>(null);

  const filteredPatients = patientSearch.trim()
    ? patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.documentId.includes(patientSearch) ||
          p.phone.includes(patientSearch)
      )
    : [];

  const availableProfessionals = professionals.filter((p) => p.serviceId === serviceId);

  // Set default professional
  React.useEffect(() => {
    if (availableProfessionals.length > 0 && (!professionalId || !availableProfessionals.some((p) => p.id === professionalId))) {
      setProfessionalId(availableProfessionals[0].id);
    }
  }, [serviceId, availableProfessionals, professionalId]);

  const currentProf = professionals.find((p) => p.id === professionalId) || availableProfessionals[0];

  const availableSlots = currentProf && date
    ? RulesEngine.getAvailableSlots(currentProf, date, appointments)
    : [];

  const scheduleInfo = date && currentProf
    ? RulesEngine.getBuildingAndHoursForDate(date, currentProf.building)
    : null;

  const handleCreateNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newFullName.trim() || !newDocumentId.trim() || !newPhone.trim()) {
      setError('Por favor completa todos los campos del nuevo paciente.');
      return;
    }

    const newPat: Patient = {
      id: `pat-${Date.now()}`,
      fullName: newFullName.trim(),
      documentId: newDocumentId.trim(),
      phone: newPhone.trim(),
      isSuspended: false,
      unexcusedAbsencesCount: 0,
      absenceHistory: [],
      familyMembers: [],
      createdAt: new Date().toISOString(),
    };

    ClinicStorage.savePatient(newPat);
    onPatientCreated(newPat);
    setSelectedPatient(newPat);
    setIsRegisteringNew(false);
  };

  const handleConfirmAssistedBooking = () => {
    setError(null);
    if (!selectedPatient) {
      setError('Por favor selecciona o registra al paciente.');
      return;
    }
    if (!time) {
      setError('Por favor selecciona un horario de consulta.');
      return;
    }

    // Check slot collision
    const slotCheck = RulesEngine.validateProfessionalSlotAvailability(
      professionalId,
      date,
      time,
      appointments,
      professionals
    );

    if (!slotCheck.allowed) {
      setError(slotCheck.message || 'Este horario ya no está disponible.');
      return;
    }

    const cancelDeadline = calculateCancelDeadline(date, time);
    const building = scheduleInfo ? scheduleInfo.building : currentProf.building;
    const serviceObj = CLINIC_SERVICES.find((s) => s.id === serviceId);

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      code: `MCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      patientPhone: selectedPatient.phone,
      patientEmail: selectedPatient.email,
      isForFamilyMember: false,
      serviceId,
      serviceName: serviceObj ? serviceObj.name : 'Medicina General',
      professionalId: currentProf.id,
      professionalName: currentProf.name,
      date,
      time,
      durationMinutes: currentProf.slotDurationMinutes || 20,
      building,
      room: currentProf.room,
      reason: reason.trim() || 'Consulta agendada por recepción',
      status: 'programada',
      cancelDeadline,
      createdByRole: 'recepcion',
      channel,
      receptionStaffName: receptionStaff,
      reminder24hSent: false,
      reminder2hSent: false,
      reminderStatus: 'pendiente',
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          actor: receptionStaff,
          role: 'recepcion',
          action: `Reserva asistida (${channel})`,
          details: `Recepción agendó para ${selectedPatient.fullName}. Canal: ${channel}.${
            selectedPatient.isSuspended ? ' (Paciente con suspensión online, recepcionista aprobó reserva)' : ''
          }`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    ClinicStorage.saveAppointment(newApt);
    onBookingCompleted(newApt);
    handleClose();
  };

  const handleClose = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setIsRegisteringNew(false);
    setTime('');
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agendamiento Asistido por Recepción"
      subtitle="Agenda citas en nombre de pacientes que llaman, escriben por WhatsApp o asisten presencialmente"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl">
            {error}
          </div>
        )}

        {/* Channel Selection */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <label className="block font-semibold text-slate-800 mb-1.5">
            Canal de Origen de la Solicitud
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['telefono', 'whatsapp', 'presencial'] as BookingChannel[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className={`py-2 px-3 rounded-xl border text-center font-semibold capitalize transition-all ${
                  channel === ch
                    ? 'bg-[#244A86] text-white border-[#244A86] shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {ch === 'telefono' ? '📞 Llamada Telefónica' : ch === 'whatsapp' ? '💬 WhatsApp' : '🏥 Presencial'}
              </button>
            ))}
          </div>
        </div>

        {/* Patient Selection or Quick Register */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-semibold text-slate-800">Paciente Solicitante</label>
            {!selectedPatient && !isRegisteringNew && (
              <button
                type="button"
                onClick={() => setIsRegisteringNew(true)}
                className="text-[#244A86] font-bold hover:underline"
              >
                + Registrar nuevo paciente rápido
              </button>
            )}
          </div>

          {selectedPatient ? (
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              selectedPatient.isSuspended ? 'bg-amber-50 border-amber-300' : 'bg-blue-50/60 border-blue-200'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{selectedPatient.fullName}</span>
                  <span className="font-mono text-[11px] text-slate-600">DUI: {selectedPatient.documentId}</span>
                  <span className="text-slate-500 text-[11px]">Tel: {selectedPatient.phone}</span>
                </div>
                {selectedPatient.isSuspended && (
                  <p className="text-amber-800 font-semibold text-[11px] mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Paciente con suspensión en línea (Recepción autoriza agendamiento directo presencial o telefónico).
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Cambiar
              </button>
            </div>
          ) : isRegisteringNew ? (
            <form onSubmit={handleCreateNewPatient} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Registro Rápido en Recepción</span>
                <button
                  type="button"
                  onClick={() => setIsRegisteringNew(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellidos"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="DUI (ej. 01234567-8)"
                  value={newDocumentId}
                  onChange={(e) => setNewDocumentId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="tel"
                  required
                  placeholder="Teléfono (8 dígitos)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[#244A86] text-white rounded-lg font-bold"
              >
                Guardar y Seleccionar Paciente
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar paciente por nombre, DUI o teléfono..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                />
              </div>

              {patientSearch.trim() && (
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-center text-slate-500">
                      No se encontró al paciente. Puedes hacer clic en "+ Registrar nuevo paciente rápido".
                    </div>
                  ) : (
                    filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPatient(p)}
                        className="w-full p-2.5 text-left hover:bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{p.fullName}</span>
                          <span className="text-slate-500 ml-2">DUI: {p.documentId} · Tel: {p.phone}</span>
                        </div>
                        {p.isSuspended && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            Suspendido online
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service, Professional, and Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Servicio Parroquial</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value as ServiceCategory)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
            >
              {CLINIC_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Profesional Asignado</label>
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
            >
              {availableProfessionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.room})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
            />
          </div>
        </div>

        {/* Saturday Banner (RN-07) */}
        {scheduleInfo && (
          <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
            scheduleInfo.isSaturday ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <MapPin className="w-3.5 h-3.5 text-[#244A86]" />
            <span><strong>{scheduleInfo.building}:</strong> {scheduleInfo.note}</span>
          </div>
        )}

        {/* Slot Selection */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Seleccionar Horario Disponible
          </label>
          {availableSlots.length === 0 ? (
            <p className="text-slate-500 italic p-3 bg-slate-50 rounded-xl text-center">
              No hay horarios disponibles en esta fecha.
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
              {availableSlots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setTime(s.time)}
                  className={`py-1.5 px-2 rounded-lg border text-center font-semibold text-xs ${
                    !s.available
                      ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                      : time === s.time
                      ? 'bg-[#244A86] text-white border-[#244A86] ring-2 ring-blue-300'
                      : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200'
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Motivo de consulta */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Motivo de Consulta o Observaciones de Recepción
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Paciente refiere dolor agudo de espalda, agendado vía llamada telefónica"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedPatient || !time}
            onClick={handleConfirmAssistedBooking}
            className={`px-5 py-2.5 rounded-xl font-bold text-white transition-colors flex items-center gap-1.5 ${
              selectedPatient && time
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Agendamiento en Recepción</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
