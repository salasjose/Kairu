
"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useStationProgress } from '@/hooks/use-station-progress';
import { usePrizeCart } from '@/hooks/use-prize-cart';
import { useChallengeProgress } from '@/hooks/use-challenge-progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import type { PlayerState } from './GameClient';

interface SettingsPanelProps {
    playerState: PlayerState;
    setPlayerState: (state: PlayerState | null) => void;
    onFullReset: () => void;
}

export default function SettingsPanel({ playerState, setPlayerState, onFullReset }: SettingsPanelProps) {
    const db = useFirestore();
    const { resetProgress } = useStationProgress();
    const { clearCart } = usePrizeCart();
    const { resetChallengeProgress } = useChallengeProgress();
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const avatars = useMemo(() => {
        return PlaceHolderImages.filter(p => p.id.startsWith('avatar-')).map(p => ({
            id: p.id,
            imageUrl: p.imageUrl,
            description: p.description
        })).sort((a, b) => a.id.localeCompare(b.id));
    }, []);

    const scenarios = useMemo(() => [
        { name: "Terral", imageUrl: '/backgrounds/Bosque_Seco_Tropical.png' },
        { name: "Civika", imageUrl: '/backgrounds/Ciudad_Sostenible.png' },
        { name: "Mareva", imageUrl: '/backgrounds/Mar_Costero.png' },
        { name: "Manglia", imageUrl: '/backgrounds/Manglares.png' },
    ], []);
    
    const chosenScenarioDetails = useMemo(() => {
        if (!playerState.chosenScenario) return null;
        return scenarios.find(s => playerState.chosenScenario.includes(s.imageUrl));
    }, [playerState.chosenScenario, scenarios]);

    const handleAvatarChange = async (newAvatarUrl: string) => {
        if (!playerState || !db || !playerState.id) {
            toast({ title: "Error", description: "No se pudo actualizar el avatar. Intenta más tarde.", variant: "destructive" });
            return;
        };

        const updatedState = { ...playerState, avatar: newAvatarUrl };
        setPlayerState(updatedState);
        toast({ title: "Avatar Actualizado", description: "Tu nuevo avatar ha sido guardado." });

        try {
            const playerDocRef = doc(db, 'users', playerState.id);
            await updateDoc(playerDocRef, { avatar: newAvatarUrl });
        } catch (error) {
            console.error("Failed to update avatar in Firestore:", error);
            toast({ title: "Error de Sincronización", description: "No se pudo guardar el avatar en la nube.", variant: "destructive" });
        }
    };

    const handleClearCacheAndReset = async () => {
        if (!playerState.id || !db) {
            toast({ title: "Error", description: "No se puede reiniciar. Intenta iniciar sesión de nuevo.", variant: "destructive" });
            return;
        }

        await resetProgress();
        clearCart();
        resetChallengeProgress();
        onFullReset();

        toast({
            title: "Reinicio Completo",
            description: "Tu progreso ha sido borrado. ¡Puedes empezar una nueva aventura!"
        });
        setIsAlertOpen(false);
    };

    return (
        <>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es irreversible. Se borrará permanentemente de la base de datos todo tu progreso en el juego (fotos, enlaces, insignias, etc.). Tu cuenta de usuario se conservará, pero tendrás que empezar una nueva aventura desde el principio, eligiendo un nuevo avatar y escenario.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCacheAndReset} className='bg-destructive hover:bg-destructive/90'>Sí, borrar mi progreso</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <SheetContent className="flex flex-col">
                <SheetHeader>
                    <SheetTitle>Configuración</SheetTitle>
                    <SheetDescription>Personaliza tu experiencia en Kairu.</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-8 flex-grow overflow-y-auto">
                    <div>
                        <h3 className="font-semibold mb-4 text-lg">Cambiar Avatar</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {avatars.map(avatar => (
                                <button
                                    key={avatar.id}
                                    onClick={() => handleAvatarChange(avatar.imageUrl)}
                                    className={cn(
                                        "p-2 rounded-lg border-2 transition-all",
                                        playerState.avatar === avatar.imageUrl
                                            ? "border-primary bg-primary/10 shadow-lg scale-105"
                                            : "border-border hover:bg-accent"
                                    )}
                                >
                                    <div className="relative w-full aspect-square">
                                        <Image
                                            src={avatar.imageUrl}
                                            alt={avatar.description}
                                            fill
                                            className="rounded-md object-contain"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4 text-lg">Tu Lienzo</h3>
                        {chosenScenarioDetails ? (
                             <div className="rounded-lg border p-2 bg-card">
                                 <div className="relative w-full aspect-video">
                                     <Image
                                         src={chosenScenarioDetails.imageUrl}
                                         alt={`Lienzo seleccionado: ${chosenScenarioDetails.name}`}
                                         fill
                                         className="rounded-md object-cover"
                                     />
                                 </div>
                                 <p className="font-bold text-center mt-2">{chosenScenarioDetails.name}</p>
                             </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No has seleccionado un lienzo todavía.</p>
                        )}
                    </div>
                </div>
                <SheetFooter className="mt-auto pt-4 border-t">
                    <Button variant="destructive" className="w-full" onClick={() => setIsAlertOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Reiniciar Progreso del Juego
                    </Button>
                </SheetFooter>
            </SheetContent>
        </>
    );
}
