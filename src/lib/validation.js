// Phone formatting and validation (Brazilian format)
export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

// Password strength
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Muito fraca', color: 'var(--coral)' };
  if (score === 2) return { score: 2, label: 'Fraca', color: 'var(--coral)' };
  if (score === 3) return { score: 3, label: 'Média', color: '#E8A317' };
  if (score === 4) return { score: 4, label: 'Forte', color: 'var(--green-400)' };
  return { score: 5, label: 'Muito forte', color: 'var(--green-600)' };
}

export function getPasswordHints(password) {
  const hints = [];
  if (password.length < 8) hints.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) hints.push('Uma letra maiúscula');
  if (!/[0-9]/.test(password)) hints.push('Um número');
  if (!/[^A-Za-z0-9]/.test(password)) hints.push('Um caractere especial (!@#$)');
  return hints;
}