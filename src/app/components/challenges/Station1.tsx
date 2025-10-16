"use client";

import { useState } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Station1() {
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
      title: "Station 1 Complete!",
      description: "Great job on the biodiversity challenge!",
    });
    return true;
  };

  return (
    <ChallengeContainer
      stationId={1}
      title="Station 1: Biodiversity"
      description="Choose one of the challenges below to prove your knowledge and contribution to local biodiversity."
      onChallengeComplete={handleComplete}
    >
      <Tabs defaultValue="species" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="species">Identify Species</TabsTrigger>
          <TabsTrigger value="habitat">Create Habitat</TabsTrigger>
        </TabsList>
        <TabsContent value="species">
          <Card>
            <CardHeader>
              <CardTitle>Challenge: Species Identification</CardTitle>
              <CardDescription>Match the flora and fauna to their names. You have 3 minutes and 3 attempts!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">Matching game coming soon!</p>
              <Button onClick={() => setCompletedChallenge("species")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="habitat">
          <Card>
            <CardHeader>
              <CardTitle>Challenge: Habitat Creation</CardTitle>
              <CardDescription>Upload 4 photos of you building and installing a feeder or water station for wildlife.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">Photo upload coming soon!</p>
              <Button onClick={() => setCompletedChallenge("habitat")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChallengeContainer>
  );
}
