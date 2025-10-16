"use client";

import { useState } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Station4() {
  const [completedChallenge, setCompletedChallenge] = useState<string | null>(null);

  const handleComplete = () => {
    if (!completedChallenge) {
      toast({
        title: "Challenge Not Completed",
        description: "Please complete one of the challenges before proceeding.",
        variant: "destructive",
      });
      return false;
    }
    toast({
      title: "Station 4 Complete!",
      description: "You're a water conservation champion!",
    });
    return true;
  };

  return (
    <ChallengeContainer
      stationId={4}
      title="Station 4: Water Resources"
      description="Choose one of the challenges below to demonstrate your commitment to water conservation."
      onChallengeComplete={handleComplete}
    >
      <Tabs defaultValue="quiz" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quiz">Water Quiz</TabsTrigger>
          <TabsTrigger value="post">Conservation Post</TabsTrigger>
        </TabsList>
        <TabsContent value="quiz">
          <Card>
            <CardHeader>
              <CardTitle>Water Quiz</CardTitle>
              <CardDescription>Answer 10 questions about water conservation in a 'Who Wants to Be a Millionaire' style game.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">Quiz game coming soon!</p>
              <Button onClick={() => setCompletedChallenge("quiz")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="post">
          <Card>
            <CardHeader>
              <CardTitle>Conservation Post</CardTitle>
              <CardDescription>Create a post on social media about water conservation and share the link with us.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">URL submission coming soon!</p>
              <Button onClick={() => setCompletedChallenge("post")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChallengeContainer>
  );
}
