export const countCharacters = (text: string, stripTags = false) => {
  if (!stripTags) return [...text].length;
  const cleaned = text.replace(/<[^>]+>/g, '');
  return [...cleaned].length;
};
