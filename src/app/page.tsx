import BackgroundImage from "./components/BackgroundImage";
import GameClient from '@/app/components/GameClient';

export default function HomePage() {
  return (
    <BackgroundImage>
      <GameClient />
    </BackgroundImage>
  );
}
