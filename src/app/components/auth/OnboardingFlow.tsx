
'use client';

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

import SignUpForm from './SignUpForm';
import LoginForm from './LoginForm';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { signUp, login } from '@/firebase/auth';
import { useAuth } from '@/firebase';
import type { z } from "zod";
import { Button } from '@/components/ui/button';
import AnimatedWelcome from './AnimatedWelcome';


import { type SignUpFormSchema } from './SignUpForm';
import { type LoginFormSchema } from './LoginForm';

type SignUpData = z.infer<typeof SignUpFormSchema>;
type LoginData = z.infer<typeof LoginFormSchema>;

interface OnboardingFlowProps {
    onComplete: (data: {
        name: string;
        avatar: string;
        chosenScenario: string;
        signupData?: SignUpData;
    }) => void;
    onLoginSuccess: () => void;
}

type Step = 'welcome' | 'signup' | 'login' | 'avatar' | 'yara' | 'scenario';

function ResponsiveBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <picture
        className="pointer-events-none select-none block h-full w-full"
        aria-hidden="true"
        role="presentation"
      >
        {/* PC >= 1025px */}
        <source media="(min-width: 1025px)" srcSet="/backgrounds/MapaPc.png" />
        {/* Tablet >= 650px */}
        <source media="(min-width: 650px)" srcSet="/backgrounds/MapaTablet.png" />
        {/* Móvil (fallback) */}
        <img
          src="/backgrounds/MapaTelefono.png"
          alt="Fondo del mapa del juego"
          className="h-full w-full object-cover"
          sizes="100vw"
          decoding="async"
          loading="eager"
        />
      </picture>

      {/* Capa oscura opcional */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}


