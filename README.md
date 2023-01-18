# LCA Collect - Shared E2E Testing Library

A shared library for E2E testing utilities.
Currently, these utilities are targeted [Cypress](https://cypress.io)

![LCA Collect Dependencies](./dependencies.png)

## Getting Started

```shell
npm install
```

## Build, Test & Publish

To publish a new version:

1. Update the version in `package.json` (remember to follow semver)
2. When you're satisfied and ready to publish, then run

```shell
npm run build
npm publish
```

## Development Setup with other @lcacollect packages

You can use `npm link` to set up live reloading of the other `@lcacollect` packages.

- Clone the package that you wish to enable live reload on.
- In the terminal, go the root folder of the cloned repo and write `npm link` in the terminal
- Go back to this repo's root folder and write `npm link @lcacollect/{PACKAGE}` to link the package.
- When you make changes to the package, that you wish to see in this app, simply run `npm run build` in the package and
  the changes will available here.

## Folder Structure and Naming
```python
src/ # Contains the source code
    myComponent/ # Each component has its own folder
        index.ts # Export of what is public
        myComponent.tsx # The component
        myComponent.spec.tsx # Unit test file

```

## Further Documentation

Further documentation for LCAcollect can be found [here](https://github.com/lcacollect/.github/blob/main/wiki/README.md)
