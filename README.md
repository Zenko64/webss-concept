# WebSS (Web Screen Sharing)

> **⚠️ MVP DISCLAIMER:** This project is an early-stage MVP (Minimum Viable Product). It is an unstable and unreliable concept product intended for experimentation and proof-of-concept purposes. It is **not** production-ready. Expect bugs, breaking changes, and incomplete or missing features.

A real-time workspace application that supports rooms, multi-user connectivity, authentication, and WebRTC-based screen sharing. Built as a monorepo using Turborepo.

## 🏗️ Project Structure

This project uses a monorepo setup powered by [Turborepo](https://turbo.build/repo) and standard web technologies.

- **`apps/web`**: Frontend built with React, Vite, Redux Toolkit, and tailwindcss/shadcn-ui. It handles UI, rooms, WebRTC screen sharing, and socket connections.
- **`apps/server`**: Backend Node.js server powered by Drizzle ORM. It handles authentication, database interactions, web sockets (`rooms/socket`), and API requests.
- **`packages/types`**: Shared TypeScript definitions, schemas, and socket payloads utilized by both the frontend and backend.

## 🚀 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Shadcn UI, Redux Toolkit, WebRTC
- **Backend:** Node.js, WebSockets, Drizzle ORM
- **Tooling:** Bun, Turborepo, Caddy (for production proxy/static serving)

## 🛠️ Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed locally.

### Installation

1. Install dependencies from the root directory:
   ```bash
   bun install
   ```

2. Set up environment variables:
   - Configure Drizzle ORM DB credentials in `apps/server`.
   - Setup Auth credentials.

3. Run the development server (starts both backend and frontend):
   ```bash
   bun dev
   ```

## 📦 Production Deployment
A `Caddyfile` is included in the project root for serving the built frontend statically and, optionally, proxying API connections.

1. Build the frontend:
   ```bash
   bun run build
   ```
2. Start the Caddy server:
   ```bash
   caddy run
   ```
