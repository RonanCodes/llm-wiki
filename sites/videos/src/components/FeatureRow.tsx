import { useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

export const FeatureRow: React.FC<{
  icon: string;
  text: string;
  color: string;
  index: number;
}> = ({ icon, text, color, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = index * 12;

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 180 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const x = interpolate(progress, [0, 1], [60, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      <span style={{ fontSize: 40 }}>{icon}</span>
      <span
        style={{
          fontSize: 36,
          color,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
        }}
      >
        {text}
      </span>
    </div>
  );
};
