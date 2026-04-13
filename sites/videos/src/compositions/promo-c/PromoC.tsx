import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import {
  TransitionSeries,
  springTiming,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { colors } from "../../styles/colors";
import { TerminalWindow } from "../../components/TerminalWindow";

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Scene 1 — Hook (120 frames / 4s)
// "One CLI command." + "47 cross-linked wiki pages."
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
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 82,
            fontWeight: 800,
            color: colors.amber,
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
            color: colors.textPrimary,
            fontFamily,
            fontWeight: 600,
            marginTop: 32,
            opacity: subtextOpacity,
            transform: `scale(${numberScale})`,
          }}
        >
          <span style={{ fontSize: 60, color: colors.amber, fontWeight: 800 }}>
            47
          </span>{" "}
          cross-linked wiki pages.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Problem (180 frames / 6s)
// "You read 200 articles a year." / "You remember maybe 10."
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
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
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
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const subtextY = interpolate(
    frame,
    [subtextDelay, subtextDelay + 20],
    [15, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
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
            color: colors.textPrimary,
            fontFamily,
            margin: 0,
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
          }}
        >
          You read{" "}
          <span style={{ fontSize: 64, color: colors.amber, fontWeight: 800 }}>
            200
          </span>{" "}
          articles a year.
        </p>
        <p
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: colors.textPrimary,
            fontFamily,
            margin: 0,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          You remember maybe{" "}
          <span style={{ fontSize: 64, color: colors.amber, fontWeight: 800 }}>
            10
          </span>
          .
        </p>
        <p
          style={{
            fontSize: 30,
            color: colors.textSecondary,
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
// Scene 3 — Solution (150 frames / 5s)
// "LLM Wiki" + subtext with cyan accents
// ---------------------------------------------------------------------------
const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  const subtextOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [25, 45], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
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
            color: colors.textPrimary,
            fontFamily,
            margin: 0,
            transform: `scale(${headlineScale})`,
          }}
        >
          LLM Wiki
        </h1>
        <p
          style={{
            fontSize: 32,
            color: colors.textSecondary,
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
          <span style={{ color: colors.cyan, fontWeight: 700 }}>
            persistent
          </span>
          ,{" "}
          <span style={{ color: colors.cyan, fontWeight: 700 }}>
            interlinked
          </span>{" "}
          knowledge base that grows every time you feed it.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Ingest Demo (240 frames / 8s)
// Terminal: /ingest YouTube URL
// ---------------------------------------------------------------------------
const IngestDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [170, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
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
          gap: 32,
        }}
      >
        <TerminalWindow
          command="/ingest https://youtube.com/watch?v=zjkBMFhNj_g"
          output={[
            "📥 Pulling transcript via yt-dlp...",
            "✓ Created wiki/sources/karpathy-llm-os.md",
            "✓ Created wiki/entities/andrej-karpathy.md",
            "✓ Created wiki/concepts/llm-operating-system.md",
            "→ Transcript + entities + concepts extracted",
          ]}
          startFrame={0}
        />
        <p
          style={{
            fontSize: 26,
            color: colors.amber,
            fontFamily,
            fontWeight: 600,
            opacity: labelOpacity,
            textAlign: "center",
          }}
        >
          Web. YouTube. PDF. GitHub. Reddit. 10+ types.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Query Demo (240 frames / 8s)
// Terminal: /query "Compare transformer architectures"
// ---------------------------------------------------------------------------
const QueryDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [170, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
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
          gap: 32,
        }}
      >
        <TerminalWindow
          command='/query "Compare transformer architectures"'
          output={[
            "Synthesizing from 8 sources...",
            "→ Original transformer uses encoder-decoder...",
            "→ GPT uses decoder-only...",
            "→ See [[attention-mechanisms]], [[gpt-architecture]]",
          ]}
          startFrame={0}
        />
        <p
          style={{
            fontSize: 26,
            color: colors.cyan,
            fontFamily,
            fontWeight: 600,
            opacity: labelOpacity,
            textAlign: "center",
          }}
        >
          Grounded answers from your own research.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — Compounding (240 frames / 8s)
