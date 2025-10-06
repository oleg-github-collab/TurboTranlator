import datenschutz from '../../../../legal/datenschutzerklaerung.md?raw';
import { renderMarkdown } from '../../utils/markdown';

export const LegalPrivacy = () => (
  <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(datenschutz)} />
);
