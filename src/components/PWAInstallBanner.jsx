import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('stride_pwa_dismissed')) return;

    // iOS detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (ios && !navigator.standalone) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Android/Chrome install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    }
  }

  function dismiss() {
    setShow(false);
    localStorage.setItem('stride_pwa_dismissed', 'true');
  }

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 70, left: 12, right: 12, zIndex: 250,
      background: 'white', borderRadius: 16, padding: '16px 18px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', gap: 14,
      animation: 'slideUp 0.3s ease-out',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: 'var(--green-500)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Download size={22} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Instalar Stride</p>
        {isIOS ? (
          <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2, lineHeight: 1.4 }}>
            Toque em <span style={{ fontWeight: 500 }}>Compartilhar</span> → <span style={{ fontWeight: 500 }}>Tela de Início</span>
          </p>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--sand-500)', marginTop: 2 }}>
            Acesse rápido pela tela inicial
          </p>
        )}
      </div>
      {!isIOS && (
        <button onClick={handleInstall} style={{
          background: 'var(--green-500)', color: 'white', border: 'none',
          borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', flexShrink: 0,
        }}>
          Instalar
        </button>
      )}
      <div onClick={dismiss} style={{ cursor: 'pointer', padding: 4, flexShrink: 0 }}>
        <X size={18} color="var(--sand-400)" />
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}