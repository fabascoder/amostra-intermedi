// MapLibre carregado sob demanda: só quem abre um remédio baixa a biblioteca.
// O worker vem como arquivo do próprio site (o intermedi-app usa o unpkg por
// causa do Metro; aqui o Vite serve o arquivo).
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

maplibregl.setWorkerUrl(workerUrl);

export { maplibregl };
