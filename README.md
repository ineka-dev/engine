<br>
<p align="center">
  <img src="https://raw.githubusercontent.com/ineka-dev/engine/main/.github/assets/banner.png" alt="Ineka">
</p>

<p align="center">
  <a href="https://ineka-dev.github.io/engine/"><strong>Explore the documentation »</strong></a>
  <br>
  <br>
  <a href="https://www.npmjs.com/package/@ineka/engine"><img alt="npm" src="https://img.shields.io/npm/v/@ineka/engine?style=for-the-badge"></a>
  <a href="https://github.com/ineka-dev/engine/actions/workflows/release.yml"><img alt="GitHub Workflow Status Release" src="https://img.shields.io/github/actions/workflow/status/ineka-dev/engine/release.yml?logo=github&style=for-the-badge"></a>
  <a href="https://github.com/ineka-dev/engine/actions/workflows/docs.yml"><img alt="GitHub Workflow Status Documentation" src="https://img.shields.io/github/actions/workflow/status/ineka-dev/engine/docs.yml?label=docs&logo=github&style=for-the-badge"></a>
  <a href="https://github.com/ineka-dev/engine/blob/main/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/ineka-dev/engine?color=black&style=for-the-badge"></a>
  <a href="https://github.com/ineka-dev/engine/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues-raw/ineka-dev/engine?style=for-the-badge">
  </a>
  <a href="https://github.com/ineka-dev/engine/pulls"><img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr-raw/ineka-dev/engine?style=for-the-badge"></a>
  <a href="https://bundlephobia.com/package/@ineka/engine"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/min/@ineka/engine?style=for-the-badge"></a>
</p>

Ineka is a **small and customizable** game engine made as **a passion project** to learn more about game and web development.

This project uses a blazingly fast **Data-Oriented Graph** and **Trait Sparse Sets** instead of a traditional Object-Oriented ECS, while still providing a highly composable Developer Experience.

I prefer to warn you that this project was **made for personal use** but nothing is stopping you from using it or contributing.

## Getting started

### CLI installation
The simplest way to create a game project for Ineka is by using:
```bash
npx @ineka/create-game <name>
```

If you have **npm 6+** you can also use:
```bash
npm init @ineka/game <name>
# Or
npm create @ineka/game <name>
```

You can find [the cli package sources here](https://github.com/ineka-dev/create-game).

### Manual installation
You can also install the package using a package manager:
```bash
npm install @ineka/engine
```

Then use a bundler like [webpack](https://webpack.js.org/), [rollup](https://rollupjs.org/) or [parcel](https://parceljs.org/) to bundle your game.

## Packages

Ineka, by design, ships with a very minimal set of features. The goal is to offer an ecosystem of packages to customize the engine with **features you want and need** instead of imposing them.

This concept aims to **reduce bloat** and offer **a large panel of customization options**.

[**Find more about available packages here**](https://github.com/ineka-dev/packages)

## Contributing
Any help and contribution is welcome, feel free to submit issues and/or contribute to the project.

**Please read through the [contributing guidelines](./.github/CONTRIBUTING.md) for more details.**

## License

Copyright (c) 2021 Colin Espinas.

Ineka is distributed under the **MIT License**. See [the license](./LICENSE) for more details.
