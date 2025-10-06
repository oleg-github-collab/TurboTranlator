import cookies from '../../../../legal/cookie-policy.md?raw';
import { renderMarkdown } from '../../utils/markdown';

export const LegalCookies = () => (
  <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(cookies)} />
);
