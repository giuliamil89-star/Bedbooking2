export default function PaymentBadge({ status, onToggle, busy }) {
  const paid = status === 'paid';
  return (
    <button
      type="button"
      className={`payment-badge ${paid ? 'payment-badge-paid' : 'payment-badge-unpaid'}`}
      onClick={onToggle}
      disabled={!onToggle || busy}
      title={onToggle ? 'Tocca per cambiare stato pagamento' : undefined}
    >
      {paid ? '✓ Pagato' : '✗ Non pagato'}
    </button>
  );
}
