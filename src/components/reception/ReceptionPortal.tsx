import React, { useState } from 'react';
import { Appointment, HealthcareProfessional, Patient, WaitlistEntry } from '../../types';
import { DailyAgenda } from './DailyAgenda';
import { PatientDirectory } from './PatientDirectory';
import { AffectedAppointmentsQueue } from './AffectedAppointmentsQueue';
import { AssistedBookingModal } from './AssistedBookingModal';
import { ClinicStorage } from '../../services/storage';
import {
  Calendar,
  Users,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
} from 'lucide-react';

interface ReceptionPortalProps {
  appointments: Appointment[];
  professionals: HealthcareProfessional[];
  patients: Patient[];
  waitlist: WaitlistEntry[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDataUpdated: () => void;
  isAssistedBookingOpen: boolean;
  setIsAssistedBookingOpen: (open: boolean) => void;
}

export const ReceptionPortal: React.FC<ReceptionPortalProps> = ({
  appointments,
  professionals,
  patients,
  waitlist,
  activeTab,
  onTabChange,
  onDataUpdated,
  isAssistedBookingOpen,
  setIsAssistedBookingOpen,
}) => {
  const affectedCount = appointments.filter((a) => a.status === 'afectada_bloqueo').length;
  const suspendedCount = patients.filter((p) => p.isSuspended).length;
  const waitingCount = waitlist.filter((w) => w.status === 'esperando').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Receptionist Quick KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => onTabChange('agenda')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTab === 'agenda' ? 'bg-blue-50 border-[#244A86] ring-1 ring-[#244A86]' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-slate-500 block">Citas de Hoy</span>
          <span className="text-lg font-bold text-slate-900 font-mono">
            {appointments.filter((a) => a.date === new Date().toISOString().split('T')[0]).length}
          </span>
        </button>

        <button
          onClick={() => onTabChange('pacientes')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTab === 'pacientes' ? 'bg-blue-50 border-[#244A86] ring-1 ring-[#244A86]' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-slate-500 block">Pacientes Suspendidos</span>
          <span className="text-lg font-bold text-amber-700 font-mono">
            {suspendedCount} {suspendedCount > 0 && '⚠️'}
          </span>
        </button>

        <button
          onClick={() => onTabChange('espera_recepcion')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTab === 'espera_recepcion' ? 'bg-blue-50 border-[#244A86] ring-1 ring-[#244A86]' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-slate-500 block">En Lista de Espera</span>
          <span className="text-lg font-bold text-slate-800 font-mono">
            {waitingCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange('afectadas')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTab === 'afectadas' ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-300' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-slate-500 block">Bloqueos / Por Reprogramar</span>
          <span className="text-lg font-bold text-rose-700 font-mono">
            {affectedCount} {affectedCount > 0 && '🚨'}
          </span>
        </button>
      </div>

      {/* Main View Router */}
      {activeTab === 'agenda' && (
        <DailyAgenda
          appointments={appointments}
          professionals={professionals}
          patients={patients}
          onDataUpdated={onDataUpdated}
          onOpenAssistedBooking={() => setIsAssistedBookingOpen(true)}
        />
      )}

      {activeTab === 'pacientes' && (
        <PatientDirectory
          patients={patients}
          onDataUpdated={onDataUpdated}
        />
      )}

      {activeTab === 'afectadas' && (
        <AffectedAppointmentsQueue
          appointments={appointments}
          professionals={professionals}
          patients={patients}
          onDataUpdated={onDataUpdated}
        />
      )}

      {activeTab === 'espera_recepcion' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Gestión de Lista de Espera en Recepción
              </h2>
              <p className="text-slate-500 mt-0.5">
                Solicitudes de pacientes ordenadas cronológicamente por antigüedad para asignación de cupos liberados.
              </p>
            </div>
            <span className="font-mono text-slate-500">{waitlist.length} solicitudes en registro</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Antigüedad / Registro</th>
                  <th className="py-2.5 px-3">Paciente</th>
                  <th className="py-2.5 px-3">Teléfono</th>
                  <th className="py-2.5 px-3">Servicio Solicitado</th>
                  <th className="py-2.5 px-3">Fecha Preferida</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitlist.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {new Date(w.requestedAt).toLocaleString('es-SV')}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {w.patientName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {w.patientPhone}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#244A86]">
                      {w.serviceName}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {w.preferredDate || 'Cualquier fecha libre'}
                    </td>
                    <td className="py-3 px-3">
                      {w.status === 'cupo_ofrecido' && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                          Cupo Ofrecido
                        </span>
                      )}
                      {w.status === 'esperando' && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                          En Espera
                        </span>
                      )}
                      {w.status === 'aceptado' && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          Aceptado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={`tel:${w.patientPhone}`}
                        className="inline-flex items-center gap-1 text-[#244A86] hover:underline font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Llamar</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assisted Booking Modal */}
      <AssistedBookingModal
        isOpen={isAssistedBookingOpen}
        onClose={() => setIsAssistedBookingOpen(false)}
        patients={patients}
        professionals={professionals}
        appointments={appointments}
        onBookingCompleted={() => onDataUpdated()}
        onPatientCreated={() => onDataUpdated()}
      />
    </div>
  );
};
