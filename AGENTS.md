# Project Instructions

## Project purpose

This repository contains a modern full-stack rebuild of an earlier academic project.
It is a personal portfolio project and must prioritize clean architecture,
security, maintainability, documentation, and reproducible local setup.

## Stack

- Backend: Java 21, Spring Boot, Maven, REST API, PostgreSQL.
- Frontend: React, TypeScript, Vite.
- Node.js: 24 LTS.
- Package manager: pnpm 11.x only.
- Containerization: Docker and Docker Compose.

## Repository structure

- `backend/`: Spring Boot REST API.
- `frontend/`: React + TypeScript application.
- `docs/`: architecture notes, API documentation, screenshots, and decisions.
- `docker-compose.yml`: local full-stack environment.
- `pnpm-workspace.yaml`: pnpm workspace and supply-chain security configuration.

## Package management and supply-chain security

- Use pnpm only. Do not use npm, yarn, npx, or another package manager.
- Commit `pnpm-lock.yaml`. Do not create or commit `package-lock.json` or `yarn.lock`.
- Before adding a dependency, prefer established, actively maintained packages
  with official documentation and public source code.
- Avoid adding dependencies unless they provide meaningful value.
- Do not use Git URLs or direct tarball URLs as dependencies.
- Do not run arbitrary packages with `pnpm dlx`.
- Review packages requiring install/build scripts. Use `pnpm approve-builds`
  and approve only dependencies that are understood and required.
- In CI, install dependencies using:
  `pnpm install --frozen-lockfile`
- Never add secrets, credentials, API tokens, passwords, or `.env` files to Git.

## Backend conventions

- Use a layered structure: `controller`, `service`, `repository`, `dto`,
  `entity`, `exception`, and `config`.
- Controllers must be thin: no business logic or persistence logic in them.
- Do not expose JPA entities directly from REST endpoints; use DTOs.
- Validate incoming requests with Jakarta Validation and `@Valid`.
- Use global exception handling and consistent API error responses.
- Keep database migrations explicit when migrations are introduced.
- Add focused unit or integration tests when implementing business behavior.

## Frontend conventions

- Use TypeScript strict mode. Avoid `any`.
- Keep components focused and reusable.
- Keep API calls outside presentational components.
- Model API requests and responses with explicit TypeScript types.
- Handle loading, empty, and error states for asynchronous UI.
- Do not place secrets in frontend environment variables. Any value exposed to
  the browser must be considered public.

## Development workflow

- Inspect relevant code before editing it.
- Keep changes focused on the requested task.
- Do not modify unrelated files or reformat the whole repository unnecessarily.
- Do not use destructive Git commands such as `reset --hard` or `push --force`
  unless explicitly requested.
- Before considering a task complete, run the relevant checks:
  - Frontend: lint, tests if present, and production build.
  - Backend: Maven tests and package/build.
- Report commands run, files changed, and any verification that could not run.

## Commands

### Frontend

Run from `frontend/`:

```bash
pnpm run dev
pnpm run lint
pnpm run build

### Backend

Run from `backend/`:

```bash
./mvnw spring-boot:run
./mvnw test
./mvnw package

## Documentation

- Update `README.md` when setup, architecture, commands, or user-visible 
  features change.
- Document meaningful technical decisions in `docs/`.
- Prefer concise, practical documentation over generic explanations.

