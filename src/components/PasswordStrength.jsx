import { getPasswordStrength, getPasswordHints } from '../lib/validation';

export function PasswordStrength({ password }) {
  if (!password) return null;

  const { score, label, color } = getPasswordStrength(password);
  const hints = getPasswordHints(password);

  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      {/* Strength bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= score ? color : 'var(--sand-200)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>

      {/* Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color, fontWeight: 500 }}>{label}</span>
      </div>

      {/* Hints */}
      {hints.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {hints.map((hint, i) => (
            <p key={i} style={{ fontSize: 11, color: 'var(--sand-400)', margin: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sand-300)', display: 'inline-block' }} />
              {hint}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}