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
} from "remotion";
import { Audio } from "@remotion/media";
import {
  TransitionSeries,
  springTiming,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { light } from "../../styles/colors";

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Shared spring configs
// ---------------------------------------------------------------------------
const SNAPPY = { damping: 15, stiffness: 200 } as const;
const GENTLE = { damping: 20, stiffness: 80 } as const;

// ---------------------------------------------------------------------------
// Transition duration between scenes
// ---------------------------------------------------------------------------
const T = 15;

// ---------------------------------------------------------------------------
// Scene 1 — Hook (0-120 frames / 4s)
// "One CLI command." + "47 cross-linked wiki pages." + terminal preview
// ---------------------------------------------------------------------------
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame,
    fps,
    config: SNAPPY,
  });

  const headlineOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subScale = spring({
    frame: frame - 35,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const subOpacity = interpolate(frame, [35, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Terminal preview fades in near bottom
  const previewOpacity = interpolate(frame, [60, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const previewY = interpolate(frame, [60, 85], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: light.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", marginTop: -80 }}>
        <h1
          style={{
            fontSize: 86,
            fontWeight: 800,
            color: light.textPrimary,
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
            fontSize: 44,
            color: light.textPrimary,
            fontFamily,
            fontWeight: 600,
            marginTop: 28,
            opacity: subOpacity,
            transform: `scale(${subScale})`,
          }}
        >
          <span
            style={{ fontSize: 62, color: light.amber, fontWeight: 800 }}
          >
            47
          </span>{" "}
          cross-linked wiki pages.
        </p>
      </div>

      {/* Small terminal preview teaser */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          opacity: previewOpacity,
          transform: `translateY(${previewY}px)`,
        }}
      >
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            border: `1px solid ${light.border}`,
          }}
        >
          <Img
            src={staticFile("assets/screenshots/terminal-ingest.png")}
            style={{
              width: 600,
              height: "auto",
              display: "block",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Problem (120-300 frames / 6s)
// "You read 200 articles a year." / "You remember maybe 10."
// ---------------------------------------------------------------------------
const Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const line2Delay = 50;
  const retentionDelay = 105;

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

  const retentionOpacity = interpolate(
    frame,
    [retentionDelay, retentionDelay + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const retentionY = interpolate(
    frame,
    [retentionDelay, retentionDelay + 20],
    [15, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  // Scattered document icons representing chaos
  const docPositions = [
    { x: 120, y: 160, rot: -12, delay: 20 },
    { x: 1650, y: 200, rot: 8, delay: 35 },
    { x: 250, y: 780, rot: 15, delay: 45 },
    { x: 1500, y: 700, rot: -20, delay: 55 },
    { x: 1750, y: 500, rot: 5, delay: 30 },
    { x: 100, y: 500, rot: -8, delay: 60 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: light.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 120px",
      }}
    >
      {/* Scattered document icons */}
      {docPositions.map((doc, i) => {
        const docOpacity = interpolate(
          frame,
          [doc.delay, doc.delay + 20, doc.delay + 80, doc.delay + 100],
          [0, 0.08, 0.08, 0.03],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: doc.x,
              top: doc.y,
              opacity: docOpacity,
              transform: `rotate(${doc.rot}deg)`,
              fontSize: 64,
              color: light.textDim,
              pointerEvents: "none",
            }}
          >
            {"\uD83D\uDCC4"}
          </div>
        );
      })}

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
            color: light.textPrimary,
            fontFamily,
            margin: 0,
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
          }}
        >
          You read{" "}
          <span
            style={{ fontSize: 66, color: light.amber, fontWeight: 800 }}
          >
            200
          </span>{" "}
          articles a year.
        </p>
        <p
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: light.textPrimary,
            fontFamily,
            margin: 0,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          You remember maybe{" "}
          <span
            style={{ fontSize: 66, color: light.amber, fontWeight: 800 }}
          >
            10
          </span>
          .
        </p>
        <p
          style={{
            fontSize: 30,
            color: light.textSecondary,
            fontFamily,
            fontWeight: 500,
            marginTop: 28,
            opacity: retentionOpacity,
            transform: `translateY(${retentionY}px)`,
          }}
        >
          The problem isn't reading. It's retention.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Solution Reveal (300-480 frames / 6s)
// "LLM Wiki" + logo trio + subtext
// ---------------------------------------------------------------------------
const SolutionReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 120, overshootClamping: false },
  });

  const headlineOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Logo trio — staggered fade-in
  const logos = [
    {
      src: staticFile("assets/logos/claude-ai-icon.svg"),
      label: "Engine",
      delay: 30,
    },
    {
      src: staticFile("assets/logos/terminal-icon.svg"),
      label: "Interface",
      delay: 45,
    },
    {
      src: staticFile("assets/logos/obsidian-logo-gradient.svg"),
      label: "Viewer",
      delay: 60,
    },
  ];

  // Subtext word reveal
  const subtextDelay = 80;
  const subtextWords =
    "A persistent, interlinked knowledge base".split(" ");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: light.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {/* Title */}
        <h1
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: light.amber,
            fontFamily,
            margin: 0,
            transform: `scale(${headlineScale})`,
            opacity: headlineOpacity,
          }}
        >
          LLM Wiki
        </h1>

        {/* Logo trio */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 80,
            marginTop: 48,
          }}
        >
          {logos.map((logo, i) => {
            const logoOpacity = interpolate(
              frame,
              [logo.delay, logo.delay + 15],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const logoY = interpolate(
              frame,
              [logo.delay, logo.delay + 15],
              [12, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              },
            );
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  opacity: logoOpacity,
                  transform: `translateY(${logoY}px)`,
                }}
              >
                <Img
                  src={logo.src}
                  style={{ width: 40, height: 40 }}
                />
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: light.textSecondary,
                    fontFamily,
                  }}
                >
                  {logo.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Subtext — word-by-word reveal */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            marginTop: 40,
            maxWidth: 900,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {subtextWords.map((word, i) => {
            const wordDelay = subtextDelay + i * 5;
            const wordOpacity = interpolate(
              frame,
              [wordDelay, wordDelay + 8],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const wordY = interpolate(
              frame,
              [wordDelay, wordDelay + 8],
              [12, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              },
            );
            return (
              <span
                key={i}
                style={{
                  fontSize: 32,
                  fontWeight: 500,
                  color: light.textSecondary,
                  fontFamily,
                  opacity: wordOpacity,
                  transform: `translateY(${wordY}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Ingest Demo (480-750 frames / 9s)
// terminal-ingest.png in card with Ken Burns + floating source badges
// ---------------------------------------------------------------------------
const IngestDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = 270; // 9s

  // Ken Burns: scale 1 -> 1.15
  const kenBurnsScale = interpolate(frame, [0, totalFrames], [1, 1.15], {
    extrapolateRight: "clamp",
  });

  // Top label
  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [0, 20], [15, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Card entrance
  const cardScale = spring({
    frame: frame - 10,
    fps,
    config: GENTLE,
  });

  // Source type badges
  const badges = [
    { label: "Web", color: light.cyan, x: -480, y: -120, delay: 50 },
    { label: "YouTube", color: "#FF0000", x: 480, y: -100, delay: 65 },
    { label: "PDF", color: light.green, x: -460, y: 40, delay: 80 },
    { label: "GitHub", color: light.textPrimary, x: 460, y: 60, delay: 95 },
    { label: "Reddit", color: "#FF4500", x: -440, y: 180, delay: 110 },
  ];

  // Bottom label
  const bottomOpacity = interpolate(frame, [140, 165], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: light.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Top label */}
      <div
        style={{
          position: "absolute",
          top: 80,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: light.textPrimary,
            fontFamily,
            margin: 0,
          }}
        >
          Feed it anything.
        </h2>
      </div>

      {/* Terminal screenshot card */}
      <div
        style={{
          transform: `scale(${cardScale})`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          border: `1px solid ${light.border}`,
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <Img
            src={staticFile("assets/screenshots/terminal-ingest.png")}
            style={{
              width: 800,
              height: "auto",
              display: "block",
              transform: `scale(${kenBurnsScale})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </div>

      {/* Floating source type badges */}
      {badges.map((badge, i) => {
        const badgeProgress = spring({
          frame: frame - badge.delay,
          fps,
          config: SNAPPY,
        });
        const badgeOpacity = interpolate(badgeProgress, [0, 0.5], [0, 1], {
          extrapolateRight: "clamp",
        });
        const badgeScale = badgeProgress;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${badge.x}px), calc(-50% + ${badge.y}px)) scale(${badgeScale})`,
              opacity: badgeOpacity,
            }}
          >
            <div
              style={{
                backgroundColor: light.bgCard,
                border: `2px solid ${badge.color}`,
                borderRadius: 24,
                padding: "8px 20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: badge.color,
                  fontFamily,
                }}
              >
                {badge.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Bottom label */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          opacity: bottomOpacity,
        }}
      >
        <p
          style={{
            fontSize: 24,
            color: light.textMuted,
            fontFamily,
            fontWeight: 500,
            margin: 0,
          }}
        >
          10+ source types. One command.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Wiki Output (750-990 frames / 8s)
// Obsidian wiki page screenshot with Ken Burns + overlay text
// ---------------------------------------------------------------------------
const WikiOutput: React.FC = () => {
  const frame = useCurrentFrame();
  const totalFrames = 240;

  // Ken Burns: scale 1 -> 1.15, pan slightly right
  const kenBurnsScale = interpolate(frame, [0, totalFrames], [1, 1.15], {
    extrapolateRight: "clamp",
  });
  const kenBurnsPanX = interpolate(frame, [0, totalFrames], [0, -20], {
    extrapolateRight: "clamp",
  });

  // Image fade-in
  const imgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Overlay text card
  const overlayOpacity = interpolate(frame, [25, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const overlayY = interpolate(frame, [25, 50], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Badge
  const badgeOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Full-width Obsidian screenshot */}
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          opacity: imgOpacity,
        }}
      >
        <Img
          src={staticFile("assets/screenshots/obsidian-wiki-page.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${kenBurnsScale}) translateX(${kenBurnsPanX}px)`,
            transformOrigin: "center center",
          }}
        />
      </div>

      {/* Semi-transparent overlay text card at top */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: `translateX(-50%) translateY(${overlayY}px)`,
          opacity: overlayOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(28, 36, 51, 0.85)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            padding: "20px 48px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <h2
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "#F0F0F0",
              fontFamily,
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Structured. Cross-linked. Searchable.
          </h2>
        </div>
      </div>

      {/* Green badge at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 80,
          opacity: badgeOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(75, 163, 118, 0.9)",
            borderRadius: 20,
            padding: "10px 24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              fontFamily,
            }}
          >
            Auto-generated from source
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — Query Demo (990-1200 frames / 7s)
// terminal-query.png in card on light bg
// ---------------------------------------------------------------------------
const QueryDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = 210;

  // Ken Burns
  const kenBurnsScale = interpolate(frame, [0, totalFrames], [1, 1.12], {
    extrapolateRight: "clamp",
  });

  // Card entrance
  const cardScale = spring({
    frame,
    fps,
    config: GENTLE,
  });

  // Overlay text
  const overlayOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Badge
  const badgeOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeProgress = spring({
    frame: frame - 80,
    fps,
    config: SNAPPY,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: light.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Top overlay */}
      <div
        style={{
          position: "absolute",
          top: 70,
          opacity: overlayOpacity,
        }}
      >
        <h2
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: light.textPrimary,
            fontFamily,
            margin: 0,
          }}
        >
          Ask your wiki. Get grounded answers.
        </h2>
      </div>

      {/* Terminal query screenshot in card */}
      <div
        style={{
          transform: `scale(${cardScale})`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          border: `1px solid ${light.border}`,
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <Img
            src={staticFile("assets/screenshots/terminal-query.png")}
            style={{
              width: 900,
              height: "auto",
              display: "block",
              transform: `scale(${kenBurnsScale})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </div>

      {/* Badge below */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          opacity: badgeOpacity,
          transform: `scale(${badgeProgress})`,
        }}
      >
        <div
          style={{
            backgroundColor: light.bgCard,
            border: `2px solid ${light.cyan}`,
            borderRadius: 24,
            padding: "10px 28px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: light.cyan,
              fontFamily,
            }}
          >
            Cites your sources, not the internet.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 — Graph View (1200-1410 frames / 7s)
// obsidian-graph-view.png with dramatic Ken Burns + counter overlay
// ---------------------------------------------------------------------------
const GraphView: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = 210;

  // Dramatic Ken Burns: 1 -> 1.3
  const kenBurnsScale = interpolate(frame, [0, totalFrames], [1, 1.3], {
    extrapolateRight: "clamp",
  });

  // Image fade-in
  const imgOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Animated counter: "5" -> "50" -> "500"
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

  // "pages" label
  const pagesOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtext
  const subtextOpacity = interpolate(frame, [130, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextY = interpolate(frame, [130, 150], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Full-screen graph view */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          opacity: imgOpacity,
        }}
      >
        <Img
          src={staticFile("assets/screenshots/obsidian-graph-view.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${kenBurnsScale})`,
            transformOrigin: "center center",
          }}
        />
        {/* Dark overlay to make text readable */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
          }}
        />
      </div>

      {/* Counter overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            color: light.amber,
            fontFamily,
            transform: `scale(${numberScale})`,
            lineHeight: 1,
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          {getActiveNumber()}
        </div>
        <p
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.7)",
            fontFamily,
            fontWeight: 600,
            marginTop: 8,
            opacity: pagesOpacity,
          }}
        >
          pages
        </p>

        <p
          style={{
            fontSize: 32,
            color: "#7dcea0",
            fontFamily,
            fontWeight: 600,
            marginTop: 40,
            opacity: subtextOpacity,
            transform: `translateY(${subtextY}px)`,
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          The graph grows itself.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 8 — CTA (1410-1800 frames / 13s)
// "Build yours in 5 minutes." + GitHub link + logo trio
// ---------------------------------------------------------------------------
const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Headline spring-in
  const headlineScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const headlineOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // GitHub URL fade-in
  const urlOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const urlY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Logo trio — staggered
  const logoTrioLogos = [
    {
      src: staticFile("assets/logos/claude-ai-icon.svg"),
      delay: 60,
    },
    {
      src: staticFile("assets/logos/obsidian-logo-gradient.svg"),
      delay: 72,
    },
    {
      src: staticFile("assets/logos/github-mark.svg"),
      delay: 84,
    },
  ];

  // Subtle glow pulse on headline
  const glowIntensity = interpolate(
    frame,
    [50, 80, 110, 140, 170, 200],
    [0, 8, 0, 8, 0, 8],
    { extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: light.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: light.textPrimary,
            fontFamily,
            margin: 0,
            transform: `scale(${headlineScale})`,
            opacity: headlineOpacity,
            textShadow: `0 0 ${glowIntensity}px ${light.amber}44`,
          }}
        >
          Build yours in{" "}
          <span style={{ color: light.amber }}>5 minutes</span>.
        </h1>

        {/* GitHub URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 36,
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
          }}
        >
          <Img
            src={staticFile("assets/logos/github-mark.svg")}
            style={{ width: 28, height: 28, opacity: 0.6 }}
          />
          <p
            style={{
              fontSize: 30,
              color: light.cyan,
              fontFamily,
              fontWeight: 600,
              margin: 0,
            }}
          >
            github.com/RonanCodes/llm-wiki
          </p>
        </div>

        {/* Logo trio */}
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 50,
          }}
        >
          {logoTrioLogos.map((logo, i) => {
            const logoOpacity = interpolate(
              frame,
              [logo.delay, logo.delay + 15],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const logoY = interpolate(
              frame,
              [logo.delay, logo.delay + 15],
              [10, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              },
            );
            return (
              <div
                key={i}
                style={{
                  opacity: logoOpacity,
                  transform: `translateY(${logoY}px)`,
                }}
              >
                <Img
                  src={logo.src}
                  style={{ width: 36, height: 36 }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Composition — 1800 frames / 60s @ 30fps
// ---------------------------------------------------------------------------
export const PromoV2: React.FC = () => {
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Background music — fade in, hold soft, fade out */}
      <Audio
        src={staticFile("audio/kevin-macleod-digital-lemonade-90s.mp3")}
        volume={(f) => {
          // Fade in over first 30 frames (1s)
          if (f < 30) return interpolate(f, [0, 30], [0, 0.15]);
          // Fade out over last 60 frames (2s)
          if (f > durationInFrames - 60)
            return interpolate(
              f,
              [durationInFrames - 60, durationInFrames],
              [0.15, 0],
              { extrapolateRight: "clamp" },
            );
          // Hold at 0.15
          return 0.15;
        }}
      />

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
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 3 — Solution Reveal: 300-480 frames (6s) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <SolutionReveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 15 } })}
        />

        {/* Scene 4 — Ingest Demo: 480-750 frames (9s) */}
        <TransitionSeries.Sequence durationInFrames={270}>
          <IngestDemo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 5 — Wiki Output: 750-990 frames (8s) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <WikiOutput />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 6 — Query Demo: 990-1200 frames (7s) */}
        <TransitionSeries.Sequence durationInFrames={210}>
          <QueryDemo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 12 } })}
        />

        {/* Scene 7 — Graph View: 1200-1410 frames (7s) */}
        <TransitionSeries.Sequence durationInFrames={210}>
          <GraphView />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 8 — CTA: 1410-1800 frames (13s) */}
        <TransitionSeries.Sequence durationInFrames={390}>
          <CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
