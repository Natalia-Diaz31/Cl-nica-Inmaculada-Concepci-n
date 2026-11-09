import React, { useState } from 'react';
import { Patient } from '../../types';
import { ClinicStorage } from '../../services/storage';
import { Modal } from '../common/Modal';
import {
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
  UserX,
  History,
} from 'lucide-react';

interface PatientDirectoryProps {
  patients: Patient[];
  onDataUpdated: () => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  patients,
  onDataUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSuspendedOnly, setFilterSuspendedOnly] = useState(false);

  // Lift Suspension Modal State (HU-18)
  const [selectedPatientForLift, setSelectedPatientForLift] = useState<Patient | null>(null);
  const [justificationReason, setJustificationReason] = useState('');
  const [liftError, setLiftError] = useState<string | null>(null);

  // View Patient History Modal
  const [viewingPatientHistory, setViewingPatientHistory] = useState<Patient | null>(null);

  const filteredPatients = patients.filter((p) => {
    if (filterSuspendedOnly && !p.isSuspended) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(term) ||
      p.documentId.includes(term) ||
      p.phone.includes(term)
    );
  });

  // Handle Lift Suspension (HU-18)
  const handleConfirmLiftSuspension = () => {
    setLiftError(null);

    // Validation: Escenario 2 HU-18
    if (!justificationReason.trim()) {
      setLiftError('Escribe el motivo');
      return;
    }

    if (!selectedPatientForLift) return;

    const updated: Patient = {
      ...selectedPatientForLift,
      isSuspended: false,
      suspensionReason: undefined,
      suspensionDate: undefined,
      // Reset unexcused count or keep history for audit
      unexcusedAbsencesCount: 0,
    };

    ClinicStorage.savePatient(updated);

    ClinicStorage.addNotification({
      type: 'suspension',
      title: `Suspensión levantada: ${updated.fullName}`,
      message: `Recepción levantó la suspensión con justificación: "${justificationReason.trim()}". El paciente puede volver a agendar en línea.`,
      patientName: updated.fullName,
      patientPhone: updated.phone,
      actionRequired: false,
    });

    setSelectedPatientForLift(null);
    setJustificationReason('');
    setLiftError(null);
    onDataUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Directorio de Pacientes y Control de Suspensiones</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta historial de ausencias, supervisa suspensiones por inasistencias y levanta bloqueos con justificación médica o parroquial.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, DUI (ej: 01928374-9) o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
          />
        </div>

        <button
          onClick={() => setFilterSuspendedOnly(!filterSuspendedOnly)}
          className={`px-3.5 py-2 rounded-xl font-semibold border transition-all whitespace-nowrap ${
            filterSuspendedOnly
              ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-300'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {filterSuspendedOnly ? 'Mostrando solo suspendidos' : 'Filtrar solo suspendidos'}
        </button>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Documento (DUI)</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4 text-center">Inasistencias (6 meses)</th>
                <th className="py-3 px-4">Estado de Agendamiento</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron pacientes registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{patient.fullName}</div>
                      {patient.familyMembers.length > 0 && (
                        <div className="text-[11px] text-slate-400">
                          {patient.familyMembers.length} familiares vinculados
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {patient.documentId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {patient.phone}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          patient.unexcusedAbsencesCount >= 3
                            ? 'bg-rose-100 text-rose-800'
                            : patient.unexcusedAbsencesCount > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {patient.unexcusedAbsencesCount} faltas
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {patient.isSuspended ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded font-bold text-[11px] inline-flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          Suspendido en Línea
                        </span>
                      ) : (
                        <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-medium text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Activo / Al Día
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingPatientHistory(patient)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                          title="Ver historial de inasistencias"
                        >
                          Historial
                        </button>

                        {patient.isSuspended && (
                          <button
                            onClick={() => {
                              setSelectedPatientForLift(patient);
                              setJustificationReason('');
                              setLiftError(null);
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shadow-2xs"
                            title="Levantar suspensión"
                          >
                            Levantar Suspensión
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Levantar Suspensión (HU-18) */}
      <Modal
        isOpen={!!selectedPatientForLift}
        onClose={() => setSelectedPatientForLift(null)}
        title="Levantar Suspensión de Agendamiento"
        subtitle="Habilitar nuevamente las reservas en línea para casos justificados"
        maxWidth="md"
      >
        {selectedPatientForLift && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
              <p className="font-bold">Paciente: {selectedPatientForLift.fullName}</p>
              <p className="text-[11px] mt-0.5">DUI: {selectedPatientForLift.documentId} · Tel: {selectedPatientForLift.phone}</p>
              {selectedPatientForLift.suspensionReason && (
                <p className="text-[11px] mt-1 italic">
                  Motivo de suspensión previo: {selectedPatientForLift.suspensionReason}
                </p>
              )}
            </div>

            {liftError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold">
                {liftError}
              </div>
            )}

            <div>
              <label htmlFor="lift-suspension-reason" className="block font-semibold text-slate-700 mb-1">
                Motivo / Justificación de Reactivación *
              </label>
              <textarea
                id="lift-suspension-reason"
                rows={3}
                required
                value={justificationReason}
                onChange={(e) => {
                  setJustificationReason(e.target.value);
                  setLiftError(null);
                }}
                placeholder="Escribe el motivo de la justificación (ej. Paciente presentó constancia médica de hospitalización o justificación de fuerza mayor en ventanilla)..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                La justificación queda registrada con tu usuario para fines de auditoría parroquial.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPatientForLift(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLiftSuspension}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
              >
                Confirmar y Levantar Suspensión
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: View History */}
      <Modal
        isOpen={!!viewingPatientHistory}
        onClose={() => setViewingPatientHistory(null)}
        title="Historial de Asistencias y Ausencias"
        subtitle={viewingPatientHistory?.fullName}
        maxWidth="md"
      >
        {viewingPatientHistory && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{viewingPatientHistory.fullName}</p>
                <p className="text-slate-500">DUI: {viewingPatientHistory.documentId}</p>
              </div>
              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                {viewingPatientHistory.absenceHistory.length} inasistencias históricas
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">Registro de Inasistencias Registradas</h4>
              {viewingPatientHistory.absenceHistory.length === 0 ? (
                <p className="text-slate-500 italic p-4 text-center bg-slate-50 rounded-xl">
                  Este paciente no tiene inasistencias registradas.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden">
                  {viewingPatientHistory.absenceHistory.map((abs) => (
                    <div key={abs.id} className="p-3 flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900">{abs.serviceName}</span>
                        <p className="text-slate-500 mt-0.5">Fecha de cita: {abs.date}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Registrado por: {abs.markedBy}</p>
                      </div>
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
                        No asistió
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingPatientHistory(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
