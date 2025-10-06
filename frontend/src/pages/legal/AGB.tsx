import agb from '../../../../legal/agb.md?raw';
import { renderMarkdown } from '../../utils/markdown';

export const LegalAGB = () => (
  <article
    className="prose prose-invert max-w-none"
    dangerouslySetInnerHTML={renderMarkdown(agb)}
  />
);
