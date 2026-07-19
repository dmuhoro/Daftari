import Receipt from './Receipt';

interface SuccessFlashProps {
  amount: number;
  type: 'income' | 'expense' | 'withdrawal';
  onDismiss: () => void;
  receiptId?: string;
  description?: string;
  onShare?: () => void;
}

export default function SuccessFlash({ amount, type, onDismiss, receiptId, description, onShare }: SuccessFlashProps) {
  if (receiptId) {
    return (
      <Receipt
        receiptId={receiptId}
        amount={amount}
        type={type}
        description={description}
        onDismiss={onDismiss}
        onShare={onShare}
      />
    );
  }

  return (
    <Receipt
      receiptId=""
      amount={amount}
      type={type}
      onDismiss={onDismiss}
      onShare={onShare}
    />
  );
}
