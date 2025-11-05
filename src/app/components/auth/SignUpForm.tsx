
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
import { Mail, User, Lock, Phone, Cake, UserSquare } from "lucide-react";

export const SignUpFormSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  apellido: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
  usuario: z.string().min(4, { message: "El usuario debe tener al menos 4 caracteres." }),
  email: z.string().email({ message: "Por favor ingresa un correo válido." }),
  clave: z.string().min(6, { message: "La clave debe tener al menos 6 caracteres." }),
  telefono: z.string().regex(/^\d{7,10}$/, { message: "Ingresa un número de teléfono válido (7-10 dígitos)." }),
  edad: z.coerce.number().int().positive({ message: "La edad debe ser un número positivo." }).min(5, { message: "Debes ser mayor de 5 años."}),
});

interface SignUpFormProps {
    onSubmit: (data: z.infer<typeof SignUpFormSchema>) => void;
    onSwitchToLogin: () => void;
    isLoading: boolean;
}

export default function SignUpForm({ onSubmit, onSwitchToLogin, isLoading }: SignUpFormProps) {
  const form = useForm<z.infer<typeof SignUpFormSchema>>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      usuario: "",
      email: "",
      clave: "",
      telefono: "",
      edad: '' as any,
    },
  });

  return (
    <Card className="w-full max-w-lg shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Crea tu Cuenta</CardTitle>
        <CardDescription>¡Únete a la aventura de Kairu!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                        <div className="relative flex items-center">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Tu nombre" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                         <div className="relative flex items-center">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Tu apellido" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="usuario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                        <UserSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Elige un usuario" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                     <div className="relative flex items-center">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="tu@correo.com" {...field} />
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
                  <FormControl>
                    <div className="relative flex items-center">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="password" placeholder="••••••" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                        <div className="relative flex items-center">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="tel" placeholder="3001234567" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="edad"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Edad</FormLabel>
                    <FormControl>
                        <div className="relative flex items-center">
                            <Cake className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="Tu edad" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Creando cuenta..." : "Guardar y Continuar"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{' '}
                <Button variant="link" type="button" onClick={onSwitchToLogin} className="p-0 h-auto" disabled={isLoading}>
                    Inicia Sesión
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
