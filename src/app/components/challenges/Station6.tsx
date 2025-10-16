"use client";

import { useState } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Station6() {
  const [completedChallenge, setCompletedChallenge] = useState<string | null>(null);

  const handleComplete = () => {
    return !!completedChallenge;
  };

  return (
    <ChallengeContainer
      stationId={6}
      title="Station 6: Circular Economy"
      description="Show us your understanding of circular economy principles by completing one of the video challenges."
      onChallengeComplete={handleComplete}
    >
      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="strategy">Marketing Strategy</TabsTrigger>
          <TabsTrigger value="visit">Business Visit</TabsTrigger>
        </TabsList>
        <TabsContent value="strategy">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Strategy Video</CardTitle>
              <CardDescription>Create a video explaining a marketing strategy for an upcycled or circular product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">URL submission coming soon!</p>
              <Button onClick={() => setCompletedChallenge("strategy")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="visit">
          <Card>
            <CardHeader>
              <CardTitle>Green Business Visit Video</CardTitle>
              <CardDescription>Create a video about a visit to a green business in your city, showcasing its circular practices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">URL submission coming soon!</p>
              <Button onClick={() => setCompletedChallenge("visit")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChallengeContainer>
  );
}
