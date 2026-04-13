import { Composition } from "remotion";
import { MarketingPromo } from "./compositions/marketing/MarketingPromo";
import { AppDemo } from "./compositions/demo/AppDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MarketingPromo"
        component={MarketingPromo}
        durationInFrames={900} // 30s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AppDemo"
        component={AppDemo}
        durationInFrames={2700} // 90s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
