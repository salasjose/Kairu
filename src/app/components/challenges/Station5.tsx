"use client";

import { useState } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Station5() {
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    if (!completed) {
      toast({
        title: "Challenge Not Completed",
        description: "Please complete the challenge before proceeding.",
        variant: "destructive",
      });
      return false;
    }
    toast({
      title: "Station 5 Complete!",
      description: "Knowledge is power! Well done for learning about sustainable design.",
    });
    return true;
  };

  return (
    <ChallengeContainer
      stationId={5}
      title="Station 5: Sustainable Design"
      description="Watch the videos below to learn about the principles of sustainable design and architecture."
      onChallengeComplete={handleComplete}
    >
      <Card>
        <CardHeader>
          <CardTitle>Educational Videos</CardTitle>
          <CardDescription>Learn from the experts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">Video player coming soon!</p>
          <Button onClick={() => setCompleted(true)}>Simulate Completion</Button>
        </CardContent>
      </Card>
    </ChallengeContainer>
  );
}
