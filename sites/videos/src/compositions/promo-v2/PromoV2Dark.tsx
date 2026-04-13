import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  staticFile,
  Audio,
} from "remotion";
import {
  TransitionSeries,
  springTiming,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { dark } from "../../styles/colors";

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Ken Burns: slow zoom-in over the scene duration */
const useKenBurns = (
  frame: number,
  totalFrames: number,
  fromScale = 1.0,
  toScale = 1.08,
) =>
  interpolate(frame, [0, totalFrames], [fromScale, toScale], {
    extrapolateRight: "clamp",
  });

/** Volume fade callback — fade in first 30f, fade out last 60f */
const volumeFade = (f: number) => {
  const fadeIn = interpolate(f, [0, 30], [0, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(f, [1740, 1800], [0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(fadeIn, fadeOut);
};

// ---------------------------------------------------------------------------
// Screenshot card wrapper — dark variant with border instead of shadow
// ---------------------------------------------------------------------------
const ScreenshotCard: React.FC<{
  src: string;
  scale: number;
  borderColor?: string;
}> = ({ src, scale, borderColor = dark.border }) => (
  <div
    style={{
      borderRadius: 16,
      overflow: "hidden",
      border: `2px solid ${borderColor}`,
      backgroundColor: dark.bgCard,
      transform: `scale(${scale})`,
    }}
  >
    <Img
      src={staticFile(src)}
      style={{
        width: 1200,
        height: "auto",
        display: "block",
      }}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Source type badge
// ---------------------------------------------------------------------------
const SourceBadge: React.FC<{
  label: string;
  color: string;
  opacity: number;
  delay: number;
  frame: number;
}> = ({ label, color, opacity: _opacity, delay, frame }) => {
  const badgeOpacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeY = interpolate(frame, [delay, delay + 12], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <span
      style={{
        display: "inline-block",
        padding: "8px 20px",
        borderRadius: 24,
        backgroundColor: `${color}22`,
        border: `1px solid ${color}55`,
        color,
        fontSize: 20,
        fontWeight: 600,
        fontFamily,
        opacity: badgeOpacity,
        transform: `translateY(${badgeY}px)`,
      }}
    >
      {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Logo icon with optional brightness filter for dark backgrounds
// ---------------------------------------------------------------------------
const LogoIcon: React.FC<{
  src: string;
  size?: number;
  invert?: boolean;
  brightness?: number;
  opacity: number;
  scale: number;
}> = ({ src, size = 64, invert, brightness, opacity, scale }) => {
  const filters: string[] = [];
  if (invert) filters.push("invert(1)");
  if (brightness) filters.push(`brightness(${brightness})`);

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: size,
          height: size,
          filter: filters.length > 0 ? filters.join(" ") : undefined,
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 1 — Hook (0–120f)
// "One CLI command." / "47 cross-linked wiki pages."
// ---------------------------------------------------------------------------
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 120 },
  });
  const headlineOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const numberScale = spring({
    frame: frame - 40,
    fps,
    config: { damping: 8, stiffness: 100 },
  });
  const subtextOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 82,
            fontWeight: 800,
            color: dark.amber,
            margin: 0,
            fontFamily,
            transform: `scale(${headlineScale})`,
            opacity: headlineOpacity,
            lineHeight: 1.1,
          }}
        >
          One CLI command.
        </h1>
        <p
          style={{
            fontSize: 42,
            color: dark.textPrimary,
            fontFamily,
            fontWeight: 600,
            marginTop: 32,
            opacity: subtextOpacity,
            transform: `scale(${numberScale})`,
          }}
        >
          <span style={{ fontSize: 60, color: dark.amber, fontWeight: 800 }}>
            47
          </span>{" "}
          cross-linked wiki pages.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Problem (120–300f)
// "You read 200 articles a year." / "You remember maybe 10."
// "The problem isn't reading. It's retention."
// ---------------------------------------------------------------------------
const Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const line2Delay = 50;
  const subtextDelay = 100;

  const line1Opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [0, 15], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const line2Opacity = interpolate(
    frame,
    [line2Delay, line2Delay + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const line2Y = interpolate(frame, [line2Delay, line2Delay + 15], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const subtextOpacity = interpolate(
    frame,
    [subtextDelay, subtextDelay + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const subtextY = interpolate(
    frame,
    [subtextDelay, subtextDelay + 20],
    [15, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 120px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 1100,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: dark.textPrimary,
            fontFamily,
            margin: 0,
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
          }}
        >
          You read{" "}
          <span style={{ fontSize: 64, color: dark.amber, fontWeight: 800 }}>
            200
          </span>{" "}
          articles a year.
        </p>
        <p
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: dark.textPrimary,
            fontFamily,
            margin: 0,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          You remember maybe{" "}
          <span style={{ fontSize: 64, color: dark.amber, fontWeight: 800 }}>
            10
          </span>
          .
        </p>
        <p
          style={{
            fontSize: 30,
            color: dark.textSecondary,
            fontFamily,
            fontWeight: 500,
            marginTop: 24,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          The problem isn't reading. It's retention.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Solution (300–480f)
// "LLM Wiki" + three logos + "A persistent, interlinked knowledge base"
// ---------------------------------------------------------------------------
const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  // Logos stagger in
  const logo1Opacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logo1Scale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const logo2Opacity = interpolate(frame, [42, 57], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logo2Scale = spring({
    frame: frame - 42,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const logo3Opacity = interpolate(frame, [54, 69], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logo3Scale = spring({
    frame: frame - 54,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const subtextOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [70, 90], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 120px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: dark.textPrimary,
            fontFamily,
            margin: 0,
            transform: `scale(${headlineScale})`,
          }}
        >
          LLM Wiki
        </h1>

        {/* Three logos */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 48,
            marginTop: 36,
          }}
        >
          <LogoIcon
            src="assets/logos/claude-ai-icon.svg"
            size={56}
            opacity={logo1Opacity}
            scale={logo1Scale}
          />
          <LogoIcon
            src="assets/logos/terminal-icon.svg"
            size={56}
            invert
            opacity={logo2Opacity}
            scale={logo2Scale}
          />
          <LogoIcon
            src="assets/logos/obsidian-logo-gradient.svg"
            size={56}
            opacity={logo3Opacity}
            scale={logo3Scale}
          />
        </div>

        <p
          style={{
            fontSize: 32,
            color: dark.textSecondary,
            fontFamily,
            fontWeight: 500,
            marginTop: 28,
            maxWidth: 900,
            lineHeight: 1.5,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          A{" "}
          <span style={{ color: dark.cyan, fontWeight: 700 }}>persistent</span>,{" "}
          <span style={{ color: dark.cyan, fontWeight: 700 }}>interlinked</span>{" "}
          knowledge base
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Ingest Demo (480–750f)
// terminal-ingest.png with Ken Burns, source type badges
// ---------------------------------------------------------------------------
const IngestDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const totalFrames = 270;
  const scale = useKenBurns(frame, totalFrames);

  const badgeStartFrame = 140;
  const sourceTypes = [
    { label: "Web", color: dark.amber },
    { label: "YouTube", color: dark.cyan },
    { label: "PDF", color: dark.green },
    { label: "GitHub", color: dark.amber },
    { label: "Reddit", color: dark.cyan },
    { label: "Tweet", color: dark.green },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <ScreenshotCard
          src="assets/screenshots/terminal-ingest.png"
          scale={scale}
          borderColor={dark.border}
        />

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 900,
          }}
        >
          {sourceTypes.map((st, i) => (
            <SourceBadge
              key={st.label}
              label={st.label}
              color={st.color}
              opacity={1}
              delay={badgeStartFrame + i * 8}
              frame={frame}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Wiki Output (750–990f)
// obsidian-wiki-page.png with Ken Burns zoom
// "Structured. Cross-linked. Searchable."
// ---------------------------------------------------------------------------
const WikiOutput: React.FC = () => {
  const frame = useCurrentFrame();
  const totalFrames = 240;
  const scale = useKenBurns(frame, totalFrames, 1.02, 1.1);

  const labelOpacity = interpolate(frame, [140, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [140, 160], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <ScreenshotCard
          src="assets/screenshots/obsidian-wiki-page.png"
          scale={scale}
          borderColor={dark.border}
        />

        <p
          style={{
            fontSize: 28,
            color: dark.cyan,
            fontFamily,
            fontWeight: 600,
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            textAlign: "center",
            letterSpacing: 2,
          }}
        >
          Structured. Cross-linked. Searchable.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — Query Demo (990–1200f)
// terminal-query.png, "Ask your wiki. Get grounded answers."
// ---------------------------------------------------------------------------
const QueryDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const totalFrames = 210;
  const scale = useKenBurns(frame, totalFrames);

  const labelOpacity = interpolate(frame, [130, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [130, 150], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <ScreenshotCard
          src="assets/screenshots/terminal-query.png"
          scale={scale}
          borderColor={dark.border}
        />

        <p
          style={{
            fontSize: 28,
            color: dark.green,
            fontFamily,
            fontWeight: 600,
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            textAlign: "center",
          }}
        >
          Ask your wiki. Get grounded answers.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 — Graph View (1200–1410f)
// obsidian-graph-view.png with counter 5 → 50 → 500
// "The graph grows itself."
// ---------------------------------------------------------------------------
const GraphView: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = 210;
  const imgScale = useKenBurns(frame, totalFrames, 1.0, 1.06);

  // Counter phases: 5 at 0-50, 50 at 50-100, 500 at 100+
  const phase1End = 50;
  const phase2End = 100;

  const getActiveNumber = () => {
    if (frame < phase1End) return "5";
    if (frame < phase2End) return "50";
    return "500";
  };

  const getPhaseFrame = () => {
    if (frame < phase1End) return frame;
    if (frame < phase2End) return frame - phase1End;
    return frame - phase2End;
  };

  const numberScale = spring({
    frame: getPhaseFrame(),
    fps,
    config: { damping: 8, stiffness: 100 },
  });

  const labelOpacity = interpolate(frame, [130, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 60,
        }}
      >
        {/* Screenshot on left */}
        <div style={{ flex: "0 0 auto" }}>
          <ScreenshotCard
            src="assets/screenshots/obsidian-graph-view.png"
            scale={imgScale}
            borderColor={dark.border}
          />
        </div>

        {/* Counter + label on right */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 300,
          }}
        >
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              color: dark.amber,
              fontFamily,
              transform: `scale(${numberScale})`,
              lineHeight: 1,
            }}
          >
            {getActiveNumber()}
          </div>
          <p
            style={{
              fontSize: 22,
              color: dark.textMuted,
              fontFamily,
              fontWeight: 600,
              marginTop: 8,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            pages
          </p>
          <p
            style={{
              fontSize: 24,
              color: dark.green,
              fontFamily,
              fontWeight: 600,
              marginTop: 32,
              opacity: labelOpacity,
              textAlign: "center",
            }}
          >
            The graph grows itself.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 8 — CTA (1410–1800f)
// "Build yours in 5 minutes." + GitHub URL + logos
// ---------------------------------------------------------------------------
const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const urlOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const urlY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Logos fade in
  const logosOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logosScale = spring({
    frame: frame - 55,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  // Subtle glow pulse
  const glowIntensity = interpolate(
    frame,
    [50, 80, 110, 140],
    [0, 12, 0, 12],
    { extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{ textAlign: "center", transform: `scale(${headlineScale})` }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: dark.amber,
            fontFamily,
            margin: 0,
            textShadow: `0 0 ${glowIntensity}px ${dark.amber}88`,
          }}
        >
          Build yours in 5 minutes.
        </h1>

        <p
          style={{
            fontSize: 30,
            color: dark.cyan,
            fontFamily,
            fontWeight: 600,
            marginTop: 32,
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
          }}
        >
          github.com/RonanCodes/llm-wiki
        </p>

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 40,
            marginTop: 40,
            opacity: logosOpacity,
            transform: `scale(${logosScale})`,
          }}
        >
          <LogoIcon
            src="assets/logos/claude-ai-icon.svg"
            size={44}
            opacity={1}
            scale={1}
          />
          <LogoIcon
            src="assets/logos/terminal-icon.svg"
            size={44}
            invert
            opacity={1}
            scale={1}
          />
          <LogoIcon
            src="assets/logos/obsidian-logo-gradient.svg"
            size={44}
            opacity={1}
            scale={1}
          />
          <LogoIcon
            src="assets/logos/github-mark.svg"
            size={44}
            invert
            opacity={1}
            scale={1}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Composition — 1800 frames / 60s @ 30fps
// ---------------------------------------------------------------------------
const TRANSITION_DURATION = 15;

export const PromoV2Dark: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Background music */}
      <Audio
        src={staticFile("audio/kevin-macleod-digital-lemonade-90s.mp3")}
        volume={volumeFade}
      />

      <TransitionSeries>
        {/* Scene 1 — Hook: 0–120f (4s) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 15 } })}
        />

        {/* Scene 2 — Problem: 120–300f (6s) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 3 — Solution: 300–480f (6s) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <Solution />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 15 } })}
        />

        {/* Scene 4 — Ingest Demo: 480–750f (9s) */}
        <TransitionSeries.Sequence durationInFrames={270}>
          <IngestDemo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 5 — Wiki Output: 750–990f (8s) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <WikiOutput />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 6 — Query Demo: 990–1200f (7s) */}
        <TransitionSeries.Sequence durationInFrames={210}>
          <QueryDemo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 7 — Graph View: 1200–1410f (7s) */}
        <TransitionSeries.Sequence durationInFrames={210}>
          <GraphView />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 10 } })}
        />

        {/* Scene 8 — CTA: 1410–1800f (13s) */}
        <TransitionSeries.Sequence durationInFrames={390}>
          <CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
