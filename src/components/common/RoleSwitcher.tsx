import React, { useState } from 'react';
import { Role, Patient, HealthcareProfessional, FigmaScreenId, FIGMA_SCREENS } from '../../types';
import {
  RotateCcw,
  User,
  ClipboardList,
  Stethoscope,
  BarChart3,
  AlertTriangle,
  Monitor,
  Smartphone,
  ChevronDown,
  Layers,
  X,
} from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  patients: Patient[];
  currentPatientId: string;
  onPatientChange: (patientId: string) => void;
  professionals: HealthcareProfessional[];
  currentProfessionalId: string;
  onProfessionalChange: (profId: string) => void;
  onResetData: () => void;
  activeScreenId: FigmaScreenId;
  onNavigateScreen: (screenId: FigmaScreenId) => void;
  deviceMode: 'desktop' | 'mobile';
  onToggleDeviceMode: (mode: 'desktop' | 'mobile') => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
  patients,
  currentPatientId,
  onPatientChange,
  professionals,
  currentProfessionalId,
  onProfessionalChange,
  onResetData,
  activeScreenId,
  onNavigateScreen,
  deviceMode,
  onToggleDeviceMode,
}) => {
  const [showFigmaMenu, setShowFigmaMenu] = useState(false);
  const [showAcademicNavigator, setShowAcademicNavigator] = useState(false);
  const currentPatient = patients.find((p) => p.id === currentPatientId);

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-3 sm:px-4 shadow-inner no-print z-50 relative">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        
        {/* Left: Device Switcher + Roles */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Discrete Computadora / Celular Selector */}
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => onToggleDeviceMode('desktop')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-[#244A86] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Computadora (Escritorio)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Computadora</span>
            </button>
            <button
              onClick={() => onToggleDeviceMode('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-[#244A86] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Celular (Figma 390 px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Celular</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block mx-1" />

          {/* Role selector buttons */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onRoleChange('paciente')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                currentRole === 'paciente'
                  ? 'bg-[#244A86] text-white shadow-sm ring-1 ring-blue-400/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-300" />
              <span>Paciente</span>
            </button>

            <button
              onClick={() => onRoleChange('recepcion')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                currentRole === 'recepcion'
                  ? 'bg-[#244A86] text-white shadow-sm ring-1 ring-blue-400/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-300" />
              <span>Recepción</span>
            </button>

            <button
              onClick={() => onRoleChange('profesional')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                currentRole === 'profesional'
                  ? 'bg-[#244A86] text-white shadow-sm ring-1 ring-blue-400/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-300" />
              <span>Profesional</span>
            </button>

            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                currentRole === 'admin'
                  ? 'bg-[#244A86] text-white shadow-sm ring-1 ring-blue-400/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-300" />
              <span>Admin</span>
            </button>
          </div>

          {/* Academic Screen Navigator: HIDDEN BY DEFAULT */}
          {!showAcademicNavigator ? (
            <button
              onClick={() => setShowAcademicNavigator(true)}
              className="flex items-center gap-1.5 px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-md text-[11px] transition-colors border border-dashed border-slate-700/80"
              title="Activar selector de demostración para evaluación"
            >
              <Layers className="w-3 h-3 text-blue-400" />
              <span>Modo Demostración</span>
            </button>
          ) : (
            <div className="relative flex items-center gap-1 bg-blue-950/70 p-0.5 rounded-lg border border-blue-700/50">
              <button
                onClick={() => setShowFigmaMenu(!showFigmaMenu)}
                className="flex items-center gap-1.5 px-2 py-1 bg-blue-900/60 hover:bg-blue-800 border border-blue-600/40 text-blue-200 font-bold rounded-md transition-all shadow-xs text-[11px]"
                title="Seleccionar pantalla específica"
              >
                <Layers className="w-3 h-3 text-blue-300" />
                <span>Navegador: <span className="text-white font-mono">{activeScreenId}</span></span>
                <ChevronDown className="w-3 h-3 text-blue-300" />
              </button>

              <button
                onClick={() => {
                  setShowAcademicNavigator(false);
                  setShowFigmaMenu(false);
                }}
                className="p-1 text-blue-300 hover:text-white hover:bg-blue-800/60 rounded"
                title="Ocultar modo demostración"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Dropdown Menu of prototype screens */}
              {showFigmaMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFigmaMenu(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-80 sm:w-96 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-2.5 max-h-[70vh] overflow-y-auto divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2">
                    <div className="pb-2 px-2 flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-bold uppercase tracking-wider text-slate-300">
                        Navegador de Demostración
                      </span>
                      <button
                        onClick={() => setShowFigmaMenu(false)}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        Cerrar
                      </button>
                    </div>
                    <div className="pt-1.5 space-y-1">
                      {FIGMA_SCREENS.map((scr) => (
                        <button
                          key={scr.id}
                          onClick={() => {
                            onNavigateScreen(scr.id);
                            setShowFigmaMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
                            activeScreenId === scr.id
                              ? 'bg-[#244A86] text-white shadow-xs font-semibold'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-black/30 shrink-0">
                            {scr.id}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{scr.name}</span>
                              <span className="text-[10px] text-slate-400 capitalize">{scr.role}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{scr.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Simulation Context & Reset */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {currentRole === 'paciente' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 hidden xl:inline">Simular como:</span>
              <select
                value={currentPatientId}
                onChange={(e) => onPatientChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} {p.isSuspended ? '⚠️ (Suspendido)' : p.unexcusedAbsencesCount > 0 ? `(${p.unexcusedAbsencesCount} faltas)` : ''}
                  </option>
                ))}
              </select>
              {currentPatient?.isSuspended && (
                <span className="flex items-center gap-1 text-amber-300 font-semibold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Suspendido online
                </span>
              )}
            </div>
          )}

          {currentRole === 'profesional' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 hidden xl:inline">Especialista:</span>
              <select
                value={currentProfessionalId}
                onChange={(e) => onProfessionalChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
              >
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} ({prof.serviceName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentRole === 'recepcion' && (
            <div className="text-slate-300 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span>Carmen Menjívar (Ventanilla)</span>
            </div>
          )}

          {currentRole === 'admin' && (
            <div className="text-slate-300 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
              <span>Dirección Médica</span>
            </div>
          )}

          <button
            onClick={onResetData}
            title="Restablecer todos los datos iniciales y citas de demostración"
            className="flex items-center gap-1 text-slate-400 hover:text-rose-300 hover:bg-slate-800 px-2 py-1 rounded transition-colors text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
