
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const AuthPage = () => {
  const { signIn, signUp, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Validation renforcée du mot de passe
  const validatePasswordStrength = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push('8 caractères minimum');
    if (!/[A-Z]/.test(password)) errors.push('1 majuscule');
    if (!/[a-z]/.test(password)) errors.push('1 minuscule');
    if (!/[0-9]/.test(password)) errors.push('1 chiffre');
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('1 caractère spécial');
    return errors;
  };

  const validateSignIn = (email: string, password: string) => {
    const newErrors: { [key: string]: string } = {};
    if (!email) newErrors.email = 'Email requis';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrors.email = 'Format d\'email invalide';
    if (!password) newErrors.password = 'Mot de passe requis';
    return newErrors;
  };

  const validateSignUp = (name: string, email: string, password: string) => {
    const newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = 'Nom requis';
    if (!email) newErrors.email = 'Email requis';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrors.email = 'Format d\'email invalide';
    if (!password) newErrors.password = 'Mot de passe requis';
    else {
      const pwErrors = validatePasswordStrength(password);
      if (pwErrors.length > 0) newErrors.password = 'Mot de passe trop faible : ' + pwErrors.join(', ');
    }
    return newErrors;
  };

  const focusFirstError = (errs: { [key: string]: string }) => {
    if (errs.name && nameRef.current) nameRef.current.focus();
    else if (errs.email && emailRef.current) emailRef.current.focus();
    else if (errs.password && passwordRef.current) passwordRef.current.focus();
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setServerError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const validationErrors = validateSignIn(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      focusFirstError(validationErrors);
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setServerError(error.message || 'Erreur de connexion');
      setIsSubmitting(false);
      if (emailRef.current) emailRef.current.focus();
      return;
    }
    setIsSubmitting(false);
    navigate('/dashboard');
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setServerError(null);
    setSignUpSuccess(false);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const validationErrors = validateSignUp(name, email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      focusFirstError(validationErrors);
      return;
    }

    const { error } = await signUp(email, password, name);
    if (error) {
      let msg = error.message || "Erreur d'inscription";
      if (msg.toLowerCase().includes("user already registered") || msg.toLowerCase().includes("email") || msg.toLowerCase().includes("unique")) {
        msg = "Cet email est déjà utilisé. Veuillez en choisir un autre ou vous connecter.";
      }
      setServerError(msg);
      setIsSubmitting(false);
      if (emailRef.current) emailRef.current.focus();
      return;
    }
    setIsSubmitting(false);
    setSignUpSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">StockFlow Pro</CardTitle>
          <CardDescription>
            Système de gestion de stock professionnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                {serverError && (
                  <div role="alert" aria-live="assertive" className="text-red-600 text-sm mb-2">
                    {serverError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    required
                    disabled={isSubmitting}
                    ref={emailRef}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'signin-email-error' : undefined}
                  />
                  {errors.email && (
                    <div id="signin-email-error" role="alert" aria-live="assertive" className="text-red-600 text-xs">{errors.email}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      disabled={isSubmitting}
                      ref={passwordRef}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'signin-password-error' : undefined}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>
                  {errors.password && (
                    <div id="signin-password-error" role="alert" aria-live="assertive" className="text-red-600 text-xs">{errors.password}</div>
                  )}
                  <div className="text-right mt-1">
                    <a href="#" className="text-xs text-blue-600 hover:underline">Mot de passe oublié ?</a>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              {signUpSuccess ? (
                <div className="text-green-700 text-center font-semibold py-6">
                  Inscription réussie !<br />
                  Vérifiez votre email pour valider votre compte.
                </div>
              ) : (
              <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                {serverError && (
                  <div role="alert" aria-live="assertive" className="text-red-600 text-sm mb-2">
                    {serverError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Votre nom complet"
                    required
                    disabled={isSubmitting}
                    ref={nameRef}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'signup-name-error' : undefined}
                  />
                  {errors.name && (
                    <div id="signup-name-error" role="alert" aria-live="assertive" className="text-red-600 text-xs">{errors.name}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    required
                    disabled={isSubmitting}
                    ref={emailRef}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'signup-email-error' : undefined}
                  />
                  {errors.email && (
                    <div id="signup-email-error" role="alert" aria-live="assertive" className="text-red-600 text-xs">{errors.email}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      disabled={isSubmitting}
                      ref={passwordRef}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'signup-password-error' : undefined}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>
                  {errors.password && (
                    <div id="signup-password-error" role="alert" aria-live="assertive" className="text-red-600 text-xs">{errors.password}</div>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Inscription...' : 'S\'inscrire'}
                </Button>
              </form>
              )}
            </TabsContent>
          </Tabs>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Compte de test :</p>
            <p>Email: admin@stockflow.com</p>
            <p>Mot de passe: StockFlow2024!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
