import React, { useState } from 'react';
import { Appointment, HealthcareProfessional, Patient } from '../../types';
import { ClinicStorage } from '../../services/storage';
import { RulesEngine } from '../../services/rulesEngine';
import { Modal } from '../common/Modal';
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Clock,
  RefreshCw,
  User,
} from 'lucide-react';

interface AffectedAppointmentsQueueProps {
  appointments: Appointment[];
  professionals: HealthcareProfessional[];
  patients: Patient[];
  onDataUpdated: () => void;
}

export const AffectedAppointmentsQueue: React.FC<AffectedAppointmentsQueueProps> = ({
  appointments,
  professionals,
  patients,
  onDataUpdated,
}) => {
  const affected = appointments.filter((a) => a.status === 'afectada_bloqueo');

  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentProf = reschedulingApt
    ? professionals.find((p) => p.id === reschedulingApt.professionalId)
    : null;

  const availableSlots = currentProf && newDate
    ? RulesEngine.getAvailableSlots(currentProf, newDate, appointments)
    : [];

  const handleConfirmReschedule = () => {
    setError(null);
    if (!reschedulingApt || !newDate || !newTime) {
      setError('Por favor selecciona una nueva fecha y hora.');
      return;
    }

    const updated: Appointment = {
      ...reschedulingApt,
      date: newDate,
      time: newTime,
      status: 'programada',
      reminder24hSent: false,
      reminder2hSent: false,
      reminderStatus: 'pendiente',
      auditLogs: [
        ...reschedulingApt.auditLogs,
        {
          timestamp: new Date().toISOString(),
          actor: 'Carmen Menjívar (Recepción)',
          role: 'recepcion',
          action: 'Reprogramación por bloqueo médico',
          details: `Recepción coordinó y reprogramó la cita afectada al ${newDate} a las ${newTime}.`,
        },
      ],
    };

    ClinicStorage.saveAppointment(updated);
    setReschedulingApt(null);
    setNewDate('');
    setNewTime('');
    onDataUpdated();
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">
          Citas Afectadas por Bloqueo de Agenda
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Lista de pacientes cuyas citas coincidieron con fechas bloqueadas por profesionales de salud y requieren reprogramación asistida.
        </p>
      </div>

      {affected.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No hay citas pendientes de reprogramación</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Todas las citas de los médicos y terapeutas se encuentran al día y sin conflictos de agenda por bloqueos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center justify-between">
            <span className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {affected.length} citas requieren contacto para reprogramación inmediata
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {affected.map((apt) => (
              <div key={apt.id} className="bg-white rounded-2xl border border-rose-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-mono font-bold text-rose-700">{apt.code}</span>
                  <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded font-bold text-[11px]">
                    Bloqueo Médico
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-700">
                  <p className="font-bold text-slate-900 text-sm">{apt.patientName}</p>
                  <p><strong>Teléfono:</strong> {apt.patientPhone}</p>
                  <p><strong>Servicio:</strong> {apt.serviceName} con {apt.professionalName}</p>
                  <p><strong>Fecha afectada:</strong> {apt.date} a las {apt.time}</p>
                  <p className="text-slate-500 italic mt-1 bg-slate-50 p-2 rounded">
                    Motivo: "{apt.reason}"
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={`tel:${apt.patientPhone}`}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#244A86]" />
                    <span>Llamar al Paciente</span>
                  </a>
                  <button
                    onClick={() => {
                      setReschedulingApt(apt);
                      const d = new Date(apt.date + 'T12:00:00');
                      d.setDate(d.getDate() + 1);
                      setNewDate(d.toISOString().split('T')[0]);
                      setNewTime('');
                      setError(null);
                    }}
                    className="flex-1 py-2 bg-[#244A86] hover:bg-[#1B3664] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reprogramar Cita</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!reschedulingApt}
        onClose={() => setReschedulingApt(null)}
        title="Reprogramar Cita Afectada"
        subtitle={reschedulingApt?.patientName}
        maxWidth="md"
      >
        {reschedulingApt && (
          <div className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="affected-new-date" className="block font-semibold text-slate-700 mb-1">Nueva Fecha</label>
              <input
                id="affected-new-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setNewTime('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
              />
            </div>

            {newDate && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Nuevo Horario</label>
                {availableSlots.length === 0 ? (
                  <p className="text-slate-500 italic p-3 text-center bg-slate-50 rounded-xl">
                    No hay horarios disponibles en esta fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                    {availableSlots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setNewTime(s.time)}
                        className={`py-1.5 px-2 rounded-lg border text-center font-semibold text-xs ${
                          !s.available
                            ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                            : newTime === s.time
                            ? 'bg-[#244A86] text-white border-[#244A86] ring-1 ring-blue-300'
                            : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReschedulingApt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!newTime}
                onClick={handleConfirmReschedule}
                className={`px-5 py-2 rounded-xl font-bold text-white ${
                  newTime ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Guardar Reprogramación
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
