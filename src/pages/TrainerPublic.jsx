import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatBRL, Avatar, DAYS_PT } from '../components/Shared';
import { Calendar, Clock, MapPin, MessageCircle, ChevronRight, Check, Zap, Dumbbell, ArrowRight, Users } from 'lucide-react';

export default function TrainerPublic() {
  const { slug } = useParams();
  const { session, profile: myProfile } = useAuth();
  const nav = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [trainerData, setTrainerData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTrainer(); }, [slug]);

  async function loadTrainer() {
    // Find trainer by slug
    const { data: trainerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .eq('role', 'trainer')
      .single();

    if (!trainerProfile) { setLoading(false); return; }
    setTrainer(trainerProfile);

    // Load trainer details
    const { data: tData } = await supabase
      .from('trainers')
      .select('bio, extra_class_price')
      .eq('id', trainerProfile.id)
      .single();
    setTrainerData(tData);

    // Load public plans
    const { data: tPlans } = await supabase
      .from('plans')
      .select('*')
      .eq('trainer_id', trainerProfile.id)
      .eq('active', true)
      .is('student_id', null)
      .order('sessions_per_week');
    setPlans(tPlans || []);

    // Load availability
    const { data: avail } = await supabase
      .from('availability')
      .select('*')
      .eq('trainer_id', trainerProfile.id)
      .eq('active', true)
      .order('day_of_week')
      .order('Start_time');
    setAvailability(avail || []);

    // Count active students
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('trainer_id', trainerProfile.id)
      .eq('status', 'active');
    setStudentCount(subs?.length || 0);

    setLoading(false);
  }

  function handleCTA() {
    if (session && myProfile) {
      nav(`/join/${trainer.id}`);
    } else {
      sessionStorage.setItem('joinRedirect', `/join/${trainer.id}`);
      nav('/auth');
    }
  }

  function openWhatsApp() {
    if (!trainer?.phone) return;
    const digits = trainer.phone.replace(/\D/g, '');
    const full = digits.StartsWith('55') ? digits : `55${digits}`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(`Olá ${trainer.full_name}! Vi seu perfil no Stride e goStaria de saber mais sobre as aulas.`)}`, '_blank');
  }

  // Group availability by day
  const availByDay = {};
  availability.forEach(a => {
    if (!availByDay[a.day_of_week]) availByDay[a.day_of_week] = [];
    availByDay[a.day_of_week].push(a.Start_time.slice(0, 5));
  });

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand-bg)' }}>
      <div className="spinner" />
    </div>
  );

  if (!trainer) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sand-bg)', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <Dumbbell size={40} color="var(--sand-300)" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Personal não encontrado</p>
        <p style={{ fontSize: 14, color: 'var(--sand-500)' }}>O link pode eStar incorreto ou o perfil foi removido</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand-bg)' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--green-700) 0%, var(--green-900) 100%)',
        padding: '48px 24px 40px', textAlign: 'center', color: 'white',
        borderRadius: '0 0 32px 32px', position: 'relative',
      }}>
        <div className="animate-in" style={{
          width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '3px solid rgba(255,255,255,0.3)', marginBottom: 16,
        }}>
          <span style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {trainer.full_name?.charAt(0)?.toUpperCase()}
          </span>
        </div>

        <p className="animate-in" style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          {trainer.full_name}
        </p>
        <p className="animate-in" style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>Personal Trainer</p>

        {studentCount > 0 && (
          <div className="animate-in delay-1" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
            background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '6px 14px',
          }}>
            <Users size={14} />
            <span style={{ fontSize: 12 }}>{studentCount} aluno{studentCount > 1 ? 's' : ''} treinando</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* Bio */}
        {trainerData?.bio && (
          <div className="animate-in delay-1" style={{
            marginTop: -20, background: 'white', borderRadius: 'var(--radius-lg)',
            padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: 14, color: 'var(--sand-600)', lineHeight: 1.6 }}>{trainerData.bio}</p>
          </div>
        )}

        {/* WhatsApp */}
        {trainer.phone && (
          <div className="animate-in delay-1" onClick={openWhatsApp} style={{
            marginTop: 16, cursor: 'pointer', padding: '14px 18px', borderRadius: 'var(--radius-md)',
            background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500 }}>Fale comigo no WhatsApp</p>
              <p style={{ fontSize: 12, color: 'var(--sand-400)' }}>Tire dúvidas antes de começar</p>
            </div>
            <ChevronRight size={16} color="var(--sand-400)" />
          </div>
        )}

        {/* Plans */}
        {plans.length > 0 && (
          <div className="animate-in delay-2" style={{ marginTop: 24 }}>
            <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 14 }}>Planos disponíveis</p>

            {plans.map((plan, i) => {
              const isPopular = plans.length >= 3 && i === 1;
              return (
                <div key={plan.id} style={{
                  padding: '20px 22px', borderRadius: 'var(--radius-lg)', marginBottom: 10,
                  border: isPopular ? '2px solid var(--green-400)' : '1.5px solid var(--sand-200)',
                  background: isPopular ? 'var(--green-50)' : 'white',
                  position: 'relative',
                }}>
                  {isPopular && (
                    <span style={{
                      position: 'absolute', top: -10, right: 16,
                      background: 'var(--green-500)', color: 'white', fontSize: 10, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 10,
                    }}>
                      POPULAR
                    </span>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 500 }}>{plan.name}</p>
                      <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 4 }}>
                        {plan.sessions_per_week}x por semana
                      </p>
                      {plan.description && (
                        <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 4, lineHeight: 1.4 }}>{plan.description}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: 16 }}>
                      <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green-600)' }}>
                        {formatBRL(plan.price_cents)}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--sand-400)' }}>/mês</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Availability */}
        {Object.keys(availByDay).length > 0 && (
          <div className="animate-in delay-2" style={{ marginTop: 24 }}>
            <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 14 }}>Horários disponíveis</p>

            <div style={{
              background: 'white', borderRadius: 'var(--radius-lg)', padding: '18px 20px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            }}>
              {[1, 2, 3, 4, 5].map(day => {
                const times = availByDay[day];
                if (!times) return null;
                const dayName = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][day];
                return (
                  <div key={day} style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{dayName}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {times.map(t => (
                        <span key={t} style={{
                          fontSize: 12, padding: '4px 10px', borderRadius: 6,
                          background: 'var(--green-50)', color: 'var(--green-600)',
                          fontWeight: 500,
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="animate-in delay-3" style={{ marginTop: 24 }}>
          <div style={{
            background: 'white', borderRadius: 'var(--radius-lg)', padding: '20px 22px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            {[
              ['Agende em segundos', 'Escolha o horário e confirme com um toque'],
              ['Pagamento automático', 'Cartão de crédito ou débito, cobrança mensal'],
              ['Cancele sem multa', 'Sem burocracia, cancele quando quiser'],
            ].map(([title, desc], i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-Start', gap: 12,
                padding: '12px 0',
                borderBottom: i < 2 ? '1px solid var(--sand-100)' : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--green-50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                }}>
                  <Check size={14} color="var(--green-500)" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{title}</p>
                  <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="animate-in delay-3" style={{ marginTop: 28, paddingBottom: 40 }}>
          <button onClick={handleCTA} style={{
            width: '100%', padding: '16px 24px', borderRadius: 14,
            background: 'var(--green-500)', color: 'white', border: 'none',
            fontSize: 16, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-display)',
            boxShadow: '0 4px 16px rgba(13,158,109,0.3)',
          }}>
            Começar a treinar <ArrowRight size={20} />
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--sand-400)', marginTop: 10 }}>
            Crie sua conta gratuitamente
          </p>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--sand-400)' }}>
              Feito com <span style={{ color: 'var(--green-500)' }}>Stride</span> por Cloudhead
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}