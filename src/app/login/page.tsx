
'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { countries } from "@/lib/data";
import { useAuth } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "../components/Logo";


const formSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.date().optional(),
  country: z.string().optional(),
});

const registerSchema = formSchema.extend({
    firstName: z.string().min(1, { message: "El nombre es requerido." }),
    lastName: z.string().min(1, { message: "El apellido es requerido." }),
    dateOfBirth: z.date({ required_error: "La fecha de nacimiento es requerida." }),
    country: z.string().min(1, { message: "El país es requerido." }),
});

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState('');

  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoginView) {
      // Preload a random profile image for the registration form
      const seed = Math.floor(Math.random() * 1000);
      setProfileImage(`https://picsum.photos/seed/${seed}/200/200`);
    }
  }, [isLoginView]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(isLoginView ? formSchema : registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        if (isLoginView) {
            // Login logic
            await signInWithEmailAndPassword(auth, values.email, values.password);
            toast({ title: "¡Bienvenido de nuevo!" });
            router.push('/');
        } else {
            // Register logic
            if (!values.firstName || !values.lastName || !values.dateOfBirth || !values.country) {
                throw new Error("Faltan campos de registro");
            }
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            // Save additional user data to Firestore
            const userRef = doc(firestore, "users", user.uid);
            await setDoc(userRef, {
                id: user.uid,
                firstName: values.firstName,
                lastName: values.lastName,
                dateOfBirth: values.dateOfBirth.toISOString(),
                country: values.country,
                username: values.email,
                profileImageUrl: profileImage,
            });

            toast({ title: "¡Registro exitoso!", description: "¡Bienvenido a Kairu!" });
            router.push('/');
        }
    } catch (error: any) {
        console.error(error);
        const errorCode = error.code;
        let message = "Ocurrió un error. Por favor, inténtalo de nuevo.";
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
            message = "Email o contraseña incorrectos.";
        } else if (errorCode === 'auth/email-already-in-use') {
            message = "Este email ya está registrado. Intenta iniciar sesión.";
        }
        toast({
            title: "Error de autenticación",
            description: message,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  const toggleView = () => {
    form.reset();
    setIsLoginView(!isLoginView);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="flex items-center gap-2 md:gap-4 mb-6">
          <Logo className="h-10 w-10 md:h-12 md:w-12" />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
              Kairu
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Una aventura interactiva de educación ambiental</p>
          </div>
        </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isLoginView ? "Iniciar Sesión" : "Crear Cuenta"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLoginView
              ? "Ingresa a tu cuenta para continuar tu aventura."
              : "Regístrate para comenzar tu viaje en Kairu."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isLoginView && (
                <>
                  <div className="flex justify-center mb-4">
                    <Image src={profileImage} alt="Profile Preview" width={100} height={100} className="rounded-full border-4 border-primary/20" data-ai-hint="profile avatar" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                                <Input placeholder="Tu nombre" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                                <Input placeholder="Tu apellido" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Elige una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>País</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tu país" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {countries.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                   </div>
                </>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Cargando..." : (isLoginView ? <> <LogIn className="mr-2"/> Iniciar Sesión </> : <> <UserPlus className="mr-2"/> Registrarse </>)}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {isLoginView ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
            <Button variant="link" onClick={toggleView} className="p-0 h-auto">
              {isLoginView ? "Regístrate" : "Inicia Sesión"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
