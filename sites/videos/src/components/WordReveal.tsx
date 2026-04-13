import { useCurrentFrame, interpolate, Easing } from "remotion";

export const WordReveal: React.FC<{
  text: string;
  delayPerWord?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  startFrame?: number;
}> = ({
  text,
  delayPerWord = 6,
  color = "#f0f0f0",
  fontSize = 48,
  fontWeight = 700,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const words = text.split(" ");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {words.map((word, i) => {
        const delay = i * delayPerWord;
        const opacity = interpolate(elapsed, [delay, delay + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(elapsed, [delay, delay + 8], [15, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              fontSize,
              fontWeight,
              color,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
