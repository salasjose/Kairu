"use client";

import { useState } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Station2() {
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
      title: "Station 2 Complete!",
      description: "Fantastic! Keep up those sustainable habits.",
    });
    return true;
  };

  return (
    <ChallengeContainer
      stationId={2}
      title="Station 2: Sustainability Tracker"
      description="For 7 days, document a sustainable practice you perform each day by uploading a photo. A new slot will unlock every 24 hours."
      onChallengeComplete={handleComplete}
    >
      <Card>
        <CardHeader>
          <CardTitle>Your 7-Day Journey</CardTitle>
          <CardDescription>Track your progress and build lasting habits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">7-day photo journal coming soon!</p>
            <Button onClick={() => setCompleted(true)}>Simulate Completion</Button>
        </CardContent>
      </Card>
    </ChallengeContainer>
  );
}
