export function generateReceipt({ paymentId, date, amount, planName, trainerName, studentName, studentEmail, description }) {
  const formattedDate = new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const formattedAmount = (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const receiptNumber = `STR-${paymentId?.slice(0, 8)?.toUpperCase() || Date.now()}`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprovante ${receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #021F15; background: #f5f5f0; padding: 20px; }
    .receipt { max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #1a1a1a; color: white; padding: 32px 28px 24px; text-align: center; }
    .header .logo { width: 48px; height: 48px; border-radius: 50%; background: white; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .header .logo span { color: #1a1a1a; font-size: 22px; font-weight: 700; }
    .header h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .header p { font-size: 13px; opacity: 0.7; }
    .badge { display: inline-block; background: #0D9E6D; color: white; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 16px; }
    .body { padding: 28px; }
    .amount-section { text-align: center; padding: 20px 0 24px; border-bottom: 1px solid #E5E3DD; margin-bottom: 20px; }
    .amount { font-size: 36px; font-weight: 700; color: #0D9E6D; }
    .amount-label { font-size: 13px; color: #7A786F; margin-top: 4px; }
    .details { margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0efe8; }
    .row:last-child { border-bottom: none; }
    .row .label { color: #7A786F; font-size: 14px; }
    .row .value { font-size: 14px; font-weight: 500; text-align: right; }
    .footer { padding: 20px 28px 28px; border-top: 1px solid #E5E3DD; text-align: center; }
    .footer p { font-size: 11px; color: #A8A69E; line-height: 1.6; }
    .footer .company { font-size: 12px; font-weight: 500; color: #7A786F; margin-bottom: 4px; }
    .print-btn { display: block; width: 100%; max-width: 480px; margin: 16px auto 0; padding: 14px; background: #0D9E6D; color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .print-btn:hover { background: #0b8a5e; }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo"><span>C</span></div>
      <h1>Cloudhead</h1>
      <p>Comprovante de pagamento</p>
      <div class="badge">PAGO</div>
    </div>
    <div class="body">
      <div class="amount-section">
        <div class="amount">${formattedAmount}</div>
        <div class="amount-label">${description || 'Assinatura mensal — Stride'}</div>
      </div>
      <div class="details">
        <div class="row">
          <span class="label">Comprovante</span>
          <span class="value">${receiptNumber}</span>
        </div>
        <div class="row">
          <span class="label">Data</span>
          <span class="value">${formattedDate}</span>
        </div>
        <div class="row">
          <span class="label">Aluno</span>
          <span class="value">${studentName}</span>
        </div>
        <div class="row">
          <span class="label">Email</span>
          <span class="value">${studentEmail}</span>
        </div>
        <div class="row">
          <span class="label">Personal Trainer</span>
          <span class="value">${trainerName}</span>
        </div>
        <div class="row">
          <span class="label">Plano</span>
          <span class="value">${planName}</span>
        </div>
        <div class="row">
          <span class="label">Método</span>
          <span class="value">Cartão de crédito via Stripe</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p class="company">Cloudhead</p>
      <p>Stride é um produto Cloudhead.<br>Este comprovante foi gerado automaticamente e não possui valor fiscal.<br>Dúvidas: support@cloudheadco.com</p>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">Salvar como PDF</button>
</body>
</html>`;

  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
}