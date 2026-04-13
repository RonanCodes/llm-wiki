import { Composition } from "remotion";
import { MarketingPromo } from "./compositions/marketing/MarketingPromo";
import { AppDemo } from "./compositions/demo/AppDemo";
import { PromoA } from "./compositions/promo-a/PromoA";
import { PromoB } from "./compositions/promo-b/PromoB";
import { PromoC } from "./compositions/promo-c/PromoC";
import { PromoV2Dark } from "./compositions/promo-v2/PromoV2Dark";
import { PromoV2 } from "./compositions/promo-v2/PromoV2";
import { PromoV3 } from "./compositions/promo-v3/PromoV3";
import { PromoV3Synth } from "./compositions/promo-v3/PromoV3Synth";
import { PromoV4 } from "./compositions/promo-v3/PromoV4";
import { PromoV5 } from "./compositions/promo-v3/PromoV5";
import { PromoV6 } from "./compositions/promo-v3/PromoV6";
import { PromoV7 } from "./compositions/promo-v3/PromoV7";
import { PromoV8 } from "./compositions/promo-v3/PromoV8";
import { PromoV9 } from "./compositions/promo-v3/PromoV9";

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
      <Composition
        id="PromoV3"
        component={PromoV3}
        durationInFrames={1590} // 53s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoV3Synth"
        component={PromoV3Synth}
        durationInFrames={1590} // 53s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoV4"
        component={PromoV4}
        durationInFrames={1560} // 52s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoV5"
        component={PromoV5}
        durationInFrames={1560} // 52s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoV6"
        component={PromoV6}
        durationInFrames={1560} // 52s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoV7"
        component={PromoV7}
        durationInFrames={1560} // 52s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoV8"
        component={PromoV8}
        durationInFrames={1560} // 52s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoV9"
        component={PromoV9}
        durationInFrames={1560} // 52s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
