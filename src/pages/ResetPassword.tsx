import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'form' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Récupère d'abord dans la query string, sinon dans le hash
    let params = new URLSearchParams(location.search);
    let type = params.get('type');
    let access_token = params.get('access_token');
    let refresh_token = params.get('refresh_token');

    if (!type) {
      // Si pas dans la query, essaie dans le hash
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        type = hashParams.get('type');
        access_token = hashParams.get('access_token');
        refresh_token = hashParams.get('refresh_token');
      }
    }

    if (type === 'recovery' && access_token && refresh_token) {
      setStatus('form');
    } else {
      setStatus('error');
      setMessage('Lien de réinitialisation invalide ou expiré.');
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      passwordRef.current?.focus();
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      passwordRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);
    if (error) {
      setError(error.message || 'Erreur lors de la réinitialisation.');
    } else {
      setStatus('success');
      setMessage('Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
      setTimeout(() => navigate('/'), 4000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'pending' && <LoadingSpinner size="lg" text="Chargement..." />}
        {status === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="text-xl font-bold mb-2">Nouveau mot de passe</div>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <Input
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              ref={passwordRef}
              required
            />
            <Input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-600 text-2xl font-bold mb-4">Succès</div>
            <div className="text-gray-700 mb-2">{message}</div>
            <div className="text-sm text-gray-500">Redirection automatique...</div>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-600 text-2xl font-bold mb-4">Erreur</div>
            <div className="text-gray-700 mb-2">{message}</div>
            <a href="/" className="text-blue-600 hover:underline">Retour à l'accueil</a>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword; 
