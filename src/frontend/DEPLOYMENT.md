# OP_DUP Secure Messages - Deployment Guide

This guide covers deploying the OP_DUP Secure Messages application to the Internet Computer (IC) mainnet.

## Prerequisites

Before deploying to IC mainnet, ensure you have:

- **DFX CLI** installed (version 0.15.0 or later)
  ```bash
  sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
  ```

- **Node.js** and **npm** (or **pnpm**) installed
  ```bash
  node --version  # Should be v18 or later
  npm --version
  ```

- **Cycles** for deployment (obtain from the NNS or a cycles faucet)
  - You'll need cycles to create and deploy canisters on mainnet
  - Visit https://internetcomputer.org/docs/current/developer-docs/setup/cycles/

- **Internet Identity** for authentication
  - The app uses Internet Identity for user authentication
  - Users will authenticate via https://identity.ic0.app

## Local Development Setup

Before deploying to mainnet, test locally:

