
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ArrowLeft, Lightbulb, Scale, PartyPopper, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

type Question = {
  question: string;
  options: string[];
  answer: string;
  hint: string;
};

const questions: Question[] = [
    { question: "¿Cuál es el porcentaje aproximado de agua dulce en la Tierra?", options: ["10%", "3%", "25%", "50%"], answer: "3%", hint: "Es mucho menos de lo que la mayoría de la gente piensa." },
    { question: "¿Qué es una cuenca hidrográfica?", options: ["Un tipo de presa", "Un río subterráneo", "Un área de tierra que drena agua a un punto común", "Un lago artificial"], answer: "Un área de tierra que drena agua a un punto común", hint: "Imagina un embudo gigante en el paisaje." },
    { question: "La 'huella hídrica' se refiere a:", options: ["La marca que deja el agua al secarse", "El volumen total de agua dulce utilizada para producir bienes y servicios", "Un mapa de ríos", "La profundidad de un pozo"], answer: "El volumen total de agua dulce utilizada para producir bienes y servicios", hint: "No es solo el agua que bebes, sino también la que 'comes' y 'vistes'." },
    { question: "¿Qué contaminante es una causa común de 'zonas muertas' en áreas marino-costeras?", options: ["Plástico", "Exceso de nutrientes (nitrógeno y fósforo)", "Petróleo", "Ruido"], answer: "Exceso de nutrientes (nitrógeno y fósforo)", hint: "Proviene a menudo de fertilizantes agrícolas y aguas residuales." },
    { question: "Una forma efectiva de conservar agua en casa es:", options: ["Dejar el grifo abierto al cepillarse los dientes", "Tomar baños largos", "Reparar fugas de agua", "Regar el jardín al mediodía"], answer: "Reparar fugas de agua", hint: "Una pequeña gota puede desperdiciar miles de litros al año." },
    { question: "Los ríos son importantes para los ecosistemas porque...", options: ["Solo sirven para la navegación", "Son fronteras naturales", "Transportan nutrientes, sedimentos y agua", "Son bonitos en las postales"], answer: "Transportan nutrientes, sedimentos y agua", hint: "Son como las venas del paisaje." },
    { question: "¿Qué es la 'eutrofización'?", options: ["Un método de purificación de agua", "El enriquecimiento excesivo de nutrientes en un cuerpo de agua", "La evaporación del agua", "La congelación de un río"], answer: "El enriquecimiento excesivo de nutrientes en un cuerpo de agua", hint: "Causa un crecimiento masivo de algas." },
    { question: "La zona marino-costera es crucial porque...", options: ["Solo es para turismo", "Actúa como barrera contra tsunamis y tormentas", "Es donde viven los tiburones", "Es buena para tomar el sol"], answer: "Actúa como barrera contra tsunamis y tormentas", hint: "Manglares y arrecifes de coral son protectores naturales." },
    { question: "El ciclo del agua también es conocido como:", options: ["Ciclo de Krebs", "Ciclo hidrológico", "Ciclo de carbono", "Ciclo lunar"], answer: "Ciclo hidrológico", hint: "Implica evaporación, condensación y precipitación." },
    { question: "¿Cuál de estos no es un método de conservación de agua en la agricultura?", options: ["Riego por goteo", "Cultivos resistentes a la sequía", "Riego por inundación", "Captación de agua de lluvia"], answer: "Riego por inundación", hint: "Es el método tradicional, pero a menudo el menos eficiente." },
];

interface QuizState {
  lives: number;
  lastLostTime: number | null;
  completed: boolean;
  score: {
    correct: number;
    incorrect: number;
  } | null;
}

interface WaterQuizProps {
  onComplete: () => void;
  onBack: () => void;
  onSwitchChallenge: () => void;
  isCompleted: boolean;
}

const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos

export default function WaterQuiz({ onComplete, onBack, onSwitchChallenge, isCompleted: isPersistedCompleted }: WaterQuizProps) {
  const { user } = useUser();
  const storageKey = user ? `kairu-water-quiz-progress-${user.uid}` : null;
  
  const [quizState, setQuizState] = useState<QuizState>({ lives: 3, lastLostTime: null, completed: false, score: null });
  const [shuffledQuestions] = useState<Question[]>(() => [...questions].sort(() => Math.random() - 0.5).slice(0, 10));
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [lifelines, setLifelines] = useState({ fiftyFifty: 1, hint: 1 });
  const [visibleOptions, setVisibleOptions] = useState<string[]>([]);
  const [lockoutTimer, setLockoutTimer] = useState("");

  const isCompleted = isPersistedCompleted || quizState.completed;
  const isBlocked = !!(quizState.lastLostTime && Date.now() - quizState.lastLostTime < LOCKOUT_DURATION_MS);

  const updateQuizState = useCallback((newState: Partial<QuizState>) => {
    setQuizState(prevState => {
      const updatedState = { ...prevState, ...newState };
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(updatedState));
      }
      return updatedState;
    });
  }, [storageKey]);
  
  const startNewGame = useCallback(() => {
    setCurrentQuestionIndex(0);
    setIncorrectAnswers(0);
    setTimeLeft(60);
    setSelectedOption(null);
    setIsAnswered(false);
    setLifelines({ fiftyFifty: 1, hint: 1 });
  }, []);

  useEffect(() => {
    if (storageKey) {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed: QuizState = JSON.parse(savedState);
        setQuizState(parsed);
        // If there's a lockout, immediately check it
        if (parsed.lastLostTime && Date.now() - parsed.lastLostTime < LOCKOUT_DURATION_MS) {
           // State is already locked, timer will start.
        } else if (parsed.lastLostTime) {
            // Lockout has expired, reset it
            updateQuizState({ lives: parsed.lives, lastLostTime: null });
        }
      }
    }
  }, [storageKey, updateQuizState]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBlocked && quizState.lastLostTime) {
        interval = setInterval(() => {
            const remaining = LOCKOUT_DURATION_MS - (Date.now() - (quizState.lastLostTime ?? 0));
            if (remaining <= 0) {
                updateQuizState({ lives: quizState.lives > 0 ? quizState.lives : 3, lastLostTime: null });
                setLockoutTimer("");
                clearInterval(interval);
            } else {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                setLockoutTimer(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, quizState.lastLostTime, quizState.lives, updateQuizState]);

  const currentQuestion = useMemo(() => shuffledQuestions[currentQuestionIndex], [shuffledQuestions, currentQuestionIndex]);

  useEffect(() => {
    if (currentQuestion) {
        setVisibleOptions(currentQuestion.options);
    }
  }, [currentQuestion]);
  
  const handleEndGame = useCallback(() => {
    const finalIncorrectCount = incorrectAnswers;
    const finalCorrectCount = 10 - finalIncorrectCount;

    if (finalIncorrectCount >= 4) {
        // Lose a life
        const newLives = quizState.lives - 1;
        toast({ title: "¡Ronda Perdida!", description: `Tuviste ${finalIncorrectCount} errores. ¡Has perdido una vida!`, variant: "destructive" });
        
        if (newLives <= 0) {
            // Lost all lives, block game
            updateQuizState({ lives: 0, lastLostTime: Date.now(), completed: false, score: null });
        } else {
            // Still have lives, reset for another round
            updateQuizState({ lives: newLives, lastLostTime: null, completed: false, score: null });
            startNewGame();
        }

    } else {
        // Win the game
        toast({ title: "¡Quiz Terminado!", description: `¡Excelente trabajo! Tuviste ${finalCorrectCount} respuestas correctas.` });
        updateQuizState({ completed: true, score: { correct: finalCorrectCount, incorrect: finalIncorrectCount } });
        onComplete();
    }
  }, [incorrectAnswers, onComplete, quizState.lives, startNewGame, updateQuizState]);
  
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
      setTimeLeft(60);
    } else {
      // Last question answered, end the game
      handleEndGame();
    }
  }, [currentQuestionIndex, shuffledQuestions.length, handleEndGame]);


  const handleAnswer = useCallback((option: string | null) => {
    if (isAnswered) return;
    setIsAnswered(true);
    
    if (option === null || option !== currentQuestion.answer) {
      setIncorrectAnswers(prev => prev + 1);
    }
    
    setSelectedOption(option);
    setTimeout(handleNextQuestion, 2000);
  }, [isAnswered, currentQuestion.answer, handleNextQuestion]);

  useEffect(() => {
    if (isAnswered || isBlocked || isCompleted) return;
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      handleAnswer(null); // Timeout counts as wrong answer
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isAnswered, isBlocked, isCompleted, handleAnswer]);


  const useFiftyFifty = () => {
    if (lifelines.fiftyFifty > 0 && !isAnswered) {
      const incorrectOptions = currentQuestion.options.filter(opt => opt !== currentQuestion.answer);
      const toRemove = incorrectOptions.sort(() => Math.random() - 0.5).slice(0, 2);
      setVisibleOptions(currentQuestion.options.filter(opt => !toRemove.includes(opt)));
      setLifelines(prev => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }));
    }
  };

  const useHint = () => {
    if (lifelines.hint > 0 && !isAnswered) {
      toast({ title: "Pista", description: currentQuestion.hint });
      setLifelines(prev => ({ ...prev, hint: prev.hint - 1 }));
    }
  };
  
  if (isCompleted && quizState.score) {
    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[500px]">
            <Card className="text-center w-full shadow-lg">
                <CardContent className="p-8">
                    <PartyPopper className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="font-bold text-2xl mb-2">¡Reto Completado!</h3>
                    <p className="text-muted-foreground mb-4">¡Felicitaciones! Ya superaste este reto. Tu resultado fue:</p>
                    <div className="text-lg space-y-1">
                        <p>Respuestas Correctas: <span className="font-bold text-green-500">{quizState.score.correct}</span></p>
                        <p>Respuestas Incorrectas: <span className="font-bold text-red-500">{quizState.score.incorrect}</span></p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                        <Button variant="outline" onClick={onBack}>Volver a Estación</Button>
                        <Button onClick={onSwitchChallenge}>Ver otro Reto</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (isBlocked) {
      return (
          <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-[500px]">
              <Card className="text-center w-full shadow-lg">
                  <CardContent className="p-8">
                      <Lock className="w-16 h-16 text-destructive mx-auto mb-4" />
                      <h3 className="font-bold text-2xl mb-2">Reto Bloqueado</h3>
                      <p className="text-muted-foreground mb-4">Has perdido todas tus vidas. El quiz se desbloqueará en:</p>
                      <p className="text-2xl font-bold text-destructive tabular-nums">{lockoutTimer}</p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                        <Button variant="outline" onClick={onBack}>Volver a Estación</Button>
                        <Button onClick={onSwitchChallenge}>Probar otro Reto</Button>
                      </div>
                  </CardContent>
              </Card>
          </div>
      );
  }

  if (!currentQuestion) {
    return <div className="text-center p-8">Cargando quiz...</div>;
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4 gap-2">
            <Button variant="ghost" onClick={onBack} className="self-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
            </Button>
            <div className="flex gap-2 flex-wrap justify-end">
                <Button variant="outline" size="sm" onClick={useFiftyFifty} disabled={lifelines.fiftyFifty <= 0 || isAnswered}>
                    <Scale className="mr-1 md:mr-2" /> 50/50 ({lifelines.fiftyFifty})
                </Button>
                <Button variant="outline" size="sm" onClick={useHint} disabled={lifelines.hint <= 0 || isAnswered}>
                    <Lightbulb className="mr-1 md:mr-2" /> Pista ({lifelines.hint})
                </Button>
            </div>
        </div>
        <Card className="w-full shadow-2xl bg-gradient-to-br from-blue-900 to-blue-950 text-white border-none">
            <CardHeader>
                <div className="flex justify-between items-center text-sm md:text-lg mb-2">
                    <span>Pregunta {currentQuestionIndex + 1} / 10</span>
                    <span>Vidas: {quizState.lives}</span>
                </div>
                <Progress value={(timeLeft / 60) * 100} className="w-full h-2 bg-blue-700" />
                 <CardTitle className="pt-4 text-center text-xl md:text-3xl font-bold min-h-[100px] flex items-center justify-center">
                    {currentQuestion.question}
                </CardTitle>
                <CardDescription className="text-center text-blue-200">Errores en esta partida: {incorrectAnswers}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {visibleOptions.map((option, index) => {
                        const isCorrect = option === currentQuestion.answer;
                        const isSelected = option === selectedOption;
                        
                        return (
                            <Button
                                key={index}
                                variant="outline"
                                className={cn(
                                    "text-base p-4 md:p-6 h-auto whitespace-normal justify-start text-left bg-blue-800/50 border-blue-600 hover:bg-blue-700/80",
                                    isAnswered && isCorrect && "bg-green-500 hover:bg-green-500 border-green-400 animate-pulse",
                                    isAnswered && isSelected && !isCorrect && "bg-red-500 hover:bg-red-500 border-red-400"
                                )}
                                onClick={() => handleAnswer(option)}
                                disabled={isAnswered}
                            >
                                <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span> {option}
                            </Button>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
