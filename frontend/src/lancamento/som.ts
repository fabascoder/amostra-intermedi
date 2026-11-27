// Som da abertura, gerado no próprio navegador (Web Audio): nenhum arquivo para
// baixar e nada que dependa da rede no instante do lançamento. Só toca para
// quem ligou o som na contagem, porque os navegadores exigem um toque na tela
// antes de tocar qualquer áudio.
//
// O desenho segue a imagem: um impacto grave quando o zero vira ponto, um
// sopro quando a linha corre, notas curtas quando os remédios passam entre as
// farmácias, um acorde quando a cruz se fecha, um toque quando a cápsula
// assenta e um brilho quando a luz se abre.

export type Som = {
  confirmar(): void;
  impacto(): void;
  fundo(): void;
  sopro(): void;
  nota(grau: number): void;
  acorde(): void;
  toque(): void;
  luz(): void;
  parar(): void;
  fechar(): void;
};

/** Ré maior pentatônica: as notas dos pulsos entre as farmácias. */
const ESCALA = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];

export function criarSom(): Som | null {
  const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Contexto) return null;
  let ctx: AudioContext;
  try {
    ctx = new Contexto();
  } catch {
    return null;
  }
  void ctx.resume();

  const mestre = ctx.createGain();
  mestre.gain.value = 0.8;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.ratio.value = 3;
  mestre.connect(compressor).connect(ctx.destination);

  // sala: reverberação feita de ruído que se apaga
  const sala = ctx.createConvolver();
  sala.buffer = impulso(ctx, 3.2, 2.6);
  const retorno = ctx.createGain();
  retorno.gain.value = 0.5;
  sala.connect(retorno).connect(mestre);

  const ruidoBuffer = (() => {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();

  function envelope(g: GainNode, t: number, pico: number, ataque: number, queda: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + queda);
  }

  function seno(freq: number, t: number, pico: number, ataque: number, queda: number, envio = 0.5, tipo: OscillatorType = "sine") {
    const o = ctx.createOscillator();
    o.type = tipo;
    o.frequency.value = freq;
    const g = ctx.createGain();
    envelope(g, t, pico, ataque, queda);
    o.connect(g);
    g.connect(mestre);
    if (envio) {
      const e = ctx.createGain();
      e.gain.value = envio;
      g.connect(e).connect(sala);
    }
    o.start(t);
    o.stop(t + ataque + queda + 0.05);
    return o;
  }

  function ruido(t: number, duracao: number, filtro: BiquadFilterType, de: number, ate: number, pico: number, envio = 0.4) {
    const s = ctx.createBufferSource();
    s.buffer = ruidoBuffer;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filtro;
    f.Q.value = 0.9;
    f.frequency.setValueAtTime(de, t);
    f.frequency.exponentialRampToValueAtTime(ate, t + duracao);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + duracao * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
    s.connect(f).connect(g);
    g.connect(mestre);
    const e = ctx.createGain();
    e.gain.value = envio;
    g.connect(e).connect(sala);
    s.start(t);
    s.stop(t + duracao + 0.05);
  }

  // fundo: acorde aberto de ré, grave e filtrado, que respira até a luz
  let fundoFiltro: BiquadFilterNode | null = null;
  let fundoGanho: GainNode | null = null;

  return {
    confirmar() {
      seno(880, ctx.currentTime + 0.01, 0.06, 0.005, 0.5, 0.6);
    },
    impacto() {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.45);
      const g = ctx.createGain();
      envelope(g, t, 0.9, 0.006, 1.5);
      o.connect(g).connect(mestre);
      o.start(t);
      o.stop(t + 1.6);
      ruido(t, 0.3, "lowpass", 900, 200, 0.12, 0.2);
    },
    fundo() {
      if (fundoGanho) return;
      const t = ctx.currentTime;
      fundoFiltro = ctx.createBiquadFilter();
      fundoFiltro.type = "lowpass";
      fundoFiltro.frequency.setValueAtTime(420, t);
      fundoFiltro.frequency.exponentialRampToValueAtTime(1500, t + 9);
      fundoGanho = ctx.createGain();
      fundoGanho.gain.setValueAtTime(0.0001, t);
      fundoGanho.gain.exponentialRampToValueAtTime(0.14, t + 3.5);
      fundoFiltro.connect(fundoGanho).connect(mestre);
      const envio = ctx.createGain();
      envio.gain.value = 0.3;
      fundoGanho.connect(envio).connect(sala);
      for (const [freq, tipo, nivel] of [
        [73.42, "sine", 0.5],
        [110, "triangle", 0.28],
        [146.83, "sine", 0.32],
        [220.5, "sine", 0.12],
      ] as const) {
        const o = ctx.createOscillator();
        o.type = tipo;
        o.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = nivel;
        o.connect(g).connect(fundoFiltro);
        o.start(t);
        o.stop(t + 22);
      }
    },
    sopro() {
      ruido(ctx.currentTime, 1.1, "bandpass", 380, 2800, 0.09);
    },
    nota(grau) {
      const t = ctx.currentTime;
      const f = ESCALA[((grau % ESCALA.length) + ESCALA.length) % ESCALA.length];
      seno(f, t, 0.05, 0.004, 1.1, 0.7);
      seno(f * 2.003, t, 0.012, 0.004, 0.5, 0.7);
    },
    acorde() {
      const t = ctx.currentTime;
      [293.66, 440, 587.33, 739.99, 880, 1174.66].forEach((f, i) => seno(f, t + i * 0.018, i > 3 ? 0.025 : 0.045, 0.012, 3.6, 0.8));
      fundoFiltro?.frequency.cancelScheduledValues(t);
      fundoFiltro?.frequency.setValueAtTime(fundoFiltro.frequency.value, t);
      fundoFiltro?.frequency.exponentialRampToValueAtTime(2400, t + 2.5);
    },
    toque() {
      const t = ctx.currentTime;
      seno(1760, t, 0.045, 0.002, 0.18, 0.5);
      ruido(t, 0.06, "highpass", 3000, 5000, 0.03, 0.1);
    },
    luz() {
      const t = ctx.currentTime;
      ruido(t, 1.6, "highpass", 1800, 7000, 0.05, 0.7);
      seno(1174.66, t + 0.2, 0.02, 0.4, 2.4, 0.9);
      if (fundoGanho) {
        fundoGanho.gain.cancelScheduledValues(t);
        fundoGanho.gain.setValueAtTime(Math.max(fundoGanho.gain.value, 0.0001), t);
        fundoGanho.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      }
    },
    parar() {
      const t = ctx.currentTime;
      mestre.gain.cancelScheduledValues(t);
      mestre.gain.setValueAtTime(mestre.gain.value, t);
      mestre.gain.linearRampToValueAtTime(0, t + 0.4);
    },
    fechar() {
      void ctx.close().catch(() => {});
    },
  };
}

function impulso(ctx: AudioContext, segundos: number, queda: number): AudioBuffer {
  const n = Math.floor(ctx.sampleRate * segundos);
  const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, queda);
  }
  return b;
}
