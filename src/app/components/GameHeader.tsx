
"use client";

import { signOut } from "firebase/auth";
import { LogOut, MoreVertical, Settings } from "lucide-react";
import { useAuth } from "@/firebase";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import Logo from "./Logo";
import PrizeCart from "./PrizeCart";
import SettingsPanel from "./SettingsPanel";
import type { PlayerState } from "./GameClient";
import { useToast } from "@/hooks/use-toast";

interface GameHeaderProps {
  playerState: PlayerState;
  setPlayerState: (state: PlayerState | null) => void;
  onFullReset: () => void;
}

export default function GameHeader({ playerState, setPlayerState, onFullReset }: GameHeaderProps) {
  const auth = useAuth();
  const { clearCart } = usePrizeCart();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    if (!auth) {
        toast({
            title: "Error",
            description: "Servicio de autenticación no disponible.",
            variant: "destructive"
        });
        return;
    };
    
    // Limpia solo el estado local y el carrito temporal, no el progreso en la DB.
    await clearCart();
    setPlayerState(null);
    
    // Cierra la sesión del usuario.
    await signOut(auth);

    toast({
        title: "Sesión Cerrada",
        description: "¡Vuelve pronto!"
    });
  }

  return (
    <header className="absolute top-0 left-0 right-0 p-2 sm:p-4 z-20">
      <div className="container mx-auto flex items-center justify-between gap-2">
        <div className="bg-white/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-2xl flex items-center gap-2 sm:gap-3 shadow-md">
          <Logo className="h-8 sm:h-10" />
          <div className="pr-2 hidden sm:block">
            <p className="text-sm text-primary/80 leading-tight">
              ¡Bienvenido, {playerState.name}!
            </p>
          </div>
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-white">
            <AvatarImage src={playerState.avatar} alt="Player Avatar" className="object-contain" />
            <AvatarFallback>{playerState?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full bg-white/90 shadow-md h-10 w-10">
                <Settings />
              </Button>
            </SheetTrigger>
            <SettingsPanel playerState={playerState} setPlayerState={setPlayerState} onFullReset={onFullReset} />
          </Sheet>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full bg-white/90 shadow-md h-10 w-auto px-4">
            Salir
          </Button>
          <PrizeCart />
        </div>
        
        {/* Mobile Menu */}
        <div className="sm:hidden flex items-center gap-2">
          <PrizeCart />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full bg-white/90 shadow-md h-10 w-10">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Sheet>
                <SheetTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                </SheetTrigger>
                <SettingsPanel playerState={playerState} setPlayerState={setPlayerState} onFullReset={onFullReset} />
              </Sheet>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Salir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
