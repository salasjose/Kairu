"use client";

interface ChallengeContainerProps {
  stationId: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function ChallengeContainer({
  stationId,
  title,
  description,
  children,
}: ChallengeContainerProps) {

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">{title}</h2>
          <p className="text-muted-foreground mt-2 text-lg">{description}</p>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-xl shadow-md border">
          {children}
        </div>

      </div>
    </>
  );
}
