import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

const TitleSlide: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#e0af40",
            fontFamily: "system-ui",
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 28,
            color: "#666",
            fontFamily: "system-ui",
            marginTop: 16,
          }}
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};

const StepSlide: React.FC<{
  step: number;
  title: string;
  command: string;
  description: string;
  color: string;
}> = ({ step, title, command, description, color }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const cmdOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const descOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        padding: "0 160px",
      }}
    >
      <div style={{ opacity }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontSize: 24,
              color: "#333",
              fontFamily: "monospace",
              fontWeight: 700,
            }}
          >
            {String(step).padStart(2, "0")}
          </span>
          <h2
            style={{
              fontSize: 48,
              color,
              fontFamily: "system-ui",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>
      </div>

      <div
        style={{
          opacity: cmdOpacity,
          marginTop: 40,
          backgroundColor: "#1a1a1a",
          borderRadius: 12,
          padding: "24px 32px",
          border: "1px solid #333",
        }}
      >
        <code
          style={{
            fontSize: 28,
            color: "#7dcea0",
            fontFamily: "monospace",
          }}
        >
          {command}
        </code>
      </div>

      <p
        style={{
          opacity: descOpacity,
          fontSize: 24,
          color: "#888",
          fontFamily: "system-ui",
          marginTop: 24,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </AbsoluteFill>
  );
};

export const AppDemo: React.FC = () => {
  const steps = [
    {
      title: "Create a vault",
      command: "/vault-create my-research --domain ai",
      description:
        "Each vault is its own git repo. Obsidian views it. Claude builds it.",
      color: "#e0af40",
    },
    {
      title: "Ingest a source",
      command: "/ingest https://article.com --vault my-research",
      description:
        "Auto-detects source type — web, PDF, YouTube, HN, Reddit, GitHub. Creates wiki pages with frontmatter, cross-references, and source links.",
      color: "#5bbcd6",
    },
    {
      title: "Ask questions",
      command: '/query "What do we know about X?" --vault my-research',
      description:
        "Query your wiki. Claude reads all relevant pages and synthesizes an answer grounded in your sources.",
      color: "#7dcea0",
    },
    {
      title: "Health check",
      command: "/lint --vault my-research",
      description:
        "Find broken links, missing frontmatter, orphaned pages, and inconsistencies. Keep your wiki clean.",
      color: "#e0af40",
    },
    {
      title: "Promote knowledge",
      command: "/promote my-research --to meta",
      description:
        "Graduate insights from one vault to another. Research becomes reference. Ideas become decisions.",
      color: "#5bbcd6",
    },
  ];

  return (
    <AbsoluteFill>
      {/* Title: 0-5s */}
      <Sequence from={0} durationInFrames={150}>
        <TitleSlide
          title="LLM Wiki — How It Works"
          subtitle="5 commands to build a compounding knowledge base"
        />
      </Sequence>

      {/* Steps: 5s each, starting at 5s */}
      {steps.map((step, i) => (
        <Sequence key={i} from={150 + i * 450} durationInFrames={450}>
          <StepSlide step={i + 1} {...step} />
        </Sequence>
      ))}

      {/* Outro: last 15s */}
      <Sequence from={2400} durationInFrames={300}>
        <TitleSlide
          title="Start building"
          subtitle="github.com/RonanCodes/llm-wiki"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
