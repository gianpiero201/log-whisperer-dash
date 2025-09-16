import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/store/authStore';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'register';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Separate form states for login and register
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null); // Clear error when switching modes
    // Don't clear form data - keep it intact
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({ email: loginForm.email, password: loginForm.password });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password confirmation
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      await register({ email: registerForm.email, password: registerForm.password, displayName: registerForm.displayName });

      // Show success message or redirect
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Erro ao criar conta');
      // IMPORTANT: Don't change mode or clear form on error
      // Stay on register form to preserve user input
    } finally {
      setLoading(false);
    }
  };

  const handleLoginInputChange = (field: keyof typeof loginForm, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error on input change
  };

  const handleRegisterInputChange = (field: keyof typeof registerForm, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error on input change
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border/50 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold">LogWhisperer</span>
          </div>

          <CardTitle className="text-2xl">
            {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
          </CardTitle>

          <CardDescription>
            {mode === 'login'
              ? 'Digite suas credenciais para acessar sua conta'
              : 'Preencha os dados para criar sua conta'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mode Switch Tabs */}
          <div className="flex border border-border/50 rounded-lg p-1 bg-muted/50">
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

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
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
                    value={loginForm.email}
                    onChange={(e) => handleLoginInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
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
                    value={loginForm.password}
                    onChange={(e) => handleLoginInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !loginForm.email || !loginForm.password}
              >
                {loading ? 'Entrando...' : 'Entrar'}
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
                    value={registerForm.displayName}
                    onChange={(e) => handleRegisterInputChange('displayName', e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
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
                    value={registerForm.email}
                    onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
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
                    value={registerForm.password}
                    onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={loading}
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
                    value={registerForm.confirmPassword}
                    onChange={(e) => handleRegisterInputChange('confirmPassword', e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  !registerForm.email ||
                  !registerForm.password ||
                  !registerForm.confirmPassword ||
                  !registerForm.displayName ||
                  registerForm.password !== registerForm.confirmPassword
                }
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>
          )}

          {/* Forgot Password Link (only on login) */}
          {mode === 'login' && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => {
                  // Implement forgot password functionality
                  console.log('Forgot password clicked');
                }}
              >
                Esqueceu sua senha?
              </button>
            </div>
          )}

          {/* Terms and Privacy (only on register) */}
          {mode === 'register' && (
            <div className="text-center text-xs text-muted-foreground">
              Ao criar uma conta, você concorda com nossos{' '}
              <button className="text-primary hover:underline">
                Termos de Uso
              </button>{' '}
              e{' '}
              <button className="text-primary hover:underline">
                Política de Privacidade
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}