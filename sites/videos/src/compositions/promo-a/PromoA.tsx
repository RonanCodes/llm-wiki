import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { linearTiming, springTiming } from "@remotion/transitions";
import { loadFont } from "@remotion/google-fonts/Inter";
import { colors } from "../../styles/colors";
import { Typewriter } from "../../components/Typewriter";
import { WordReveal } from "../../components/WordReveal";
import { TerminalWindow } from "../../components/TerminalWindow";
import { FeatureRow } from "../../components/FeatureRow";

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Scene 1 -- Hook (0-120 frames / 4s)
// ---------------------------------------------------------------------------
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 200 },
  });
  const headlineOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtextOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: colors.amber,
            margin: 0,
            transform: `scale(${headlineScale})`,
            opacity: headlineOpacity,
            lineHeight: 1.1,
          }}
        >
          You've read this article before.
        </h1>
        <p
          style={{
            fontSize: 36,
            color: colors.textMuted,
            marginTop: 28,
            fontWeight: 500,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          You just don't remember.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 -- Problem (120-300 frames / 6s)
// ---------------------------------------------------------------------------
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();

  const subtextOpacity = interpolate(frame, [80, 105], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [80, 105], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 140px",
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 1400,
        }}
      >
        <WordReveal
          text="Every week you read the same explanations."
          delayPerWord={5}
          color={colors.textPrimary}
          fontSize={52}
          fontWeight={700}
          startFrame={0}
        />
        <WordReveal
          text="Google the same concepts. Forget the same things."
          delayPerWord={5}
          color={colors.textPrimary}
          fontSize={52}
          fontWeight={700}
          startFrame={45}
        />
        <p
          style={{
            fontSize: 30,
            color: colors.textSecondary,
            marginTop: 20,
            fontWeight: 400,
            lineHeight: 1.5,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          Your browser history is your knowledge base.{" "}
          <span style={{ color: colors.amber, fontWeight: 600 }}>
            That's the problem.
          </span>
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 -- Solution (300-450 frames / 5s)
// ---------------------------------------------------------------------------
const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 200 },
  });
  const titleOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtextOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [25, 45], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const detailOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const detailY = interpolate(frame, [55, 75], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 1200 }}>
        <h1
          style={{
            fontSize: 100,
            fontWeight: 900,
            color: colors.amber,
            margin: 0,
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
            letterSpacing: -2,
          }}
        >
          LLM Wiki
        </h1>
        <p
          style={{
            fontSize: 40,
            color: colors.textPrimary,
            marginTop: 20,
            fontWeight: 600,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          One CLI. Permanent knowledge.
        </p>
        <p
          style={{
            fontSize: 28,
            color: colors.textSecondary,
            marginTop: 20,
            fontWeight: 400,
            opacity: detailOpacity,
            transform: `translateY(${detailY}px)`,
            lineHeight: 1.5,
          }}
        >
          Claude reads it. Writes wiki pages. Links them together.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 -- Ingest Demo (450-690 frames / 8s)
// ---------------------------------------------------------------------------
const SceneIngestDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const subtextOpacity = interpolate(frame, [150, 175], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [150, 175], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
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
          command="/ingest https://karpathy.ai/blog"
          output={[
            "📥 Fetching source...",
            "✓ Created wiki/sources/karpathy-blog.md",
            "✓ Created wiki/entities/andrej-karpathy.md",
            "✓ 3 pages created, 7 cross-references added",
          ]}
          startFrame={0}
        />
        <p
          style={{
            fontSize: 26,
            color: colors.textSecondary,
            fontWeight: 500,
            textAlign: "center",
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          10+ source types. Zero copy-paste.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 -- Query Demo (690-930 frames / 8s)
// ---------------------------------------------------------------------------
const SceneQueryDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const subtextOpacity = interpolate(frame, [160, 185], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [160, 185], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
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
          command={'/query "How does RLHF compare to DPO?"'}
          output={[
            "Based on 4 sources in your wiki:",
            "→ RLHF requires human preference data...",
            "→ DPO simplifies by...",
            "Sources: [[rlhf-overview]], [[dpo-paper-summary]]",
          ]}
          startFrame={0}
        />
        <p
          style={{
            fontSize: 26,
            color: colors.textSecondary,
            fontWeight: 500,
            textAlign: "center",
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
          }}
        >
          Your sources.{" "}
          <span style={{ color: colors.green, fontWeight: 600 }}>
            Not hallucinations.
          </span>
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 -- Compounding (930-1170 frames / 8s)
// ---------------------------------------------------------------------------
const SceneCompounding: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Page counter steps: 5 -> 12 -> 47 -> 200+
  const counterSteps = [5, 12, 47, 200];
  const stepDuration = 40; // frames per step
  const currentStep = Math.min(
    Math.floor(frame / stepDuration),
    counterSteps.length - 1,
  );
  const displayNumber = counterSteps[currentStep];
  const displayText = currentStep === counterSteps.length - 1
    ? `${displayNumber}+`
    : `${displayNumber}`;

  // Spring for each step transition
  const stepProgress = spring({
    frame: frame - currentStep * stepDuration,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const counterScale = interpolate(stepProgress, [0, 1], [0.85, 1]);
  const counterOpacity = interpolate(stepProgress, [0, 1], [0.3, 1]);

  const subtextOpacity = interpolate(frame, [50, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [50, 75], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const labelOpacity = interpolate(frame, [100, 125], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            color: colors.amber,
            transform: `scale(${counterScale})`,
            opacity: counterOpacity,
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          {displayText}
        </div>
        <p
          style={{
            fontSize: 20,
            color: colors.textMuted,
            marginTop: 8,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          pages
        </p>
        <p
          style={{
            fontSize: 32,
            color: colors.textSecondary,
            marginTop: 40,
            fontWeight: 500,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
            lineHeight: 1.5,
          }}
        >
          Every source you ingest makes the next answer better.
        </p>
        <p
          style={{
            fontSize: 28,
            color: colors.green,
            marginTop: 16,
            fontWeight: 700,
            opacity: labelOpacity,
          }}
        >
          Knowledge that compounds.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 -- Tech Stack (1170-1350 frames / 6s)
// ---------------------------------------------------------------------------
const SceneTechStack: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 44,
        }}
      >
        <FeatureRow
          icon=">"
          text="Claude Code is the engine."
          color={colors.cyan}
          index={0}
        />
        <FeatureRow
          icon="$"
          text="Your terminal is the interface."
          color={colors.amber}
          index={1}
        />
        <FeatureRow
          icon="◈"
          text="Obsidian is the viewer."
          color={colors.green}
          index={2}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 8 -- CTA (1350-1500 frames / 5s)
// ---------------------------------------------------------------------------
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 200 },
  });
  const headlineOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const urlOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlY = interpolate(frame, [25, 45], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Subtle pulse on the URL
  const pulse = interpolate(
    Math.sin(((frame - 50) / 30) * Math.PI * 2),
    [-1, 1],
    [0.92, 1],
  );
  const urlScale = frame > 50 ? pulse : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: colors.textPrimary,
            margin: 0,
            transform: `scale(${headlineScale})`,
            opacity: headlineOpacity,
          }}
        >
          Start building yours.
        </h1>
        <p
          style={{
            fontSize: 34,
            color: colors.cyan,
            marginTop: 32,
            fontWeight: 600,
            opacity: urlOpacity,
            transform: `translateY(${urlY}px) scale(${urlScale})`,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          github.com/RonanCodes/llm-wiki
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main Composition -- assembled with TransitionSeries
// ---------------------------------------------------------------------------

// Transition overlap frames (these overlap between scenes, so scene
// durations include their share of the transition).
const FADE_FRAMES = 15;
const SLIDE_FRAMES = 12;
const WIPE_FRAMES = 18;

export const PromoA: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <TransitionSeries>
        {/* Scene 1 -- Hook (4s = 120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <SceneHook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 2 -- Problem (6s = 180 frames) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <SceneProblem />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: WIPE_FRAMES })}
        />

        {/* Scene 3 -- Solution (5s = 150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <SceneSolution />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 15, stiffness: 200 },
          })}
        />

        {/* Scene 4 -- Ingest Demo (8s = 240 frames) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <SceneIngestDemo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 5 -- Query Demo (8s = 240 frames) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <SceneQueryDemo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: WIPE_FRAMES })}
        />

        {/* Scene 6 -- Compounding (8s = 240 frames) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <SceneCompounding />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({
            config: { damping: 20, stiffness: 80 },
          })}
        />

        {/* Scene 7 -- Tech Stack (6s = 180 frames) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <SceneTechStack />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 8 -- CTA (5s = 150 frames) */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
