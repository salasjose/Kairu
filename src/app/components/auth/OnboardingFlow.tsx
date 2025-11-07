'use client';

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

import Logo from '@/app/components/Logo';
import SignUpForm from './SignUpForm';
import LoginForm from './LoginForm';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { signUp, login } from '@/firebase/auth';
import { useAuth } from '@/firebase/hooks';
import type { z } from "zod";
import { Button } from '@/components/ui/button';
import AnimatedWelcome from './AnimatedWelcome';
import TypewriterText from './TypewriterText';


// We can infer the types from the SignUpForm's schema directly
import { type SignUpFormSchema } from './SignUpForm';
import { type LoginFormSchema } from './LoginForm';

type SignUpData = z.infer<typeof SignUpFormSchema>;
type LoginData = z.infer<typeof LoginFormSchema>;

interface OnboardingFlowProps {
    onComplete: (data: {
        name: string;
        avatar: string;
        chosenScenario: string;
    }) => void;
    onLoginSuccess: () => void;
}

type Step = 'loading' | 'welcome' | 'signup' | 'login' | 'avatar' | 'yara' | 'scenario';

export default function OnboardingFlow({ onComplete, onLoginSuccess }: OnboardingFlowProps) {
    const auth = useAuth();
    const [step, setStep] = useState<Step>('loading');
    const [formName, setFormName] = useState<string>('');
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const background = useMemo(() => PlaceHolderImages.find(p => p.id === 'map-background'), []);
    const yaraCharImage = useMemo(() => PlaceHolderImages.find((p) => p.id === 'char-yara'), []);
    const avatars = useMemo(() => PlaceHolderImages.filter(p => p.id.startsWith('avatar-')).sort((a,b) => a.id.localeCompare(b.id)), []);

    const scenarios = useMemo(() => [
        PlaceHolderImages.find(p => p.id === 'scenario-bosque-seco'),
        PlaceHolderImages.find(p => p.id === 'scenario-ciudad'),
        PlaceHolderImages.find(p => p.id === 'scenario-mar-costero'),
        PlaceHolderImages.find(p => p.id === 'scenario-manglares'),
    ].filter(Boolean) as any[], []);


    useEffect(() => {
        setStep('welcome');
    }, []);

    const handleSignUpSubmit = async (data: SignUpData) => {
        if (!auth) {
            toast({ title: "Error", description: "Servicio de autenticación no disponible.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            await signUp(auth, data.email, data.clave);
            // After successful sign-up, onAuthStateChanged in FirebaseProvider will trigger.
            // GameClient will detect the new user, fetchPlayerState will see no doc, and keep isNewUser=true.
            // We can then proceed with the rest of the onboarding.
            setFormName(data.nombre);
            setStep('avatar');
        } catch (error: any) {
            const message = error.code === 'auth/email-already-in-use'
                ? "Este correo electrónico ya está en uso."
                : "No se pudo crear la cuenta. Inténtalo de nuevo.";
            toast({
                title: "Error de Registro",
                description: message,
                variant: "destructive"
            });
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
            // onAuthStateChanged in the provider will handle setting the user.
            // GameClient will see the user and call fetchPlayerState, which will find the existing doc.
            onLoginSuccess();
        } catch (error: any) {
            const message = (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential')
                ? "Correo o contraseña incorrectos."
                : "No se pudo iniciar sesión. Inténtalo de nuevo.";
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
        if (formName && selectedAvatar && selectedScenario) {
            onComplete({
                name: formName,
                avatar: selectedAvatar,
                chosenScenario: selectedScenario,
            });
        } else {
            toast({
                title: "Error",
                description: "Faltan datos para completar el registro.",
                variant: "destructive"
            });
        }
    };
    
    const yaraDialogText1 = "Soy Yara, una rana muy curiosa y estaré contigo en este emocionante recorrido por Kairu.";
    const yaraDialogText2 = "A lo largo del camino conocerás 8 estaciones sorprendentes donde cada desafío superado abrirá nuevas etapas llenas de descubrimientos, aprendizajes y diversión. En el siguiente paso tendrás la oportunidad de escoger el lienzo que te permitirá crear tu propia estación.";
    const yaraDialogText3 = "En cada avance ganarás recompensas especiales que tú mismo elegirás para completar la estación ideal que elijas.";
    const yaraDialogText4 = "Cada paso te conectará más a la naturaleza y te mostrará cómo tus acciones pueden transformar el mundo que te rodea.";
    
    const renderStep = () => {
        switch (step) {
             case 'loading':
                return (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center text-center"
                    >
                        <Logo className="h-24 w-24 md:h-32 md:w-32 mx-auto text-primary animate-pulse" />
                        <h1 className="text-5xl md:text-6xl font-bold font-headline text-primary mt-4 text-3d">KAIRU</h1>
                    </motion.div>
                );
            case 'welcome':
                return (
                     <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatedWelcome
                            onLoginClick={() => setStep('login')}
                            onCreateUserClick={() => setStep('signup')}
                        />
                    </motion.div>
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
                                            style={{objectFit: 'cover'}}
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
                            <h2 className="text-2xl font-bold font-headline text-primary">¡Hola, {formName}!</h2>
                            
                            <div className='text-muted-foreground text-left'>
                                <TypewriterText text={yaraDialogText1} el="p" className="mt-4" />
                                <TypewriterText text={yaraDialogText2} el="p" className="mt-2" delay={yaraDialogText1.length * 0.02} />
                                <TypewriterText text={yaraDialogText3} el="p" className="mt-2" delay={(yaraDialogText1.length + yaraDialogText2.length) * 0.02} />
                                <TypewriterText text={yaraDialogText4} el="p" className="mt-2" delay={(yaraDialogText1.length + yaraDialogText2.length + yaraDialogText3.length) * 0.02} />
                            </div>

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
                            {scenarios.map((scenario, index) => (
                                <Card 
                                    key={scenario.id} 
                                    onClick={() => handleScenarioSelect(scenario.imageUrl)} 
                                    className={cn(
                                        "p-2 cursor-pointer hover:border-primary hover:scale-105 transition-transform duration-300",
                                        selectedScenario === scenario.imageUrl && "border-primary border-4"
                                    )}
                                >
                                    <Image src={scenario.imageUrl} alt={scenario.description} width={200} height={200} className="rounded-md aspect-square object-cover" />
                                     <p className="font-bold mt-2 text-sm">Escenario {index + 1}</p>
                                </Card>
                            ))}
                        </div>
                        {selectedScenario && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-8">
                                <Button onClick={handleScenarioConfirm} size="lg">
                                    Confirmar y Empezar Aventura
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <main className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden">
            {/* Fondo ocupando todo con Next/Image fill (mejor performance que CSS url) */}
            <div className="absolute inset-0 -z-10">
                 {background?.imageUrl && (
                    <Image
                        src={background.imageUrl}
                        alt={background.description}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                )}
                {/* Veladura para contraste de UI */}
                <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Contenido */}
            <div className="relative z-10 w-full flex items-center justify-center p-4">
                 <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </div>
        </main>
    );
}
