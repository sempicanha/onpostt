# Decentralized Event Relay Protocol

This project implements a decentralized event relay protocol inspired by [Nostr](https://github.com/nostr-protocol/nostr). It allows clients to publish, retrieve, hide, and delete events in a decentralized manner using WebSockets and SQLite for persistence.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Setup](#setup)
4. [Usage](#usage)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Security Considerations](#security-considerations)
8. [Contributing](#contributing)

---

## Overview

The relay server acts as a hub for decentralized communication. Clients can connect via WebSocket to publish events, retrieve events based on filters, hide events, or delete events. Events are stored in an SQLite database for persistence.

---

## Features

- **Event Publishing**: Clients can publish events with fields like `id`, `pubkey`, `created_at`, `kind`, `tags`, `content`, `sig`, and `app`.
- **Event Retrieval**: Clients can query events using filters such as `pubkey`, `kinds`, `since`, `until`, `tags`, and `app`.
- **Event Moderation**: Admins can hide or delete events using valid signatures.
- **Persistence**: Events are stored in an SQLite database with indexing for efficient querying.
- **Rate Limiting**: Limits the number of events returned per request to prevent abuse.

---

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- SQLite3

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sempicanha/onpostt.git
   cd decentralized-event-relay
