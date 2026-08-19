import Image from "next/image";

/**
 * Marca da plataforma (Listaae). Duas variantes de arte, não de CSS: o
 * lockup é um PNG com o verde-tinta e o latão da identidade, então sobre
 * fundo escuro é preciso o arquivo claro — filtro CSS não resolveria sem
 * apagar o latão.
 *
 * `variant`:
 *   full — símbolo + palavra (cabeçalhos, rodapé, login)
 *   mark — só o símbolo (favicon, avatar, espaços estreitos)
 * `tone`:
 *   dark  — arte verde/latão, para pergaminho
 *   light — arte creme/latão, para verde-tinta
 *
 * `height` é a única medida que o call site passa: a largura sai da
 * proporção real do arquivo, então a marca nunca distorce.
 */
const RATIO = { full: 1299 / 372, mark: 328 / 372 } as const;

export function Logo({
  variant = "full",
  tone = "dark",
  height = 26,
  className,
  priority = false,
}: {
  variant?: "full" | "mark";
  tone?: "dark" | "light";
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const file =
    variant === "full"
      ? tone === "light"
        ? "/brand/listaae-logo-light.png"
        : "/brand/listaae-logo.png"
      : tone === "light"
        ? "/brand/listaae-mark-light.png"
        : "/brand/listaae-mark.png";

  const width = Math.round(height * RATIO[variant]);

  return (
    <Image
      src={file}
      alt="Listaae"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
