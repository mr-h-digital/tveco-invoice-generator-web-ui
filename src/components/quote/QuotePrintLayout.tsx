import type { Quote } from '../../types/quote';
import { QuotePreview } from './QuotePreview';

interface Props {
  quote: Quote;
}

export function QuotePrintLayout({ quote }: Props) {
  return <QuotePreview quote={quote} />;
}
