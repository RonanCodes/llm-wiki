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
import { Typewriter } from "../../components/Typewriter";
import { WordReveal } from "../../components/WordReveal";
import { TerminalWindow } from "../../components/TerminalWindow";
import { FeatureRow } from "../../components/FeatureRow";

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Scene 1 — Hook (120 frames / 4s)
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

  const subtextOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
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
            fontSize: 76,
            fontWeight: 800,
            color: colors.amber,
            margin: 0,
            fontFamily,
            transform: `scale(${headlineScale})`,
            opacity: headlineOpacity,
            lineHeight: 1.1,
          }}
        >
          Stop re-googling
          <br />
          the same thing.
        </h1>
        <p
          style={{
            fontSize: 36,
            color: colors.textSecondary,
            fontFamily,
            fontWeight: 500,
            marginTop: 28,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          Build a wiki instead.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Problem (180 frames / 6s)
// ---------------------------------------------------------------------------
const Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const line2Delay = 50;
  const subtextDelay = 100;

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
          gap: 24,
          maxWidth: 1100,
        }}
      >
        <WordReveal
          text="47 open tabs. 3 bookmarks you'll never revisit."
          fontSize={44}
          fontWeight={700}
          color={colors.textPrimary}
          delayPerWord={5}
          startFrame={0}
        />
        <WordReveal
          text="Notes in six different apps."
          fontSize={44}
          fontWeight={700}
          color={colors.textPrimary}
          delayPerWord={5}
          startFrame={line2Delay}
        />
        <p
          style={{
            fontSize: 32,
            color: colors.amber,
            fontFamily,
            fontWeight: 600,
            marginTop: 16,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          You're not learning. You're just browsing.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Solution (150 frames / 5s)
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
            fontSize: 88,
            fontWeight: 800,
            color: colors.cyan,
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
            maxWidth: 800,
            lineHeight: 1.5,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          Claude builds your second brain.
          <br />
          You just point it at sources.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Ingest Demo (240 frames / 8s)
// ---------------------------------------------------------------------------
const IngestDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [160, 180], [0, 1], {
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
          command="/ingest https://arxiv.org/abs/2305.18290"
          output={[
            "📥 Fetching PDF...",
            "✓ Created wiki/sources/direct-preference-optimization.md",
            "✓ Created wiki/concepts/dpo.md",
            "✓ Created wiki/entities/rafael-rafailov.md",
            "→ 47 pages from one research session",
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
          Feed it anything. Get structured markdown.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Query Demo (240 frames / 8s)
// ---------------------------------------------------------------------------
const QueryDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [160, 180], [0, 1], {
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
          command='/query "What matters about attention mechanisms?"'
          output={[
            "Synthesizing from 12 sources...",
            "→ Self-attention computes weighted relationships...",
            "→ Multi-head attention allows parallel subspaces...",
            "Sources: [[attention-is-all-you-need]], [[transformer-survey]]",
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
          Your sources. Your answers.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — Compounding (240 frames / 8s)
// ---------------------------------------------------------------------------
const NODE_POSITIONS = [
  { x: 480, y: 200 },
  { x: 780, y: 160 },
  { x: 1080, y: 220 },
  { x: 600, y: 380 },
  { x: 900, y: 340 },
  { x: 1200, y: 370 },
  { x: 540, y: 520 },
  { x: 840, y: 500 },
  { x: 1140, y: 530 },
  { x: 720, y: 640 },
  { x: 1020, y: 620 },
  { x: 360, y: 440 },
];

const CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 4],
  [2, 5],
  [3, 4],
  [4, 5],
  [3, 6],
  [4, 7],
  [5, 8],
  [6, 7],
  [7, 8],
  [6, 9],
  [7, 10],
  [8, 10],
  [9, 10],
  [0, 11],
  [3, 11],
  [6, 11],
];

const Compounding: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  const graphStartFrame = 30;

  const subtextOpacity = interpolate(frame, [160, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [190, 210], [0, 1], {
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
      <div
        style={{
          textAlign: "center",
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
        }}
      >
        <h2
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: colors.textPrimary,
            fontFamily,
            margin: 0,
            transform: `scale(${headlineScale})`,
          }}
        >
          Every page makes the next one smarter.
        </h2>
      </div>

      {/* Connection lines */}
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {CONNECTIONS.map(([from, to], i) => {
          const connectionDelay =
            graphStartFrame + Math.max(from, to) * 10 + 5;
          const lineOpacity = interpolate(
            frame,
            [connectionDelay, connectionDelay + 15],
            [0, 0.3],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <line
              key={`line-${i}`}
              x1={NODE_POSITIONS[from].x}
              y1={NODE_POSITIONS[from].y}
              x2={NODE_POSITIONS[to].x}
              y2={NODE_POSITIONS[to].y}
              stroke={colors.cyan}
              strokeWidth={2}
              opacity={lineOpacity}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {NODE_POSITIONS.map((pos, i) => {
        const nodeDelay = graphStartFrame + i * 10;
        const nodeScale = spring({
          frame: frame - nodeDelay,
          fps,
          config: { damping: 12, stiffness: 200 },
        });
        const nodeColor =
          i % 3 === 0 ? colors.amber : i % 3 === 1 ? colors.cyan : colors.green;

        return (
          <div
            key={`node-${i}`}
            style={{
              position: "absolute",
              left: pos.x - 10,
              top: pos.y - 10,
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: nodeColor,
              transform: `scale(${nodeScale})`,
              boxShadow: `0 0 12px ${nodeColor}66`,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 30,
            color: colors.textSecondary,
            fontFamily,
            fontWeight: 500,
            opacity: subtextOpacity,
          }}
        >
          Cross-references grow automatically.
        </p>
        <p
          style={{
            fontSize: 24,
            color: colors.green,
            fontFamily,
            fontWeight: 600,
            marginTop: 12,
            opacity: labelOpacity,
          }}
        >
          Not a note app. A knowledge graph.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 — Tech Stack (180 frames / 6s)
// ---------------------------------------------------------------------------
const TechStack: React.FC = () => {
  const frame = useCurrentFrame();

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
        <FeatureRow
          icon="⚡"
          text="Claude Code — the engine."
          color={colors.amber}
          index={0}
        />
        <FeatureRow
          icon="▶"
          text="Terminal — the interface."
          color={colors.cyan}
          index={1}
        />
        <FeatureRow
          icon="🔮"
          text="Obsidian — the viewer."
          color={colors.green}
          index={2}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 8 — CTA (150 frames / 5s)
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
      <div style={{ textAlign: "center", transform: `scale(${headlineScale})` }}>
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
          Your knowledge, compounding.
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

export const PromoB: React.FC = () => {
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

        {/* Scene 8 — CTA: 1350-1500+ frames (5s + buffer to fill 1800) */}
        <TransitionSeries.Sequence durationInFrames={345}>
          <CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
