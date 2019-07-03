# Architecture
This document will the describe the high-level architecture of Vusic.

## Overall Pattern
One of the key aspects of Vusic's architecture is the Extension pattern (discussed below).

## Extensions
The extension pattern exists to improve the modularity of the codebase. New functionality can be added on top of an API without having to modify the core code. The functionality that extensions can add is entirely dependent on the API upon which they are built. This design pattern also enables third party developers to easily add functionality to the application; however, this requires the development of some sort of extension marketplace.

In addition to an API (system facade), extensions also require hooks. For example, each extension should be able to run code when activated and deactivated. Extensions should also be given some sort of context from which they can retrieve/store data. This data should be serialized to the filesystem when the application quits and deserialized during application startup. Finally, extensions should be able to return an API that other extensions can use.

### Core Extensions
Core extensions provide the core features of the API that is used by other extensions. For example, the `palette`, `busy`, and `theme` extensions are core to Vusic and are thus found in the `core` package. Unlike typical extensions, these are the first extensions activated during startup (ie. during import) and are exported in the system facade. Each of these extensions provides some sort of API to their aspect of the system. For example, the `theme` extension returns a function that can be called to change the theme of Vusic.

### Other Extensions
These consist of extensions found within the Vusic codebase that do not return an API (ie. `backup`, `record`) and all third-party extensions. Instead of being activated on import, these extensions export an `Extension` object that can be activated when necessary. Because third party

## Startup Sequence
The startup sequence is one of the most important aspects to understand. The first thing that we must do is identify which project we are currently opening. This is important as some of data that we load and then use within our project is dependant upon the project that is currently opened. For example, the `backup` extension stores a `boolean` for each project that says if a project should be backed up or not. Before we can initialize any extension, the project must be identified and the appropriate data must be loaded from the file system.