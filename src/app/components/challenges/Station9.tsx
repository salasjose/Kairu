"use client";

import { useState } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Station9() {
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    return completed;
  };

  return (
    <ChallengeContainer
      stationId={9}
      title="Station 9: The Final Puzzle"
      description="You're almost there! Complete this final word search with terms from all the previous stations to prove your mastery."
      onChallengeComplete={handleComplete}
    >
      <Card>
        <CardHeader>
          <CardTitle>Eco-Word Search</CardTitle>
          <CardDescription>Find all the hidden environmental terms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">Word search game coming soon!</p>
          <Button onClick={() => setCompleted(true)}>Simulate Completion</Button>
        </CardContent>
      </Card>
    </ChallengeContainer>
  );
}
