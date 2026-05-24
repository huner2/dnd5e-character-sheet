# D&D 5e Character Sheet

A browser-based D&D 5e character sheet built with React, Mantine, and vendored [5etools](https://github.com/5etools-mirror-3/5etools-src) compendium data.

## Development

```bash
npm install
git submodule update --init vendor/5etools-src
npm run dev
```

Update compendium data locally:

```bash
npm run sync:5etools
```

## License

Compendium data is vendored from 5etools; see `vendor/5etools-src` for upstream licensing.
