import { useCurrentFrame } from "remotion";
import { colors } from "../styles/colors";

export const Typewriter: React.FC<{
  text: string;
  speed?: number;
  color?: string;
  fontSize?: number;
  startFrame?: number;
}> = ({
  text,
  speed = 2,
  color = colors.terminalGreen,
  fontSize = 28,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charsToShow = Math.min(Math.floor(elapsed / speed), text.length);
  const displayText = text.slice(0, charsToShow);
  const showCursor = elapsed > 0 && charsToShow < text.length;

  return (
    <div style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize, color }}>
      {displayText}
      {showCursor && (
        <span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>|</span>
      )}
    </div>
  );
};
