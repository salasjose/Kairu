"use client";

import { useState } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Station7() {
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
      title: "Station 7 Complete!",
      description: "Thanks for supporting green businesses!",
    });
    return true;
  };

  return (
    <ChallengeContainer
      stationId={7}
      title="Station 7: Green Business"
      description="Engage with local green businesses by completing one of the challenges below."
      onChallengeComplete={handleComplete}
    >
      <Tabs defaultValue="visit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visit">Business Visit</TabsTrigger>
          <TabsTrigger value="purchase">Product Purchase</TabsTrigger>
        </TabsList>
        <TabsContent value="visit">
          <Card>
            <CardHeader>
              <CardTitle>Green Business Visit Video</CardTitle>
              <CardDescription>Upload a video of your visit to a local green business and share the link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">URL submission coming soon!</p>
              <Button onClick={() => setCompletedChallenge("visit")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="purchase">
          <Card>
            <CardHeader>
              <CardTitle>Green Product Purchase</CardTitle>
              <CardDescription>Purchase a product from a green business and upload 4 photos of the item and store.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">Photo upload coming soon!</p>
              <Button onClick={() => setCompletedChallenge("purchase")}>Simulate Completion</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChallengeContainer>
  );
}
