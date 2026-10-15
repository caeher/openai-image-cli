# Contribuir

Gracias por mejorar `oaiimage`.

## Flujo

1. Crea una rama desde `main` o la rama de plan activa.
2. `pnpm install`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`.
3. Abre un pull request con descripción clara y pruebas.

## Reglas

- No publiques el paquete con `npm publish`. El CLI se distribuye desde el repositorio hasta que el mantenedor habilite publicación.
- No commits de claves API ni archivos con `apiKey` en config de ejemplo.
- Los parámetros de la API deben coincidir con la investigación en `docs/plan/API-RESEARCH.md`; no inventes campos del proveedor.
- Documentación de usuario en español en `docs/` y `README.md`.

## Pruebas en vivo

Solo con `OAIIMAGE_LIVE=1` y una clave real en un entorno controlado. La CI no ejecuta llamadas de red por defecto.
