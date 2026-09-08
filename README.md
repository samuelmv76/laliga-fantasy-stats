# LaLiga Fantasy · Estadísticas

Front-end en React + Vite.

## Desarrollo local

```bash
npm install
npm run dev
```

## Qué hace

- **Mercado**: buscar, filtrar por posición, ordenar por puntos/precio/ratio/subida del día.
- **Mi equipo**: hasta 25 jugadores seguidos (sin presupuesto, sin formación obligatoria).
  Guardado en `localStorage` (`laliga-fantasy:equipo`), sin backend.
- Gráficas del equipo: valor total acumulado en el tiempo y ganancia/pérdida diaria (barras).
- Ficha de cada jugador: gráfica de evolución de su precio día a día.
- Ranking del día: quién más sube y quién más baja de precio.

## Datos

`src/hooks/usePlayers.js` intenta cargar `/jugadores.json` (generado por
el scraper — ver `/scraper` en la raíz del proyecto) y, si no existe
todavía, usa los datos de prueba de `src/data/mockPlayers.js` para que el
front funcione igual durante el desarrollo.

Para pasar a datos reales: copia el `jugadores.json` que genera el
scraper a `public/jugadores.json` (el workflow de GitHub Actions ya lo
hace automáticamente).
