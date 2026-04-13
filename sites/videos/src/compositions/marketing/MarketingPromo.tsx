import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#e0af40",
            margin: 0,
            fontFamily: "system-ui",
          }}
        >
          LLM Wiki
        </h1>
        <p
          style={{
            fontSize: 32,
            color: "#999",
            marginTop: 16,
            fontFamily: "system-ui",
          }}
        >
          Your knowledge, compounding
        </p>
      </div>
    </AbsoluteFill>
  );
};

const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      <div style={{ opacity, textAlign: "center" }}>
        <p
          style={{
            fontSize: 48,
            color: "#e0af40",
            fontFamily: "system-ui",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          Every time you research something,
          <br />
          you start from scratch.
        </p>
        <p
          style={{
            fontSize: 32,
            color: "#666",
            fontFamily: "system-ui",
            marginTop: 24,
          }}
        >
          Articles read and forgotten. Notes scattered. Context lost.
        </p>
      </div>
    </AbsoluteFill>
  );
};

const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: frame - 10, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: 56,
            color: "#5bbcd6",
            fontFamily: "system-ui",
            fontWeight: 700,
            transform: `scale(${Math.min(scale, 1)})`,
          }}
        >
          LLM Wiki builds a persistent,
          <br />
          interlinked knowledge base
        </h2>
        <p
          style={{
            fontSize: 28,
            color: "#7dcea0",
            fontFamily: "system-ui",
            marginTop: 32,
            opacity: interpolate(frame, [20, 40], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          Claude Code is the engine. Obsidian is the viewer. You direct.
        </p>
      </div>
    </AbsoluteFill>
  );
};

const Features: React.FC = () => {
  const frame = useCurrentFrame();
  const features = [
    { icon: "📥", text: "Ingest from 10+ source types", color: "#e0af40" },
    { icon: "🔗", text: "Auto-linked wiki pages", color: "#5bbcd6" },
    { icon: "🌿", text: "Knowledge compounds over time", color: "#7dcea0" },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {features.map((f, i) => {
          const delay = i * 20;
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
            extrapolateRight: "clamp",
          });
          const x = interpolate(frame, [delay, delay + 15], [60, 0], {
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateX(${x}px)`,
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <span style={{ fontSize: 48 }}>{f.icon}</span>
              <span
                style={{
                  fontSize: 40,
                  color: f.color,
                  fontFamily: "system-ui",
                  fontWeight: 600,
                }}
              >
                {f.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
        <h2
          style={{
            fontSize: 64,
            color: "#e0af40",
            fontFamily: "system-ui",
            fontWeight: 800,
          }}
        >
          Start building your wiki
        </h2>
        <p
          style={{
            fontSize: 28,
            color: "#5bbcd6",
            fontFamily: "system-ui",
            marginTop: 24,
          }}
        >
          github.com/RonanCodes/llm-wiki
        </p>
      </div>
    </AbsoluteFill>
  );
};

export const MarketingPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Hook: 0-4s */}
      <Sequence from={0} durationInFrames={120}>
        <Hook />
      </Sequence>

      {/* Problem: 4-9s */}
      <Sequence from={120} durationInFrames={150}>
        <Problem />
      </Sequence>

      {/* Solution: 9-17s */}
      <Sequence from={270} durationInFrames={240}>
        <Solution />
      </Sequence>

      {/* Features: 17-25s */}
      <Sequence from={510} durationInFrames={240}>
        <Features />
      </Sequence>

      {/* CTA: 25-30s */}
      <Sequence from={750} durationInFrames={150}>
        <CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
