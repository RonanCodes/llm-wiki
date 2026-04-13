import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors } from "../styles/colors";
import { Typewriter } from "./Typewriter";

export const TerminalWindow: React.FC<{
  command: string;
  output?: string[];
  promptPrefix?: string;
  startFrame?: number;
}> = ({
  command,
  output = [],
  promptPrefix = "~/wiki $",
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = Math.max(0, frame - startFrame);

  const windowScale = spring({
    frame: elapsed,
    fps,
    config: { damping: 15, stiffness: 180 },
  });

  const commandDoneFrame = command.length * 2 + 10;

  return (
    <div
      style={{
        transform: `scale(${windowScale})`,
        backgroundColor: colors.bgTerminal,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        width: 1200,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          backgroundColor: "#1e1e1e",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28c840" }} />
        <span
          style={{
            marginLeft: 12,
            fontSize: 13,
            color: colors.textMuted,
            fontFamily: "'SF Mono', monospace",
          }}
        >
          Terminal
        </span>
      </div>

      {/* Terminal body */}
      <div style={{ padding: "20px 24px", minHeight: 120 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              color: colors.cyan,
              fontFamily: "'SF Mono', monospace",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {promptPrefix}
          </span>
          <Typewriter
            text={command}
            speed={2}
            color={colors.textPrimary}
            fontSize={20}
            startFrame={0}
          />
        </div>

        {/* Output lines */}
        {output.map((line, i) => {
          const lineDelay = commandDoneFrame + i * 8;
          const lineOpacity = interpolate(elapsed, [lineDelay, lineDelay + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity: lineOpacity,
                marginTop: i === 0 ? 16 : 4,
                fontSize: 18,
                color: line.startsWith("✓") || line.startsWith("✅")
                  ? colors.green
                  : line.startsWith("→") || line.startsWith("📥")
                    ? colors.amber
                    : colors.textSecondary,
                fontFamily: "'SF Mono', monospace",
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};
