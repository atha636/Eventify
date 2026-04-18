import logo from "../assets/logo.png";

export default function Logo({ size = 42, alt = "VENERS Logo", className = "" }) {
  return (
    <img
      src={logo}
      alt={alt}
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: "50%",
        objectFit: "contain",
        display: "block",
        userSelect: "none",
      }}
    />
  );
}