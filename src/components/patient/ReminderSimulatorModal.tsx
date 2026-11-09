import React, { useState } from 'react';
import { Appointment } from '../../types';
import { ClinicStorage } from '../../services/storage';
import { RulesEngine } from '../../services/rulesEngine';
import { Modal } from '../common/Modal';
import { MessageSquare, Bell, CheckCircle2, XCircle, Phone, Clock, MapPin, Sparkles } from 'lucide-react';

interface ReminderSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onReminderActionComplete: () => void;
}

export const ReminderSimulatorModal: React.FC<ReminderSimulatorModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onReminderActionComplete,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [reminderType, setReminderType] = useState<'24h' | '2h'>('24h');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!appointment) return null;

  const cancelCheck = RulesEngine.canPatientCancelOrReschedule(appointment);

  const handleConfirmAttendance = () => {
    const updated: Appointment = {
      ...appointment,
      status: 'confirmada',
      reminderStatus: 'confirmada',
      auditLogs: [
        ...appointment.auditLogs,
        {
          timestamp: new Date().toISOString(),
          actor: appointment.patientName,
          role: 'paciente',
          action: 'Asistencia confirmada vía recordatorio',
          details: `Confirmó asistencia mediante recordatorio simulado (${reminderType})`,
        },
      ],
    };

    ClinicStorage.saveAppointment(updated);
    setActionFeedback('¡Gracias! Tu asistencia ha sido confirmada con éxito. Recepción y tu médico ya pueden ver tu confirmación.');
    setTimeout(() => {
      onReminderActionComplete();
      setActionFeedback(null);
      onClose();
    }, 1800);
  };

  const handleCannotAttend = () => {
    if (cancelCheck.allowed) {
      // Allowed to cancel
      const updated: Appointment = {
        ...appointment,
        status: 'cancelada',
        canceledAt: new Date().toISOString(),
        canceledBy: 'paciente',
        cancelReason: 'Paciente notificó que no podrá asistir mediante recordatorio',
        reminderStatus: 'rechazada',
        auditLogs: [
          ...appointment.auditLogs,
          {
            timestamp: new Date().toISOString(),
            actor: appointment.patientName,
            role: 'paciente',
            action: 'Cancelación vía recordatorio',
            details: 'Notificó que no asistirá con más de 24h. Cupo liberado.',
          },
        ],
      };

      ClinicStorage.saveAppointment(updated);
      RulesEngine.checkAndOfferWaitlistSlot(appointment);

      setActionFeedback('Tu cita ha sido cancelada y el cupo se ha puesto a disposición de otros pacientes de la parroquia.');
      setTimeout(() => {
        onReminderActionComplete();
        setActionFeedback(null);
        onClose();
      }, 2000);
    } else {
      // Under 24 hours - instruct to call reception (HU-17 Escenario 2)
      setActionFeedback('Faltan menos de 24 horas para tu consulta. Por favor comunícate directamente con recepción al 2257-8900 para notificar tu imprevisto.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulador de Mensajería y Recordatorios"
      subtitle="Prueba cómo el paciente recibe y responde sus recordatorios de 24 h y 2 h"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Toggle between 24h and 2h reminder */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setReminderType('24h');
              setActionFeedback(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              reminderType === '24h'
                ? 'bg-white text-[#244A86] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recordatorio de 24 Horas
          </button>
          <button
            type="button"
            onClick={() => {
              setReminderType('2h');
              setActionFeedback(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              reminderType === '2h'
                ? 'bg-white text-[#244A86] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recordatorio de 2 Horas
          </button>
        </div>

        {/* Simulated Phone Screen mockup */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-3 font-sans">
          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Parroquial (+503 7845-1234)
            </span>
            <span className="font-mono text-[10px]">
              {reminderType === '24h' ? '24 horas antes' : '2 horas antes'}
            </span>
          </div>

          {/* Incoming message bubble */}
          <div className="bg-emerald-950/70 border border-emerald-800/60 rounded-xl p-3 text-slate-100 space-y-2">
            <p className="font-bold text-white text-xs">
              Estimado/a {appointment.patientName}:
            </p>
            <p className="text-[11px] leading-relaxed text-slate-200">
              {reminderType === '24h'
                ? 'Le recordamos su cita programada para el día de mañana en la Clínica Parroquial Inmaculada Concepción.'
                : 'Su cita médica parroquial es hoy dentro de 2 horas. Recuerde presentarse 10 minutos antes en recepción.'}
            </p>

            <div className="bg-black/40 p-2.5 rounded-lg space-y-1 text-[11px] font-mono border border-emerald-700/30">
              <p><span className="text-emerald-300">Servicio:</span> {appointment.serviceName}</p>
              <p><span className="text-emerald-300">Profesional:</span> {appointment.professionalName}</p>
              <p><span className="text-emerald-300">Fecha/Hora:</span> {appointment.date} · {appointment.time}</p>
              <p><span className="text-emerald-300">Lugar:</span> {appointment.building} ({appointment.room})</p>
            </div>

            <p className="text-[10px] text-emerald-300 italic pt-1">
              Por favor responda utilizando una de las opciones a continuación:
            </p>
          </div>

          {/* Interactive buttons simulating patient response */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleConfirmAttendance}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar asistencia</span>
            </button>

            <button
              onClick={handleCannotAttend}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-rose-300 font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>No podré asistir</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs animate-in fade-in">
            {actionFeedback}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
          >
            Cerrar Simulador
          </button>
        </div>
      </div>
    </Modal>
  );
};
