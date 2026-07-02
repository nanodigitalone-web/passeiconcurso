// share.ts — client-side image generation (banner + certificate) and a
// share-or-download helper. No backend needed; everything is drawn on a canvas.

type ProfileLike = {
  nome?: string | null;
  avatar_url?: string | null;
  categoria_nome?: string | null;
};

const TAU = Math.PI * 2;

// Load a remote image with CORS so it can be drawn without tainting the canvas.
// Resolves null on failure (we then fall back to initials).
function loadImage(url?: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
    // Give up if it stalls.
    setTimeout(() => resolve(img.complete && img.naturalWidth ? img : null), 4000);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const toBlob = (c: HTMLCanvasElement): Promise<Blob> =>
  new Promise((res) => c.toBlob((b) => res(b as Blob), "image/png"));

/** Square social banner with avatar, name and points. */
export async function buildBanner(profile: ProfileLike, pontos: number): Promise<Blob> {
  const W = 1080, H = 1080;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#1e6fd9");
  g.addColorStop(1, "#0b3a78");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.arc(W * 0.85, H * 0.14, 180, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.10, H * 0.92, 240, 0, TAU); ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 70px Georgia, serif";
  ctx.fillText("Passei", W / 2, 145);
  ctx.font = "500 28px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("Concursos Públicos · Angola", W / 2, 190);

  const avatar = await loadImage(profile.avatar_url);
  const cx = W / 2, cy = 440, r = 145;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.closePath(); ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, cx - r, cy - r, 2 * r, 2 * r);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  ctx.restore();
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  if (!avatar) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 130px Arial";
    ctx.fillText((profile.nome?.[0] || "U").toUpperCase(), cx, cy + 48);
  }

  ctx.fillStyle = "#fff";
  ctx.font = "bold 58px Georgia, serif";
  ctx.fillText(profile.nome || "Candidato", W / 2, 695);
  if (profile.categoria_nome) {
    ctx.font = "400 30px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(profile.categoria_nome, W / 2, 740);
  }

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(ctx, W / 2 - 270, 800, 540, 165, 32);
  ctx.fill();
  ctx.fillStyle = "#ffd34d";
  ctx.font = "bold 104px Georgia, serif";
  ctx.fillText(pontos.toLocaleString("pt-PT"), W / 2, 908);
  ctx.fillStyle = "#fff";
  ctx.font = "500 30px Arial";
  ctx.fillText("pontos conquistados", W / 2, 950);

  return toBlob(c);
}

/** Landscape certificate for reaching a milestone (e.g. 100.000 points). */
export async function buildCertificate(profile: ProfileLike, pontos: number): Promise<Blob> {
  const W = 1200, H = 850;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#fbf9f3";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#1e6fd9";
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = "#ffb300";
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 60, W - 120, H - 120);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1e6fd9";
  ctx.font = "bold 40px Georgia, serif";
  ctx.fillText("Passei · Concursos Públicos", W / 2, 150);

  ctx.fillStyle = "#222";
  ctx.font = "bold 64px Georgia, serif";
  ctx.fillText("Certificado de Mérito", W / 2, 280);

  ctx.fillStyle = "#555";
  ctx.font = "400 28px Arial";
  ctx.fillText("Este certificado é atribuído a", W / 2, 360);

  ctx.fillStyle = "#0b3a78";
  ctx.font = "bold 56px Georgia, serif";
  ctx.fillText(profile.nome || "Candidato", W / 2, 440);

  ctx.fillStyle = "#555";
  ctx.font = "400 28px Arial";
  ctx.fillText("por ter alcançado a marca de", W / 2, 520);
  ctx.fillStyle = "#ffb300";
  ctx.font = "bold 80px Georgia, serif";
  ctx.fillText(`${pontos.toLocaleString("pt-PT")} pontos`, W / 2, 610);

  ctx.fillStyle = "#777";
  ctx.font = "400 24px Arial";
  const data = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  ctx.fillText(`Emitido em ${data}`, W / 2, 720);

  return toBlob(c);
}

/** Share an image via the Web Share API, falling back to a download. */
export async function shareImage(blob: Blob, filename: string, text: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as any;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], text, title: "Passei" });
      return;
    } catch {
      /* user cancelled or share failed → fall back to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Share a link/text via the Web Share API, falling back to clipboard. */
export async function shareLink(url: string, text: string): Promise<"shared" | "copied"> {
  const nav = navigator as any;
  if (nav.share) {
    try {
      await nav.share({ title: "Passei", text, url });
      return "shared";
    } catch {
      /* fall through to copy */
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
