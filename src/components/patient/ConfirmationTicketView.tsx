import React, { useState } from 'react';
import { Appointment } from '../../types';
import { CheckCircle2, Calendar, Clock, MapPin, User, Printer, ArrowLeft, Bell, Share2, Copy, Check } from 'lucide-react';

interface ConfirmationTicketViewProps {
  appointment: Appointment;
  onGoToMyAppointments: () => void;
  onGoToHome: () => void;
  onOpenReminderModal: () => void;
}

export const ConfirmationTicketView: React.FC<ConfirmationTicketViewProps> = ({
  appointment,
  onGoToMyAppointments,
  onGoToHome,
  onOpenReminderModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handlePrintTicket = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appointment.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4 space-y-6 animate-in zoom-in-95 duration-200">
      {/* Top Success Badge */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          ¡Cita Agendada Exitosamente!
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Tu reserva ha sido registrada en el sistema central de la Clínica Parroquial Inmaculada Concepción.
        </p>
      </div>

      {/* Ticket / Voucher Card matching Figma */}
      <div className="bg-white rounded-3xl border-2 border-blue-200 shadow-xl overflow-hidden relative">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-[#244A86] to-[#1B3664] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-lg border border-white/20">
              ✝
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-200 block">Comprobante de Cita Médica</span>
              <h3 className="font-extrabold text-base tracking-tight">{appointment.serviceName}</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Código Único</span>
            <button
              onClick={handleCopyCode}
              title="Copiar código de cita"
              className="inline-flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <span>{appointment.code}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-blue-200" />}
            </button>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Paciente / Beneficiario
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {appointment.isForFamilyMember ? appointment.familyMemberName : appointment.patientName}
              </p>
              {appointment.isForFamilyMember && (
                <span className="inline-block mt-0.5 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                  Familiar ({appointment.familyMemberRelationship}) · Titular: {appointment.patientName}
                </span>
              )}
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Profesional Asignado
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {appointment.professionalName}
              </p>
              <span className="text-[11px] text-slate-500">{appointment.room}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Fecha de Consulta
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#244A86]" />
                <span>{appointment.date}</span>
              </p>
              <span className="text-[11px] text-slate-500">Duración: {appointment.durationMinutes} min</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Hora y Ubicación
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#244A86]" />
                <span>{appointment.time}</span>
              </p>
              <span className="text-[11px] font-semibold text-[#244A86]">
                {appointment.building}
              </span>
            </div>
          </div>

          {/* Motivo de consulta */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Motivo de consulta registrado:</span>
            <p className="text-slate-800 italic mt-0.5">"{appointment.reason}"</p>
          </div>

          {/* Cancellation deadline banner */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 text-[11px] text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#244A86]" />
              <span>Plazo Límite de Cancelación en Línea:</span>
            </div>
            <p className="leading-relaxed">
              Puedes cancelar o reprogramar tu cita en línea sin penalización hasta 24 horas antes de la consulta. Si requieres un cambio con menor tiempo, comunícate con recepción al <strong>(503) 2257-8900</strong>.
            </p>
          </div>
        </div>

        {/* Ticket Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print">
          <button
            onClick={handlePrintTicket}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#244A86]" />
            <span>Imprimir Comprobante</span>
          </button>

          <button
            onClick={onOpenReminderModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold text-[#244A86] transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Ver Notificación Simulada</span>
          </button>

          <button
            onClick={onGoToMyAppointments}
            className="px-4 py-2 bg-[#244A86] hover:bg-[#1B3664] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            Ir a Mis Citas
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onGoToHome}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la Pantalla de Inicio</span>
        </button>
      </div>
    </div>
  );
};
