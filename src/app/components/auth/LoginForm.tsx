
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
import { UserSquare, Lock } from "lucide-react";

const formSchema = z.object({
  usuario: z.string().min(1, { message: "El usuario no puede estar vacío." }),
  clave: z.string().min(1, { message: "La clave no puede estar vacía." }),
});

interface LoginFormProps {
    onSubmit: (data: z.infer<typeof formSchema>) => void;
    onSwitchToSignUp: () => void;
}

export default function LoginForm({ onSubmit, onSwitchToSignUp }: LoginFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usuario: "",
      clave: "",
    },
  });

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
              name="usuario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                        <UserSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Tu usuario" {...field} className="pl-10" />
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
                        <Input type="password" placeholder="••••••" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" size="lg">Iniciar Sesión</Button>
             <div className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Button variant="link" type="button" onClick={onSwitchToSignUp} className="p-0 h-auto">
                    Crea una ahora
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
