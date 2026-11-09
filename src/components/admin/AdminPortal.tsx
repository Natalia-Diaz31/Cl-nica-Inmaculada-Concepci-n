import React, { useState } from 'react';
import { Appointment, HealthcareProfessional, Patient } from '../../types';
import { CLINIC_SERVICES } from '../../services/storage';
import {
  BarChart3,
  TrendingUp,
  UserX,
  Calendar,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building,
  Sparkles,
} from 'lucide-react';

interface AdminPortalProps {
  appointments: Appointment[];
  professionals: HealthcareProfessional[];
  patients: Patient[];
  activeTab: string;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  appointments,
  professionals,
  patients,
  activeTab,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'all'>('month');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState<string>('all');

  // Filter appointments by selected period
  const filterByPeriod = (apt: Appointment): boolean => {
    if (selectedPeriod === 'all') return true;

    const aptDate = new Date(apt.date + 'T12:00:00');
    const now = new Date(); // simulated current date: Nov 8, 2026

    if (selectedPeriod === 'today') {
      return apt.date === now.toISOString().split('T')[0];
    }

    if (selectedPeriod === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneWeekFuture = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return aptDate >= oneWeekAgo && aptDate <= oneWeekFuture;
    }

    if (selectedPeriod === 'month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysFuture = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return aptDate >= thirtyDaysAgo && aptDate <= thirtyDaysFuture;
    }

    if (selectedPeriod === 'quarter') {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const ninetyDaysFuture = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      return aptDate >= ninetyDaysAgo && aptDate <= ninetyDaysFuture;
    }

    return true;
  };

  const periodAppointments = appointments.filter((a) => {
    if (!filterByPeriod(a)) return false;
    if (selectedServiceFilter !== 'all' && a.serviceId !== selectedServiceFilter) return false;
    if (selectedProfessionalFilter !== 'all' && a.professionalId !== selectedProfessionalFilter) return false;
    return true;
  });

  // Calculate metrics
  const totalPeriodApts = periodAppointments.length;
  const attendedCount = periodAppointments.filter((a) => a.status === 'atendida').length;
  const noShowCount = periodAppointments.filter((a) => a.status === 'inasistencia').length;
  const scheduledCount = periodAppointments.filter((a) => a.status === 'programada' || a.status === 'confirmada' || a.status === 'en_espera').length;
  const canceledCount = periodAppointments.filter((a) => a.status === 'cancelada').length;
  const affectedCount = periodAppointments.filter((a) => a.status === 'afectada_bloqueo').length;

  // Rates
  const resolvedAppointments = attendedCount + noShowCount;
  const attendanceRate = resolvedAppointments > 0 ? Math.round((attendedCount / resolvedAppointments) * 100) : 100;
  const noShowRate = resolvedAppointments > 0 ? Math.round((noShowCount / resolvedAppointments) * 100) : 0;
  const estimatedOccupancy = totalPeriodApts > 0 ? Math.min(100, Math.round(((totalPeriodApts - canceledCount) / Math.max(totalPeriodApts, 1)) * 100)) : 0;

  // Breakdown by Service
  const serviceBreakdown = CLINIC_SERVICES.map((srv) => {
    const srvApts = periodAppointments.filter((a) => a.serviceId === srv.id);
    const srvAttended = srvApts.filter((a) => a.status === 'atendida').length;
    const srvNoShow = srvApts.filter((a) => a.status === 'inasistencia').length;
    const srvCanceled = srvApts.filter((a) => a.status === 'cancelada').length;
    const srvTotal = srvApts.length;
    const resolved = srvAttended + srvNoShow;
    const srvNoShowPct = resolved > 0 ? Math.round((srvNoShow / resolved) * 100) : 0;

    return {
      service: srv,
      total: srvTotal,
      attended: srvAttended,
      noShow: srvNoShow,
      canceled: srvCanceled,
      noShowPct: srvNoShowPct,
    };
  });

