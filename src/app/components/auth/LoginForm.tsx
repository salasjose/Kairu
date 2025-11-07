
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase/hooks";
import { resetPassword } from "@/firebase/auth";

export const LoginFormSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un correo válido." }),
  clave: z.string().min(1, { message: "La clave no puede estar vacía." }),
});

interface LoginFormProps {
    onSubmit: (data: z.infer<typeof LoginFormSchema>) => void;
    onSwitchToSignUp: () => void;
    isLoading: boolean;
}

export default function LoginForm({ onSubmit, onSwitchToSignUp, isLoading }: LoginFormProps) {
  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      clave: "",
    },
  });
  const auth = useAuth();
  const { toast } = useToast();

  const handleForgotPassword = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { type: "manual", message: "Ingresa tu correo para restablecer la clave." });
      return;
    }
    if (!auth) {
        toast({ title: "Error", description: "Servicio de autenticación no disponible.", variant: "destructive" });
        return;
    }

    try {
        await resetPassword(auth, email);
        toast({
            title: "Correo enviado",
            description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
        });
    } catch (error: any) {
        console.error("Password reset failed:", error);
        toast({
            title: "Error",
            description: "No se pudo enviar el correo de restablecimiento. Verifica el correo e inténtalo de nuevo.",
            variant: "destructive",
        });
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Iniciar Sesión</CardTitle>
        <CardDescription>¡Qué bueno verte de nuevo!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="tu@correo.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clave"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clave</FormLabel>
                   <div className="flex justify-end">
                       <Button variant="link" type="button" onClick={handleForgotPassword} className="p-0 h-auto text-xs" disabled={isLoading}>
                            ¿Olvidaste tu contraseña?
                        </Button>
                    </div>
                  <FormControl>
                    <div className="relative flex items-center">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="password" placeholder="••••••" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Ingresando..." : "Iniciar Sesión"}
            </Button>
             <div className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Button variant="link" type="button" onClick={onSwitchToSignUp} className="p-0 h-auto" disabled={isLoading}>
                    Crea una ahora
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
