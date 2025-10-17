"use client";

import { usePrizeCart } from "@/hooks/use-prize-cart.tsx";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Gift, ShoppingCart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { allPrizes } from "@/lib/data";

export default function PrizeCart() {
    const { prizes, clearCart } = usePrizeCart();
    const collectedPrizes = allPrizes.filter(p => prizes.includes(p.id));

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Gift className="h-5 w-5" />
                    <span className="sr-only">Abrir carrito de recompensas</span>
                    {prizes.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {prizes.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Gift />
                        Carrito de Recompensas
                    </SheetTitle>
                    <SheetDescription>
                        Aquí están todas las insignias que has ganado en tu aventura.
                    </SheetDescription>
                </SheetHeader>
                {collectedPrizes.length > 0 ? (
                    <div className="flex flex-col h-[calc(100%-80px)]">
                        <ScrollArea className="flex-grow my-4">
                            <div className="grid grid-cols-3 gap-4 pr-4">
                                {collectedPrizes.map((prize) => {
                                    const Icon = prize.icon;
                                    return (
                                    <div
                                        key={prize.id}
                                        className="flex flex-col items-center justify-center p-2 border rounded-lg bg-card"
                                    >
                                        <Icon className="h-8 w-8 mb-1 text-primary" />
                                        <span className="text-xs text-center font-medium">{prize.name}</span>
                                    </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                        <Button variant="destructive" onClick={clearCart} className="mt-auto">
                            Vaciar Carrito
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-4/5 text-center">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="font-semibold">Tu carrito está vacío</h3>
                        <p className="text-sm text-muted-foreground">¡Completa estaciones para ganar insignias!</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
