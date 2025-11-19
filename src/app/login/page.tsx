'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Loader2, User as UserIcon, CheckCircle } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { createNotification } from '@/services/notification-service';
import { Checkbox } from '../../components/ui/checkbox';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleLogin = () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        toast({
            variant: "success",
            title: '¡Bienvenido de vuelta!',
            description: `Hola ${user.displayName || 'Usuario'}, es un gusto verte de nuevo.`,
        });

        // Use a predictable ID for the welcome notification
        createNotification(
            firestore, 
            user.uid, 
            {
                title: '¡Bienvenido de vuelta!',
                description: `Hola ${user.displayName || 'Usuario'}, es un gusto verte de nuevo.`,
                link: '/dashboard',
                iconName: 'Users'
            },
            'welcome-back' // Predictable ID
        );
        router.push('/dashboard');
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleRegister = () => {
    if (!auth) return;
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "Las contraseñas no coinciden.",
      });
      return;
    }
    setIsLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Set the user's display name
        return updateProfile(userCredential.user, {
            displayName: fullName,
        });
      })
      .then(() => {
        toast({
          title: "¡Cuenta creada!",
          description: "Tu cuenta ha sido creada exitosamente. Iniciando sesión...",
        });
        router.push('/dashboard');
      })
      .catch((error) => {
        let description = "No se pudo crear la cuenta. Por favor, inténtalo de nuevo.";
        if (error.code === 'auth/email-already-in-use') {
          description = "Este correo electrónico ya está registrado.";
        } else if (error.code === 'auth/weak-password') {
          description = "La contraseña debe tener al menos 6 caracteres.";
        }
        toast({
          variant: "destructive",
          title: "Error de registro",
          description: description,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-card shadow-lg md:grid md:grid-cols-2">
            <div className="hidden md:flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/10 p-12 text-center">
                <div className='flex justify-center mb-6'>
                    <Image
                        src="/logo.png"
                        alt="Logo de la empresa"
                        width={150}
                        height={50}
                        priority
                        data-ai-hint="logo"
                    />
                </div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                    ¡Bienvenido <span className='text-primary'>AgroPlayer!</span>
                </h1>
                <p className="mt-4 text-gray-600 dark:text-gray-300">"El compromiso de hoy es la cosecha del mañana."</p>
                <div className='mt-8 text-6xl animate-float'>
                  🌱
                </div>
            </div>
             <div className="flex items-center justify-center p-6 sm:p-12">
                <form className="w-full max-w-sm space-y-6" onSubmit={handleSubmit}>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
                        </h1>
                    </div>
                    <div className="space-y-4">
                        {isRegisterMode && (
                          <div>
                            <Label htmlFor="fullName">Nombre Completo</Label>
                            <div className="relative mt-1">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                id="fullName"
                                type="text"
                                placeholder="Tu nombre completo"
                                className="pl-9"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={isLoading}
                                />
                            </div>
                          </div>
                        )}
                        <div>
                            <Label htmlFor="email">Correo electrónico</Label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                id="email"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                className="pl-9"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                />
                            </div>
                        </div>
                         {isRegisterMode && (
                          <div>
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="********"
                                className="pl-9"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                />
                            </div>
                          </div>
                        )}
                    </div>
                    {!isRegisterMode && (
                      <div className="flex items-center">
                          <Checkbox id="remember-me" />
                          <Label htmlFor="remember-me" className="ml-2 font-normal">
                          Recuérdame
                          </Label>
                      </div>
                    )}
                    <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Procesando...' : (isRegisterMode ? 'Registrarse' : 'Iniciar sesión')}
                    </Button>
                     <div className="text-center text-sm">
                      {isRegisterMode ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                      <Button variant="link" type="button" onClick={() => setIsRegisterMode(!isRegisterMode)} className="p-1">
                        {isRegisterMode ? 'Inicia sesión' : 'Regístrate'}
                      </Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
}
