"use client";

import { useState } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Station3() {
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
      title: "Station 3 Complete!",
      description: "You're a waste management wizard!",
    });
    return true;
  };

  return (
    <ChallengeContainer
      stationId={3}
      title="Station 3: Waste Management"
      description="Show us how you're tackling waste! Complete one of the challenges below."
      onChallengeComplete={handleComplete}
    >
      <Tabs defaultValue="video-cleanup" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="video-cleanup" className="text-xs md:text-sm">Cleanup Video</TabsTrigger>
          <TabsTrigger value="video-separate" className="text-xs md:text-sm">Separation Video</TabsTrigger>
          <TabsTrigger value="game" className="text-xs md:text-sm">Recycling Game</TabsTrigger>
          <TabsTrigger value="photos-crafts" className="text-xs md:text-sm">Recycled Crafts</TabsTrigger>
        </TabsList>
        <TabsContent value="video-cleanup">
          <Card>
            <CardHeader>
              <CardTitle>Cleanup Video</CardTitle>
              <CardDescription>Upload a video of you in a cleanup drive to YouTube/Instagram/TikTok and paste the URL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">URL submission coming soon!</p>
              <Button onClick={() => setCompletedChallenge("video-cleanup")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="video-separate">
          <Card>
            <CardHeader>
              <CardTitle>Waste Separation Video</CardTitle>
              <CardDescription>Upload a video of you separating solid waste and paste the URL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">URL submission coming soon!</p>
              <Button onClick={() => setCompletedChallenge("video-separate")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="game">
          <Card>
            <CardHeader>
              <CardTitle>Recycling Game</CardTitle>
              <CardDescription>Play a fun game to test your waste sorting skills.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">Game coming soon!</p>
              <Button onClick={() => setCompletedChallenge("game")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="photos-crafts">
          <Card>
            <CardHeader>
              <CardTitle>Recycled Crafts Photos</CardTitle>
              <CardDescription>Upload 4 photos of accessories or decorations you've made from recycled materials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">Photo upload coming soon!</p>
              <Button onClick={() => setCompletedChallenge("photos-crafts")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChallengeContainer>
  );
}