  // Breakdown by Professional
  const professionalBreakdown = professionals.map((prof) => {
    const profApts = periodAppointments.filter((a) => a.professionalId === prof.id);
    const profAttended = profApts.filter((a) => a.status === 'atendida').length;
    const profNoShow = profApts.filter((a) => a.status === 'inasistencia').length;
    const profTotal = profApts.length;
    const resolved = profAttended + profNoShow;
    const profNoShowPct = resolved > 0 ? Math.round((profNoShow / resolved) * 100) : 0;

    return {
      professional: prof,
      total: profTotal,
      attended: profAttended,
      noShow: profNoShow,
      noShowPct: profNoShowPct,
    };
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Código', 'Fecha', 'Hora', 'Servicio', 'Profesional', 'Paciente', 'Teléfono', 'Edificio', 'Estado', 'Canal'];
    const rows = periodAppointments.map((a) => [
      a.code,
      a.date,
      a.time,
      `"${a.serviceName}"`,
      `"${a.professionalName}"`,
      `"${a.patientName}"`,
      a.patientPhone,
      `"${a.building}"`,
      a.status,
      a.channel,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_citas_clinica_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Collect all audit logs (RNF-07)
  const allAuditLogs = appointments
    .flatMap((a) => a.auditLogs.map((log) => ({ ...log, appointmentCode: a.code, service: a.serviceName })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Export controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Dirección y Reportes Administrativos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de ocupación, índice de inasistencias por servicio y profesional, y registro de trazabilidad.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto no-print">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-blue-300" />
            <span>Exportar a PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (no-print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs no-print">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Período de Análisis</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana (± 7 días)</option>
            <option value="month">Este mes (± 30 días)</option>
            <option value="quarter">Trimestre (± 90 días)</option>
            <option value="all">Todo el historial</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Filtrar por Servicio</label>
          <select
            value={selectedServiceFilter}
            onChange={(e) => setSelectedServiceFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
          >
            <option value="all">Todos los servicios</option>
            {CLINIC_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Filtrar por Profesional</label>
          <select
            value={selectedProfessionalFilter}
            onChange={(e) => setSelectedProfessionalFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
          >
            <option value="all">Todos los profesionales</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {totalPeriodApts === 0 ? (
        /* HU-14 Escenario 2: "No hay datos en este periodo" */
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No hay datos en este periodo</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No se registran citas para el rango de fechas seleccionado. Puedes cambiar el filtro a "Este mes" o "Todo el historial".
          </p>
        </div>
      ) : (
        <>
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Citas Totales</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#244A86] font-mono tabular-nums">
                  {totalPeriodApts}
                </span>
                <span className="text-[11px] text-slate-500">en el período</span>
              </div>
              <p className="text-[11px] text-slate-600 pt-1">
                {scheduledCount} activas / {attendedCount} atendidas
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tasa de Ocupación</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono tabular-nums">
                  {estimatedOccupancy}%
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">cupos aprovechados</span>
              </div>
              <p className="text-[11px] text-slate-600 pt-1">
                {canceledCount} cancelaciones liberadas
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tasa de Inasistencias</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                  noShowRate > 20 ? 'text-rose-600' : 'text-amber-600'
                }`}>
                  {noShowRate}%
                </span>
                <span className="text-[11px] text-slate-500">({noShowCount} ausencias)</span>
              </div>
              <p className="text-[11px] text-slate-600 pt-1">
                {patients.filter((p) => p.isSuspended).length} pacientes suspendidos por faltas
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Efectividad Asistencia</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tabular-nums">
                  {attendanceRate}%
                </span>
                <span className="text-[11px] text-slate-500">presentes</span>
              </div>
              <p className="text-[11px] text-slate-600 pt-1">
                {affectedCount} afectadas por bloqueos
              </p>
            </div>
          </div>

          {/* Breakdown by Service Table (HU-14 Escenario 1) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Desglose de Indicadores por Servicio Clínico
                </h3>
                <p className="text-[11px] text-slate-500">
                  Calculado para Medicina General, Medicina Interna, Fisioterapia y Enfermería
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Servicio</th>
                    <th className="py-3 px-4 text-center">Citas Programadas</th>
                    <th className="py-3 px-4 text-center">Atendidas</th>
                    <th className="py-3 px-4 text-center">Inasistencias</th>
                    <th className="py-3 px-4 text-center">% Inasistencia</th>
                    <th className="py-3 px-4 text-center">Canceladas / Liberadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceBreakdown.map((row) => (
                    <tr key={row.service.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {row.service.name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium">
                        {row.total}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-700 font-bold">
                        {row.attended}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-rose-700 font-bold">
                        {row.noShow}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          row.noShowPct > 20 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {row.noShowPct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {row.canceled}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Breakdown by Professional Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Desglose de Desempeño por Profesional de Salud
              </h3>
              <p className="text-[11px] text-slate-500">
                Control de ocupación y cumplimiento de citas por médico y terapeuta
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Profesional</th>
                    <th className="py-3 px-4">Especialidad / Servicio</th>
                    <th className="py-3 px-4 text-center">Citas Asignadas</th>
                    <th className="py-3 px-4 text-center">Atendidas</th>
                    <th className="py-3 px-4 text-center">Inasistencias</th>
                    <th className="py-3 px-4 text-center">% Inasistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {professionalBreakdown.map((row) => (
                    <tr key={row.professional.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {row.professional.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {row.professional.serviceName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium">
                        {row.total}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-700 font-bold">
                        {row.attended}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-rose-700 font-bold">
                        {row.noShow}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-bold">{row.noShowPct}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Audit Trail & Traceability Table */}
      {activeTab === 'auditoria' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
          <div className="p-4 sm:px-6 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Registro de Auditoría y Trazabilidad
            </h3>
            <p className="text-[11px] text-slate-500">
              Trazabilidad completa: Cada cambio de cita guarda usuario responsable, fecha, hora y acción.
            </p>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Fecha y Hora</th>
                  <th className="py-2.5 px-4">Cita</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Rol</th>
                  <th className="py-2.5 px-4">Acción</th>
                  <th className="py-2.5 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {allAuditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-SV')}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#244A86]">
                      {log.appointmentCode}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                      {log.actor}
                    </td>
                    <td className="py-2.5 px-4 uppercase text-[10px] text-slate-600 font-bold">
                      {log.role}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-600 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
