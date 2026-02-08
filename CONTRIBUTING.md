# Contributing to Nural

Thank you for your interest in contributing to Nural! We welcome contributions from everyone.

## 🛠️ Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/nural.git
    cd nural
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Create a branch** for your feature or fix:
    ```bash
    git checkout -b feature/amazing-feature
    ```

## 🧪 Running Tests

Ensure all tests pass before submitting a PR:

```bash
npm test
```

## 📏 Coding Standards

- **TypeScript**: We use strict TypeScript. No `any` unless absolutely necessary.
- **Formatting**: Run `npm run format` to enforce Prettier styles.
- **Linting**: Run `npm run lint` to catch potential issues.
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add new adapter`, `fix: resolve cors issue`).

## 🚀 Contribution Workflow ("Fork & Pull")

We use the "Fork & Pull" workflow. Here's how to contribute:

1.  **Fork the Repository**: Click the "Fork" button on the top right of this page.
2.  **Clone Your Fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/nural.git
    cd nural
    ```
3.  **Create a Branch**: Always create a new branch for your work.
    ```bash
    git checkout -b feat/amazing-feature
    # or
    git checkout -b fix/annoying-bug
    ```
4.  **Make Changes**: Write your code and tests.
5.  **Commit**: Use [Conventional Commits](https://www.conventionalcommits.org/).
    ```bash
    git commit -m "feat: add support for fastify adapter"
    ```
6.  **Push to Your Fork**:
    ```bash
    git push origin feat/amazing-feature
    ```
7.  **Open a Pull Request (PR)**:
    - Go to the original `nural` repository.
    - Click "New Pull Request".
    - Select your fork and branch.
    - Fill out the PR template clearly.

### Branch Protection & Review Process

The `main` branch is protected. To merge:

- **Review Required**: At least one maintainer must approve your PR.
- **Status Checks**: All CI tests (`npm test`, `npm run lint`, `npm run build`) must pass.
- **No Direct Pushes**: You cannot push directly to `main`.

We aim to review all PRs within 48 hours. Thank you for your patience!

## 🐛 Reporting Bugs

Please open an issue with:

- A clear title.
- Steps to reproduce.
- Expected vs. actual behavior.
- Environment details (Node version, OS).

Thank you for helping make Nural better!
