# 🏓 ft_transcendence

> Final project of the 42 school common core — A full-stack multiplayer Pong web application.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Installation & Setup](#installation--setup)
- [Makefile Commands](#makefile-commands)
- [API Routes](#api-routes)
- [Database](#database)

---

## Overview

**ft_transcendence** is a Single Page Application (SPA) for playing Pong locally or online, featuring a real-time chat system, user profiles, a tournament mode, and performance statistics.

The entire application runs via **Docker** and exposes an **HTTPS** server on port `3001`.

---

## Tech Stack

| Layer        | Technologies                                      |
|--------------|---------------------------------------------------|
| Frontend     | TypeScript, TailwindCSS, Chart.js                 |
| Backend      | Node.js, Fastify, TypeScript                      |
| Database     | SQLite (better-sqlite3)                           |
| Real-time    | WebSocket (native Fastify)                        |
| Security     | HTTPS (self-signed certificates), sessions, 2FA  |
| DevOps       | Docker, Docker Compose                            |

---

## Features

### 🔐 Authentication
- Register / Login / Logout
- Two-factor authentication (2FA)
- Secure session management
- Account deletion

### 👤 User Profile
- Customizable avatar (image upload, max 5 MB)
- Settings management (username, email, password)
- View other players' profiles

### 🏓 Pong Game
- **Local 1v1 mode** — two players on the same keyboard
- **Tournament mode** — up to 4+ players, automatic bracket with progressive rounds
- **Online multiplayer mode** — invite via chat, real-time synchronization via WebSocket
- Paddle customization (color per player)
- Configurable winning score

### 💬 Chat
- Public real-time messaging (WebSocket)
- Private messages between users
- Block / unblock system
- Game invitation directly from the chat

### 📈 Performance & Statistics
- Games played, wins, losses, draws
- Win rate
- Match history
- Interactive charts (Chart.js) — results breakdown & ELO ranking evolution

### 🌍 Internationalization (i18n)
- Multi-language support via a client-side translation system

---

## Architecture

```
ft_transcendence/
├── frontend/               # TypeScript SPA + TailwindCSS
│   ├── src/
│   │   ├── views/          # Pages: home, game, chat, profile, tournament, performance...
│   │   ├── components/     # Reusable components (navbar...)
│   │   ├── utils/          # i18n, helpers
│   │   └── tools/          # fetchData, elo...
│   └── public/             # Static assets (images, compiled styles)
│
├── backend/                # Fastify API (HTTPS, WebSocket)
│   ├── src/
│   │   ├── routes/         # register, login, logout, ws (WebSocket), deleteUser
│   │   ├── api/            # me, myStats, addGame, friendList, addFriend, removeFriend...
│   │   ├── plugins/        # session
│   │   └── database.ts     # SQLite initialization
│   └── certs/              # SSL certificates (auto-generated)
│
├── certs/                  # Shared certificates (mounted in container)
├── docker-compose.yml
└── Makefile
```

---

## Installation & Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- `make` (available on Linux/macOS)
- `openssl` (for certificate generation)

### Quick Start

```bash
# Clone the repository
git clone <repo-url> ft_transcendence
cd ft_transcendence

# Launch the application (generates certificates + build + up)
make
```

The application will be available at: **https://localhost:3001**

> ⚠️ The SSL certificate is self-signed. Your browser will display a warning — accept it to proceed.

### Environment Variables

Create a `backend/.env` file based on the following example:

```env
DB_PATH=/app/transcendence.db
SESSION_SECRET=your_secret_here
```

---

## Makefile Commands

| Command            | Description                                           |
|--------------------|-------------------------------------------------------|
| `make`             | Generate certificates (if missing) and start the app |
| `make build`       | Build Docker images                                   |
| `make up`          | Start containers                                      |
| `make down`        | Stop containers                                       |
| `make re`          | Full rebuild (`down` + `build` + `up`)                |
| `make logs`        | Stream container logs                                 |
| `make clean`       | Remove containers, images and volumes                 |
| `make clean-certs` | Delete generated SSL certificates                     |
| `make fclean`      | Full cleanup (`clean` + `clean-certs`)                |

---

## API Routes

### Authentication
| Method | Route         | Description          |
|--------|---------------|----------------------|
| POST   | `/register`   | Create an account    |
| POST   | `/login`      | Log in               |
| POST   | `/logout`     | Log out              |
| DELETE | `/deleteUser` | Delete your account  |

### Users & Profile
| Method | Route                 | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/api/me`             | Get current user info                |
| GET    | `/api/myStats`        | Get current user statistics          |
| GET    | `/api/data`           | Generic data endpoint (profile, history...) |
| POST   | `/api/updateAvatar`   | Update avatar                        |
| POST   | `/api/updateSettings` | Update account settings              |

### Friends
| Method | Route               | Description              |
|--------|---------------------|--------------------------|
| GET    | `/api/friendList`   | Get friend list          |
| POST   | `/api/addFriend`    | Add a friend             |
| DELETE | `/api/removeFriend` | Remove a friend          |
| GET    | `/api/userIdByName` | Look up a user ID by name|

### Game
| Method | Route          | Description        |
|--------|----------------|--------------------|
| POST   | `/api/addGame` | Record a game result |

### WebSocket
| Endpoint | Description                                                              |
|----------|--------------------------------------------------------------------------|
| `wss://` | Public/private chat, game invitations, paddle & score synchronization   |

---

## Database

SQLite via `better-sqlite3`. The database is initialized automatically on startup.

### Table `users`
| Column       | Type      | Description                  |
|--------------|-----------|------------------------------|
| id           | INTEGER   | Primary key                  |
| name         | TEXT      | Username (unique)            |
| email        | TEXT      | Email (unique)               |
| password     | TEXT      | Hashed password              |
| avatar       | TEXT      | Path to avatar               |
| twofa_secret | TEXT      | 2FA secret (optional)        |
| created_at   | TIMESTAMP | Creation date                |

### Table `games`
| Column        | Type      | Description                       |
|---------------|-----------|-----------------------------------|
| id            | INTEGER   | Primary key                       |
| player1_id    | INTEGER   | FK → users                        |
| player2_id    | INTEGER   | FK → users                        |
| player1_score | INTEGER   | Player 1 score                    |
| player2_score | INTEGER   | Player 2 score                    |
| winner_id     | INTEGER   | FK → users (null on draw)         |
| duration      | INTEGER   | Duration in seconds               |
| created_at    | TIMESTAMP | Date of the game                  |

### Table `friends`
| Column     | Type      | Description       |
|------------|-----------|-------------------|
| user_id    | INTEGER   | FK → users        |
| friend_id  | INTEGER   | FK → users        |
| created_at | TIMESTAMP | Date added        |

---

## 👥 Team

Project built as part of the **42** school curriculum.
