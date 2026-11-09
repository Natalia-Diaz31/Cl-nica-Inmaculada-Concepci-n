import React, { useState } from 'react';
import { FamilyMember, Patient } from '../../types';
import { ClinicStorage } from '../../services/storage';
import { Users, Plus, Trash2, Heart, ShieldCheck, Check } from 'lucide-react';

interface FamilyMembersManagerProps {
  currentPatient: Patient;
  onPatientUpdated: () => void;
  onBookForMember: (memberId: string) => void;
}

export const FamilyMembersManager: React.FC<FamilyMembersManagerProps> = ({
  currentPatient,
  onPatientUpdated,
  onBookForMember,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState<FamilyMember['relationship']>('Hijo/a');
  const [documentId, setDocumentId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Por favor ingresa el nombre completo del familiar.');
      return;
    }

    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      fullName: fullName.trim(),
      relationship,
      documentId: documentId.trim() || undefined,
      birthDate: birthDate || undefined,
      notes: notes.trim() || undefined,
    };

    const updatedPatient: Patient = {
      ...currentPatient,
      familyMembers: [...currentPatient.familyMembers, newMember],
    };

    ClinicStorage.savePatient(updatedPatient);
    onPatientUpdated();

    // Reset form
    setFullName('');
    setDocumentId('');
    setBirthDate('');
    setNotes('');
    setShowAddForm(false);
    setError(null);
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedPatient: Patient = {
      ...currentPatient,
      familyMembers: currentPatient.familyMembers.filter((f) => f.id !== memberId),
    };
    ClinicStorage.savePatient(updatedPatient);
    onPatientUpdated();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Familiares Registrados</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Agrega a tus familiares para gestionar sus citas médicas desde tu cuenta sin que requieran un teléfono independiente.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 bg-[#244A86] hover:bg-[#1B3664] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Familiar</span>
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddFamilyMember} className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Familiar</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>

          {error && <div className="p-2.5 bg-rose-50 text-rose-800 rounded-lg">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="family-member-fullname" className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
              <input
                id="family-member-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Sofía Elizabeth Pérez"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
              />
            </div>

            <div>
              <label htmlFor="family-member-relationship" className="block font-semibold text-slate-700 mb-1">Parentesco *</label>
              <select
                id="family-member-relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as FamilyMember['relationship'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
              >
                <option value="Hijo/a">Hijo/a</option>
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Cónyuge">Cónyuge</option>
                <option value="Abuelo/a">Abuelo/a</option>
                <option value="Otro familiar">Otro familiar</option>
              </select>
            </div>

            <div>
              <label htmlFor="family-member-doc" className="block font-semibold text-slate-700 mb-1">DUI / Carné de Minoridad (opcional)</label>
              <input
                id="family-member-doc"
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Ej: 05492812-4"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
              />
            </div>

            <div>
              <label htmlFor="family-member-birthdate" className="block font-semibold text-slate-700 mb-1">Fecha de Nacimiento (opcional)</label>
              <input
                id="family-member-birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="family-member-notes" className="block font-semibold text-slate-700 mb-1">Notas de salud o cuidados especiales (opcional)</label>
            <input
              id="family-member-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Hipertensión arterial, alérgico a penicilina, control pediátrico escolar"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#244A86] hover:bg-[#1B3664] text-white font-bold rounded-xl"
            >
              Guardar Familiar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentPatient.familyMembers.length === 0 ? (
          <div className="col-span-2 p-8 text-center bg-white border border-slate-200 rounded-2xl">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No tienes familiares vinculados</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Como responsable de familia puedes registrar a tus hijos, padres o abuelos para agendar sus citas con un solo clic.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-[#244A86] text-white text-xs font-semibold rounded-xl hover:bg-[#1B3664]"
            >
              + Agregar primer familiar
            </button>
          </div>
        ) : (
          currentPatient.familyMembers.map((fam) => (
            <div key={fam.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{fam.fullName}</h4>
                    <span className="inline-block mt-0.5 text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-md">
                      {fam.relationship}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(fam.id)}
                    title="Eliminar familiar"
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-2">
                  {fam.documentId && (
                    <p><strong>Documento:</strong> {fam.documentId}</p>
                  )}
                  {fam.birthDate && (
                    <p><strong>Nacimiento:</strong> {fam.birthDate}</p>
                  )}
                  {fam.notes && (
                    <p className="text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {fam.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-3">
                <button
                  onClick={() => onBookForMember(fam.id)}
                  className="w-full py-2 px-3 bg-[#244A86] hover:bg-[#1B3664] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Reservar cita para {fam.fullName.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
