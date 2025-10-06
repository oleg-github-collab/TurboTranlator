import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Cmd/Ctrl + K - Quick Translate
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        navigate('/quick-translate');
      }

      // Cmd/Ctrl + D - Dashboard
      if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
        event.preventDefault();
        navigate('/dashboard');
      }

      // Cmd/Ctrl + H - Home
      if ((event.metaKey || event.ctrlKey) && event.key === 'h') {
        event.preventDefault();
        navigate('/');
      }

      // Cmd/Ctrl + P - Pricing
      if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        event.preventDefault();
        navigate('/pricing');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);
};
