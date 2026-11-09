import React from 'react';
import { Role } from '../../types';
import { PlusCircle, CalendarPlus, ShieldAlert, Sparkles, Home, User } from 'lucide-react';

interface NavbarProps {
  currentRole: Role;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenBookingModal: () => void;
  onOpenAuthModal?: () => void;
  patientName?: string;
  isSuspended?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onOpenBookingModal,
  onOpenAuthModal,
  patientName,
  isSuspended,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => onTabChange(currentRole === 'paciente' ? 'inicio' : activeTab)}
          className="flex items-center gap-3 shrink-0 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#244A86] group-hover:bg-[#1B3664] text-white flex items-center justify-center font-bold text-xl shadow-md transition-colors">
            ✝
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#244A86] whitespace-nowrap">
              Mi Cita Parroquial
            </span>
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap -mt-0.5">
              Clínica Inmaculada Concepción
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean natural titles) */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600">
          {currentRole === 'paciente' && (
            <>
              <button
                onClick={() => onTabChange('inicio')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'inicio' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => onTabChange('servicios')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'servicios' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Servicios
              </button>
              <button
                onClick={() => onTabChange('mis_citas')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'mis_citas' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Mis Citas
              </button>
              <button
                onClick={() => onTabChange('familiares')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'familiares' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Familiares
              </button>
              <button
                onClick={() => onTabChange('espera')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'espera' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Lista de Espera
              </button>
              <button
                onClick={() => onTabChange('recordatorios')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'recordatorios' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Recordatorios
              </button>
            </>
          )}

          {currentRole === 'recepcion' && (
            <>
              <button
                onClick={() => onTabChange('agenda')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'agenda' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Agenda del Día
              </button>
              <button
                onClick={() => onTabChange('pacientes')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'pacientes' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Directorio y Suspensiones
              </button>
              <button
                onClick={() => onTabChange('espera_recepcion')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'espera_recepcion' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Cupos y Espera
              </button>
              <button
                onClick={() => onTabChange('afectadas')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'afectadas' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Citas Afectadas
              </button>
            </>
          )}

          {currentRole === 'profesional' && (
            <>
              <button
                onClick={() => onTabChange('citas_doctor')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'citas_doctor' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Citas del Día
              </button>
              <button
                onClick={() => onTabChange('horarios_doctor')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'horarios_doctor' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Mi Horario
              </button>
              <button
                onClick={() => onTabChange('bloqueos_doctor')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'bloqueos_doctor' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Bloqueo de Fechas
              </button>
            </>
          )}

          {currentRole === 'admin' && (
            <>
              <button
                onClick={() => onTabChange('reportes_ocupacion')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'reportes_ocupacion' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Reportes y Métricas
              </button>
              <button
                onClick={() => onTabChange('auditoria')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  activeTab === 'auditoria' ? 'text-[#244A86] font-bold border-b-2 border-[#244A86]' : 'hover:text-slate-900'
                }`}
              >
                Auditoría y Trazabilidad
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentRole === 'paciente' && (
            <button
              onClick={onOpenBookingModal}
              disabled={isSuspended}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all whitespace-nowrap ${
                isSuspended
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#244A86] hover:bg-[#1B3664] text-white hover:shadow-md active:scale-95'
              }`}
            >
              {isSuspended ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Bloqueado temporalmente</span>
                </>
              ) : (
                <>
                  <CalendarPlus className="w-4 h-4 text-blue-200" />
                  <span>Reservar Cita</span>
                </>
              )}
            </button>
          )}

          {currentRole === 'recepcion' && (
            <button
              onClick={onOpenBookingModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#244A86] hover:bg-[#1B3664] text-white shadow-xs transition-all whitespace-nowrap active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-blue-200" />
              <span>+ Agendar por Paciente</span>
            </button>
          )}

          {currentRole === 'profesional' && (
            <button
              onClick={() => onTabChange('bloqueos_doctor')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all whitespace-nowrap active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Bloquear Fecha</span>
            </button>
          )}

          {currentRole === 'admin' && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all whitespace-nowrap active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Exportar Reporte</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto border-t border-slate-100 bg-slate-50/90 py-2 px-3 text-xs font-semibold scrollbar-none">
        {currentRole === 'paciente' && (
          <>
            <button
              onClick={() => onTabChange('inicio')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'inicio' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Inicio
            </button>
            <button
              onClick={() => onTabChange('servicios')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'servicios' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Servicios
            </button>
            <button
              onClick={() => onTabChange('mis_citas')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'mis_citas' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Mis Citas
            </button>
            <button
              onClick={() => onTabChange('espera')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'espera' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Espera
            </button>
            <button
              onClick={() => onTabChange('recordatorios')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'recordatorios' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Recordatorios
            </button>
          </>
        )}
        {currentRole === 'recepcion' && (
          <>
            <button
              onClick={() => onTabChange('agenda')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'agenda' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Agenda
            </button>
            <button
              onClick={() => onTabChange('pacientes')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'pacientes' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Pacientes
            </button>
            <button
              onClick={() => onTabChange('afectadas')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'afectadas' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Afectadas
            </button>
          </>
        )}
        {currentRole === 'profesional' && (
          <>
            <button
              onClick={() => onTabChange('citas_doctor')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'citas_doctor' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Citas
            </button>
            <button
              onClick={() => onTabChange('horarios_doctor')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'horarios_doctor' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Horario
            </button>
            <button
              onClick={() => onTabChange('bloqueos_doctor')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'bloqueos_doctor' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Bloqueos
            </button>
          </>
        )}
        {currentRole === 'admin' && (
          <>
            <button
              onClick={() => onTabChange('reportes_ocupacion')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'reportes_ocupacion' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Reportes
            </button>
            <button
              onClick={() => onTabChange('auditoria')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'auditoria' ? 'bg-[#244A86] text-white font-bold' : 'text-slate-600'}`}
            >
              Auditoría
            </button>
          </>
        )}
      </div>
    </header>
  );
};
