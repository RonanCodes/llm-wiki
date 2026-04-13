import { Composition } from "remotion";
import { MarketingPromo } from "./compositions/marketing/MarketingPromo";
import { AppDemo } from "./compositions/demo/AppDemo";
import { PromoA } from "./compositions/promo-a/PromoA";
import { PromoB } from "./compositions/promo-b/PromoB";
import { PromoC } from "./compositions/promo-c/PromoC";
import { PromoV2Dark } from "./compositions/promo-v2/PromoV2Dark";
import { PromoV2 } from "./compositions/promo-v2/PromoV2";

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
      <Composition
        id="PromoA"
        component={PromoA}
        durationInFrames={1800} // 60s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoB"
        component={PromoB}
        durationInFrames={1800} // 60s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoC"
        component={PromoC}
        durationInFrames={1800} // 60s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoV2Dark"
        component={PromoV2Dark}
        durationInFrames={1800} // 60s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoV2"
        component={PromoV2}
        durationInFrames={1800} // 60s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
