import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatBRL } from '../components/Shared';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrainerPlans() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', sessions_per_week: 2, price: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { loadPlans(); }, []);

async function loadPlans() {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('trainer_id', profile.id)
      .eq('active', true)
      .order('sessions_per_week');
    setPlans(data || []);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function startNew() {
    setEditing('new');
    setForm({ name: '', sessions_per_week: 2, price: '', description: '' });
  }

  function startEdit(plan) {
    setEditing(plan.id);
    setForm({
      name: plan.name,
      sessions_per_week: plan.sessions_per_week,
      price: (plan.price_cents / 100).toString(),
      description: plan.description || '',
    });
  }

  async function savePlan() {
    if (!form.name || !form.price) return;
    setSaving(true);

    const payload = {
      trainer_id: profile.id,
      name: form.name,
      sessions_per_week: parseInt(form.sessions_per_week),
      price_cents: Math.round(parseFloat(form.price) * 100),
      description: form.description,
      active: true,
    };

    if (editing === 'new') {
      const { error } = await supabase.from('plans').insert(payload);
      if (error) { showToast('Erro: ' + error.message); }
      else showToast('Plano criado!');
    } else {
      const { error } = await supabase.from('plans').update(payload).eq('id', editing);
      if (error) { showToast('Erro: ' + error.message); }
      else showToast('Plano atualizado!');
    }

    setEditing(null);
    setSaving(false);
    loadPlans();
  }

  async function deletePlan(id) {
      if (!confirm('Tem certeza que deseja excluir este plano?')) return;
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) {
        alert('Erro ao deletar: ' + JSON.stringify(error));
        return;
      }
      setPlans(prev => prev.filter(p => p.id !== id));
      showToast('Plano removido');
    }

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <div className="page-header animate-in" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={() => nav('/trainer')} style={{ cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} />
        </div>
        <div>
          <p className="page-title">Meus planos</p>
          <p className="page-subtitle">Configure os planos para seus alunos</p>
        </div>
      </div>

      {/* Existing plans */}
      <div className="animate-in delay-1">
        {plans.filter(p => p.active).map(plan => (
          <div key={plan.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div onClick={() => startEdit(plan)} style={{ cursor: 'pointer', flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 500 }}>{plan.name}</p>
              <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2 }}>
                {plan.sessions_per_week}x/semana — {formatBRL(plan.price_cents)}
              </p>
              {plan.description && <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 2 }}>{plan.description}</p>}
            </div>
            <div onClick={() => deletePlan(plan.id)} style={{ cursor: 'pointer', padding: 8, color: 'var(--coral)' }}>
              <Trash2 size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create form */}
      {editing && (
        <div className="card animate-in" style={{ marginTop: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>
            {editing === 'new' ? 'Novo plano' : 'Editar plano'}
          </p>

          <div style={{ marginBottom: 12 }}>
            <label className="input-label">Nome do plano</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: 2x na semana" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label className="input-label">Aulas/semana</label>
              <select className="input-field" value={form.sessions_per_week}
                onChange={e => setForm(f => ({ ...f, sessions_per_week: e.target.value }))}>
                {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}x</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Preço (R$)</label>
              <input className="input-field" type="number" step="0.01" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="700,00" />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Descrição</label>
            <input className="input-field" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Inclui avaliação física + treinos semanais" />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={savePlan} disabled={saving} style={{ flex: 1 }}>
              <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="btn btn-outline" onClick={() => setEditing(null)} style={{ flex: 0.5 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <button className="btn btn-primary animate-in delay-2" style={{ marginTop: 16 }} onClick={startNew}>
          <Plus size={18} /> Criar novo plano
        </button>
      )}

      {/* Default plans hint */}
      {plans.length === 0 && !editing && (
        <div className="animate-in delay-3" style={{ marginTop: 20, padding: '16px 20px', background: 'var(--green-50)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--green-700)', marginBottom: 6 }}>Dica: comece criando seus planos</p>
          <p style={{ fontSize: 13, color: 'var(--green-600)', lineHeight: 1.5 }}>
            Exemplo: 2x na semana (R$ 700), 3x na semana (R$ 900), 4x na semana (R$ 1.000).
            Os alunos poderão ver e assinar esses planos diretamente pelo app.
          </p>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--green-800)', color: 'white', padding: '10px 20px',
          borderRadius: 'var(--radius-full)', fontSize: 14, zIndex: 200
        }}>{toast}</div>
      )}
    </div>
  );
}