// Animated counter: 5 → 50 → 500
// ---------------------------------------------------------------------------
const Compounding: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Counter phases: 5 at 0-60, 50 at 60-120, 500 at 120+
  const phase1End = 60;
  const phase2End = 120;

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

  const subtextOpacity = interpolate(frame, [140, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [140, 160], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const labelOpacity = interpolate(frame, [180, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {/* Large animated counter */}
        <div
          style={{
            fontSize: 180,
            fontWeight: 900,
            color: colors.amber,
            fontFamily,
            transform: `scale(${numberScale})`,
            lineHeight: 1,
          }}
        >
          {getActiveNumber()}
        </div>
        <p
          style={{
            fontSize: 36,
            color: colors.textMuted,
            fontFamily,
            fontWeight: 600,
            marginTop: 8,
          }}
        >
          pages
        </p>

        <p
          style={{
            fontSize: 28,
            color: colors.textSecondary,
            fontFamily,
            fontWeight: 500,
            marginTop: 40,
            maxWidth: 800,
            lineHeight: 1.5,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          Each ingest creates entities, concepts, and cross-references
          automatically.
        </p>

        <p
          style={{
            fontSize: 24,
            color: colors.green,
            fontFamily,
            fontWeight: 600,
            marginTop: 16,
            opacity: labelOpacity,
          }}
        >
          The graph grows itself.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 — Tech Stack (180 frames / 6s)
// Label: value format with accent colors
// ---------------------------------------------------------------------------
const TechStack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rows = [
    { label: "Engine:", value: "Claude Code", color: colors.amber },
    { label: "Interface:", value: "Your terminal", color: colors.cyan },
    { label: "Viewer:", value: "Obsidian", color: colors.green },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 200px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
        {rows.map((row, i) => {
          const delay = i * 15;
          const rowProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 180 },
          });
          const opacity = interpolate(rowProgress, [0, 1], [0, 1]);
          const x = interpolate(rowProgress, [0, 1], [60, 0]);

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateX(${x}px)`,
                display: "flex",
                alignItems: "baseline",
                gap: 20,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  color: colors.textMuted,
                  fontFamily,
                  fontWeight: 500,
                  minWidth: 200,
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: 44,
                  color: row.color,
                  fontFamily,
                  fontWeight: 700,
                }}
              >
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 8 — CTA (150 frames / 5s)
// "Build yours in 5 minutes."
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

  // Subtle glow pulse on headline
  const glowIntensity = interpolate(
    frame,
    [50, 80, 110, 140],
    [0, 8, 0, 8],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
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
            color: colors.amber,
            fontFamily,
            margin: 0,
            textShadow: `0 0 ${glowIntensity}px ${colors.amber}88`,
          }}
        >
          Build yours in 5 minutes.
        </h1>
        <p
          style={{
            fontSize: 30,
            color: colors.cyan,
            fontFamily,
            fontWeight: 600,
            marginTop: 32,
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
          }}
        >
          github.com/RonanCodes/llm-wiki
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Composition — 1800 frames / 60s @ 30fps
// ---------------------------------------------------------------------------
const TRANSITION_DURATION = 15;

export const PromoC: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {/* Scene 1 — Hook: 0-120 frames (4s) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 15 } })}
        />

        {/* Scene 2 — Problem: 120-300 frames (6s) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 3 — Solution: 300-450 frames (5s) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <Solution />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 15 } })}
        />

        {/* Scene 4 — Ingest Demo: 450-690 frames (8s) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <IngestDemo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 5 — Query Demo: 690-930 frames (8s) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <QueryDemo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 6 — Compounding: 930-1170 frames (8s) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <Compounding />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 7 — Tech Stack: 1170-1350 frames (6s) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <TechStack />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 10 } })}
        />

        {/* Scene 8 — CTA: 1350-1800 frames (5s + buffer) */}
        <TransitionSeries.Sequence durationInFrames={345}>
          <CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
