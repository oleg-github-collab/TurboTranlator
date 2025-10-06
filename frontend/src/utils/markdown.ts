import { marked } from 'marked';

marked.setOptions({ breaks: true });

export const renderMarkdown = (markdown: string) => ({
  __html: marked.parse(markdown)
});
