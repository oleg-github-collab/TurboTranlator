import widerruf from '../../../../legal/widerrufsrecht.md?raw';
import { renderMarkdown } from '../../utils/markdown';

export const LegalWithdrawal = () => (
  <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(widerruf)} />
);
