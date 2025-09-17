import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/store/authStore';
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'register';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, register } = useAuth();

  // Get initial mode from URL params or default to login
  const getInitialMode = (): AuthMode => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    return mode === 'register' ? 'register' : 'login';
  };

  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Separate form states - CRUCIAL for preserving data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Update URL when mode changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState({}, '', url.toString());
  }, [mode]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null); // Clear error only - PRESERVE FORM DATA
    // DO NOT clear loginData or registerData here
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.email.trim() || !loginData.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login({ email: loginData.email.trim(), password: loginData.password });
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Erro ao fazer login';

      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      // IMPORTANT: Stay on login form, don't change mode
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!registerData.email.trim() || !registerData.password || !registerData.fullName.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (registerData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({ email: registerData.email.trim(), password: registerData.password, displayName: registerData.fullName.trim() });
      navigate('/dashboard');
    } catch (err: any) {

      let errorMessage = 'Erro ao criar conta';

      if (err.message?.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado';
      } else if (err.message?.includes('Invalid email')) {
        errorMessage = 'Email inválido';
      } else if (err.message?.includes('Password should be at least')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

    } finally {
      setIsLoading(false);
    }
  };

  const updateLoginData = (field: keyof typeof loginData, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const updateRegisterData = (field: keyof typeof registerData, value: string) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  // Debug info in development
  // useEffect(() => {
  //   console.log('🔍 Auth component state:', {
  //     mode,
  //     loginData,
  //     registerData,
  //     isLoading,
  //     error,
  //     userExists: !!user
  //   });
  // }, [mode, loginData, registerData, isLoading, error, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold">LogWhisperer</span>
          </div>

          <CardTitle className="text-2xl">
            {mode === 'login' ? 'Entrar na conta' : 'Criar nova conta'}
          </CardTitle>

          <CardDescription>
            {mode === 'login'
              ? 'Digite suas credenciais para acessar'
              : 'Preencha os dados para se cadastrar'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex border rounded-lg p-1 bg-muted/50">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${mode === 'login'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${mode === 'register'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Criar conta
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => updateLoginData('email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={loginData.password}
                    onChange={(e) => updateLoginData('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !loginData.email || !loginData.password}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={registerData.fullName}
                    onChange={(e) => updateRegisterData('fullName', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerData.email}
                    onChange={(e) => updateRegisterData('email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={registerData.password}
                    onChange={(e) => updateRegisterData('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={registerData.confirmPassword}
                    onChange={(e) => updateRegisterData('confirmPassword', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading ||
                  !registerData.email ||
                  !registerData.password ||
                  !registerData.confirmPassword ||
                  !registerData.fullName ||
                  registerData.password !== registerData.confirmPassword
                }
              >
                {isLoading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>
          )}

          {/* Additional Links */}
          <div className="text-center text-sm">
            {mode === 'login' ? (
              <>
                <span className="text-muted-foreground">Não tem uma conta? </span>
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className="text-primary hover:underline"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Já tem uma conta? </span>
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-primary hover:underline"
                >
                  Fazer login
                </button>
              </>
            )}
          </div>

          {/* Development Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-muted-foreground">
              <summary>Debug Info</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs">
                {JSON.stringify({
                  mode,
                  loginData: {
                    email: loginData.email,
                    hasPassword: !!loginData.password
                  },
                  registerData: {
                    email: registerData.email,
                    fullName: registerData.fullName,
                    hasPassword: !!registerData.password,
                    hasConfirm: !!registerData.confirmPassword
                  },
                  isLoading,
                  error,
                  userExists: !!user
                }, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}