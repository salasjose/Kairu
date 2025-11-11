import BackgroundImage from "./components/BackgroundImage";
import GameLoader from '@/app/components/GameLoader';

export default function HomePage() {
  return (
    <BackgroundImage>
      <GameLoader />
    </BackgroundImage>
  );
}
