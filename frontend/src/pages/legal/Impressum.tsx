import impressum from '../../../../legal/impressum.md?raw';
import { renderMarkdown } from '../../utils/markdown';

export const LegalImpressum = () => (
  <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(impressum)} />
);