export default function OnboardingFlow({ onComplete, onLoginSuccess }: OnboardingFlowProps) {
    const auth = useAuth();
    const [step, setStep] = useState<Step>('welcome');
    const [signupData, setSignupData] = useState<SignUpData | null>(null);
    const [formName, setFormName] = useState<string>('');
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (auth?.currentUser && (step === 'welcome' || step === 'signup' || step === 'login')) {
            setFormName(auth.currentUser.displayName || '');
            setStep('avatar');
        }
    }, [auth, step]);

    const yaraCharImage = useMemo(() => PlaceHolderImages.find((p) => p.id === 'char-yara'), []);
    const avatars = useMemo(() => {
        return PlaceHolderImages.filter(p => p.id.startsWith('avatar-')).map(p => ({
            id: p.id,
            imageUrl: p.imageUrl,
            description: p.description
        })).sort((a,b) => a.id.localeCompare(b.id));
    }, []);

    const scenarios = useMemo(() => [
        { name: "Terral", ...PlaceHolderImages.find(p => p.id === 'scenario-bosque-seco') },
        { name: "Civika", ...PlaceHolderImages.find(p => p.id === 'scenario-ciudad') },
        { name: "Mareva", ...PlaceHolderImages.find(p => p.id === 'scenario-mar-costero') },
        { name: "Manglia", ...PlaceHolderImages.find(p => p.id === 'scenario-manglares') },
    ].filter(Boolean) as any[], []);


    const handleSignUpSubmit = async (data: SignUpData) => {
        if (!auth) {
            toast({ title: "Error", description: "Servicio de autenticación no disponible.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            await signUp(auth, data.email, data.clave);
            setSignupData(data);
            setFormName(data.nombre);
            setStep('avatar');
        } catch (error: any) {
             if (error.code === 'auth/email-already-in-use') {
                toast({
                    title: "El correo ya está en uso",
                    description: "Parece que ya tienes una cuenta. Por favor, inicia sesión.",
                    variant: "destructive",
                    action: (
                        <Button variant="secondary" onClick={() => setStep('login')}>
                          Iniciar Sesión
                        </Button>
                    ),
                });
            } else {
                toast({
                    title: "Error de Registro",
                    description: "No se pudo crear la cuenta. Inténtalo de nuevo.",
                    variant: "destructive"
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSubmit = async (data: LoginData) => {
        if (!auth) {
             toast({ title: "Error", description: "Servicio de autenticación no disponible.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            await login(auth, data.email, data.clave);
            onLoginSuccess();
        } catch (error: any) {
            let message = "No se pudo iniciar sesión. Inténtalo de nuevo.";
             if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                message = "Correo o contraseña incorrectos.";
            }
            toast({
                title: "Error de Inicio de Sesión",
                description: message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarSelect = (avatarUrl: string) => {
        setSelectedAvatar(avatarUrl);
        setStep('yara'); 
    };

    const handleScenarioSelect = (scenarioUrl: string) => {
        setSelectedScenario(scenarioUrl);
    };

    const handleScenarioConfirm = () => {
        // Case 1: New user signing up
        if (formName && selectedAvatar && selectedScenario && signupData) {
            onComplete({
                name: formName,
                avatar: selectedAvatar,
                chosenScenario: selectedScenario,
                signupData: signupData,
            });
        // Case 2: Existing user re-onboarding after reset
        } else if (auth?.currentUser && selectedAvatar && selectedScenario) {
             onComplete({
                name: auth.currentUser.displayName || "Jugador",
                avatar: selectedAvatar,
                chosenScenario: selectedScenario,
                // No signupData here, as it's not a new registration
            });
        }
        else if (!selectedAvatar) {
            setStep('avatar');
             toast({
                title: "Falta un paso",
                description: "Por favor, selecciona un avatar para continuar.",
                variant: "destructive"
            });
        } else if (!selectedScenario) {
             toast({
                title: "Falta un paso",
                description: "Por favor, selecciona un escenario para continuar.",
                variant: "destructive"
            });
        }
         else {
            toast({
                title: "Error",
                description: "Faltan datos para completar el registro.",
                variant: "destructive"
            });
        }
    };
    
    const renderStep = () => {
        switch (step) {
            case 'welcome':
                return (
                    <AnimatedWelcome
                        onLoginClick={() => setStep('login')}
                        onCreateUserClick={() => setStep('signup')}
                    />
                );
            case 'signup':
                return (
                    <motion.div key="signup" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="w-full max-w-lg">
                        <SignUpForm onSubmit={handleSignUpSubmit} onSwitchToLogin={() => setStep('login')} isLoading={isLoading} />
                    </motion.div>
                );
            case 'login':
                return (
                    <motion.div key="login" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="w-full max-w-lg">
                        <LoginForm onSubmit={handleLoginSubmit} onSwitchToSignUp={() => setStep('signup')} isLoading={isLoading} />
                    </motion.div>
                );
            case 'avatar':
                 return (
                    <motion.div key="avatar" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full max-w-2xl">
                        <h2 className="text-3xl font-bold font-headline text-primary mb-6">Escoge tu Avatar</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {avatars.map(avatar => (
                                <Card key={avatar.id} onClick={() => handleAvatarSelect(avatar.imageUrl)} className="p-2 cursor-pointer hover:border-primary hover:scale-105 transition-transform duration-300">
                                    <div className="relative aspect-square w-full">
                                        <Image
                                            src={avatar.imageUrl}
                                            alt={avatar.description}
                                            fill
                                            style={{objectFit: 'contain'}}
                                            className="rounded-md"
                                        />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                 );
            case 'yara':
                return (
                     <motion.div key="yara" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-2xl">
                        {yaraCharImage && <Image src={yaraCharImage.imageUrl} alt="Yara" width={150} height={150} className="mx-auto mb-4" />}
                        <Card className="p-6 shadow-xl">
                            <h2 className="text-2xl font-bold font-headline text-primary">¡Hola, {formName || auth?.currentUser?.displayName || 'explorador'}!</h2>
                            <p className="mt-4 text-muted-foreground">Soy Yara, una rana muy curiosa y estaré contigo en este emocionante recorrido. A lo largo del camino conocerás 8 estaciones sorprendentes donde cada desafío superado abrirá nuevas etapas llenas de descubrimientos, aprendizajes y diversión. En el siguiente paso tendrás la oportunidad de escoger el lienzo que te permitirá crear tu propia estación. En cada avance ganarás recompensas especiales que tú mismo elegirás para completar la estación ideal que elijas. Cada paso te conectará más a la naturaleza y te mostrará cómo tus acciones pueden transformar el mundo que te rodea.</p>
                            <p className="mt-4 font-bold text-lg text-primary">¿Listo para comenzar este viaje conmigo?</p>
                            <Button onClick={() => setStep('scenario')} className="mt-6" size="lg">¡Sí!</Button>
                        </Card>
                     </motion.div>
                );
            case 'scenario':
                return (
                    <motion.div key="scenario" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full max-w-3xl">
                        <h2 className="text-3xl font-bold font-headline text-primary mb-2">Elige tu Lienzo</h2>
                        <p className="text-muted-foreground mb-6">Selecciona el escenario para tu estación personalizada.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {scenarios.map((scenario) => (
                                <Card 
                                    key={scenario.id} 
                                    onClick={() => handleScenarioSelect(scenario.imageUrl)} 
                                    className={cn(
                                        "p-2 cursor-pointer hover:border-primary hover:scale-105 transition-transform duration-300",
                                        selectedScenario === scenario.imageUrl && "border-primary border-4"
                                    )}
                                >
                                    <Image src={scenario.imageUrl} alt={scenario.description} width={200} height={200} className="rounded-md aspect-square object-cover" />
                                     <p className="font-bold mt-2 text-sm">{scenario.name}</p>
                                </Card>
                            ))}
                        </div>
                        
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-8">
                            <Button onClick={handleScenarioConfirm} size="lg">
                                Confirmar y Empezar Aventura
                            </Button>
                        </motion.div>
                        
                    </motion.div>
                );
            default:
                return null;
        }
    };
    
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden">
        <ResponsiveBackground />

        <div className="relative z-10 w-full flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </main>
    );
}
