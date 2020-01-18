# Framework
This is the "framework" of the application.

## Core Principles
- It knows nothing about the application it is supporting.
- It provides an extremely flexible API for creating applications and provides the bare bones (ie. theming, context menus, extension functionality).
- It could be easily be extracted and published as an external package such that other applications could use it as their base as well.
- For now, it relies on Electron as a backend for a menus and such.
- It works with the assumption of a "project". A project is stored in a JSON file and loaded during startup. Each "project" must be an object with an ID attribute.