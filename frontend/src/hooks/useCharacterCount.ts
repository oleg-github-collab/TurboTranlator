import { useEffect, useState } from 'react';
import { countCharacters } from '../utils/characterCount';

export const useCharacterCount = (file: File | null, stripTags: boolean) => {
  const [characters, setCharacters] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setCharacters(0);
      return;
    }
    let cancelled = false;
    const reader = new FileReader();
    setLoading(true);

    reader.onload = () => {
      if (cancelled) return;
      const text = typeof reader.result === 'string' ? reader.result : '';
      setCharacters(countCharacters(text, stripTags));
      setLoading(false);
    };

    reader.onerror = () => {
      if (cancelled) return;
      setCharacters(0);
      setLoading(false);
    };

    reader.readAsText(file);

    return () => {
      cancelled = true;
      reader.abort();
    };
  }, [file, stripTags]);

  return { characters, loading };
};
