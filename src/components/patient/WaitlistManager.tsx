import React, { useState } from 'react';
import { Appointment, Patient, ServiceCategory, WaitlistEntry } from '../../types';
import { CLINIC_SERVICES, ClinicStorage, calculateCancelDeadline } from '../../services/storage';
import { Clock, CheckCircle2, XCircle, AlertCircle, Sparkles, Plus, Calendar, BellRing } from 'lucide-react';

interface WaitlistManagerProps {
  currentPatient: Patient;
  waitlist: WaitlistEntry[];
  onWaitlistUpdated: () => void;
  onAppointmentBooked: (apt: Appointment) => void;
}

export const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  currentPatient,
  waitlist,
  onWaitlistUpdated,
  onAppointmentBooked,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [serviceId, setServiceId] = useState<ServiceCategory>('medicina_general');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');

  const patientEntries = waitlist.filter((w) => w.patientId === currentPatient.id);

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    const service = CLINIC_SERVICES.find((s) => s.id === serviceId);

    const newEntry: WaitlistEntry = {
      id: `wait-${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.fullName,
      patientPhone: currentPatient.phone,
      serviceId,
      serviceName: service ? service.name : 'Medicina General',
      preferredDate: preferredDate || undefined,
      notes: notes.trim() || undefined,
      requestedAt: new Date().toISOString(),
      status: 'esperando',
    };

    ClinicStorage.saveWaitlistEntry(newEntry);
    onWaitlistUpdated();
    setShowForm(false);
    setPreferredDate('');
    setNotes('');
  };

  const handleAcceptOffer = (entry: WaitlistEntry) => {
    if (!entry.offeredSlot) return;

    // Create the appointment immediately
    const cancelDeadline = calculateCancelDeadline(entry.offeredSlot.date, entry.offeredSlot.time);

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      code: `MCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: currentPatient.id,
      patientName: currentPatient.fullName,
      patientPhone: currentPatient.phone,
      patientEmail: currentPatient.email,
      isForFamilyMember: false,
      serviceId: entry.serviceId,
      serviceName: entry.serviceName,
      professionalId: entry.offeredSlot.professionalId,
      professionalName: entry.offeredSlot.professionalName,
      date: entry.offeredSlot.date,
      time: entry.offeredSlot.time,
      durationMinutes: 20,
      building: entry.offeredSlot.building as 'Edificio Principal' | 'Edificio Anexo',
      room: 'Consultorio asignado',
      reason: entry.notes || 'Cupo aceptado desde Lista de Espera',
      status: 'confirmada',
      cancelDeadline,
      createdByRole: 'paciente',
      channel: 'web',
      reminder24hSent: false,
      reminder2hSent: false,
      reminderStatus: 'confirmada',
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          actor: currentPatient.fullName,
          role: 'paciente',
          action: 'Aceptación de cupo de lista de espera',
          details: `Aceptó cupo liberado para el ${entry.offeredSlot.date} a las ${entry.offeredSlot.time}`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    ClinicStorage.saveAppointment(newApt);

    // Update waitlist entry to accepted
    const updated: WaitlistEntry = {
      ...entry,
      status: 'aceptado',
    };
    ClinicStorage.saveWaitlistEntry(updated);

    onWaitlistUpdated();
    onAppointmentBooked(newApt);
  };

  const handleDeclineOffer = (entry: WaitlistEntry) => {
    const updated: WaitlistEntry = {
      ...entry,
      status: 'cancelado',
    };
    ClinicStorage.saveWaitlistEntry(updated);
    onWaitlistUpdated();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lista de Espera Solidaria</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Si no hay horarios disponibles, únete a la lista de espera. Los cupos liberados se ofrecen por orden de antigüedad.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Unirme a Lista de Espera</span>
          </button>
        )}
      </div>

      {/* Join Form */}
      {showForm && (
        <form onSubmit={handleJoinWaitlist} className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Nueva Solicitud de Espera</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="waitlist-service-select" className="block font-semibold text-slate-700 mb-1">Servicio Requerido *</label>
              <select
                id="waitlist-service-select"
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
              <label htmlFor="waitlist-preferred-date" className="block font-semibold text-slate-700 mb-1">Fecha Preferida (opcional)</label>
              <input
                id="waitlist-preferred-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="waitlist-notes" className="block font-semibold text-slate-700 mb-1">Disponibilidad o notas adicionales</label>
            <input
              id="waitlist-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Disponible en horario vespertino o cualquier día de la próxima semana"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
            >
              Registrar Solicitud
            </button>
          </div>
        </form>
      )}

      {/* Active Waitlist offers and requests */}
      <div className="space-y-4">
        {patientEntries.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No tienes solicitudes en lista de espera</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Cuando no encuentres citas para tu fecha preferida, puedes registrarte aquí y el sistema te notificará apenas un paciente cancele su cupo.
            </p>
          </div>
        ) : (
          patientEntries.map((entry) => (
            <div
              key={entry.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                entry.status === 'cupo_ofrecido'
                  ? 'border-emerald-300 bg-emerald-50/30 ring-2 ring-emerald-400/40'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{entry.serviceName}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] text-slate-500">
                    Solicitado el {new Date(entry.requestedAt).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  {entry.status === 'cupo_ofrecido' && (
                    <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-md font-bold text-xs flex items-center gap-1.5 animate-pulse">
                      <BellRing className="w-3.5 h-3.5" />
                      ¡Cupo Liberado Disponible!
                    </span>
                  )}
                  {entry.status === 'esperando' && (
                    <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md font-medium text-xs">
                      En espera de cupo
                    </span>
                  )}
                  {entry.status === 'aceptado' && (
                    <span className="text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md font-medium text-xs">
                      Cupo Aceptado
                    </span>
                  )}
                  {entry.status === 'cancelado' && (
                    <span className="text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-md font-medium text-xs">
                      Declinado / Expirado
                    </span>
                  )}
                </div>
              </div>

              {/* Offered Slot Card (Escenario 2 & 3 de HU-11) */}
              {entry.status === 'cupo_ofrecido' && entry.offeredSlot && (
                <div className="mt-3 p-3.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-emerald-950 text-sm">
                        Cupo disponible para ti por antigüedad:
                      </p>
                      <p className="text-emerald-900 mt-0.5">
                        {entry.offeredSlot.professionalName} · {entry.offeredSlot.building}
                      </p>
                      <p className="font-semibold text-emerald-950 mt-1">
                        📅 {entry.offeredSlot.date} a las ⏰ {entry.offeredSlot.time}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800">
                    Dispones de prioridad para confirmar este cupo antes de que se ofrezca a la siguiente persona en la lista.
                  </p>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptOffer(entry)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aceptar Cupo Inmediatamente</span>
                    </button>
                    <button
                      onClick={() => handleDeclineOffer(entry)}
                      className="px-3 py-2 bg-white text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-medium border border-slate-300"
                    >
                      Rechazar / Ceder turno
                    </button>
                  </div>
                </div>
              )}

              {entry.status === 'esperando' && (
                <div className="py-2 text-xs text-slate-600 space-y-1">
                  {entry.preferredDate && (
                    <p><strong>Fecha preferida:</strong> {entry.preferredDate}</p>
                  )}
                  {entry.notes && (
                    <p className="text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {entry.notes}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-2">
                    🔔 Recibirás una notificación y aviso prioritario tan pronto un paciente cancele en este servicio.
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
