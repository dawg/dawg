# Vusic
[![Build Status](https://travis-ci.org/dawg/vusic.svg?branch=master)](https://travis-ci.org/dawg/vusic)
> A DAW for the 21st century!

<img src="https://i.ibb.co/bvp4VDK/web-1920-3.png" alt="Vusic Mockup" height="400">

## Roadmap
`Vusic` is currently being developed as part of `ENGG 4000` (`Senior Design Project`). This means development will continue until at least April 2019; however, the project itself was started before the course began and will hopefully continue after its completion. Several core ideas have and continue to influence the development of the application:

#### User Experience
Learning to use a DAW is often a painful process, even for experienced users. Additionally, the UI/UX in modern DAWs are  often lacking. We aim to change this by levering the web technology that is available today and focusing on the UI/UX during planning and development.

#### Collaboration
Music can be an  incredibly collaborative process. When two individuals are in the same room, collaboration is easy; however this is often not possible as collaborators are often geographically separated. By taking advantage of the real-time collaboration technology available today, we hope to enable producers and musicians to simultaneously collaborate, even when they are located on different continents.

#### Machine Learning
With the advent of machine learning technology, several manual processes, such as vocal separation or audio to MIDI transcription, have the possibility to be completely automated. We aim to take advantage of this research to provide cutting-edge technology to musicians and producers today.

### Tasks
Here is an incomplete list of the major tasks that need to be completed. :runner: indicates active development.
- [x] Application layout
- [x] Piano roll + patterns
- [x] Basic synthesizers + integration with the piano roll
- [ ] :runner: Automated vocal extraction
- [ ] :runner: Automated piano note transcription
- [x] Playlist
- [x] Mixer + effects
- [x] Automation clips
- [ ] :runner: Real-time collaboration
- [ ] :runner: VSTs

## Mockups
<img src="https://i.ibb.co/4Y1nVXw/side.png" height="600px" alt="side"     border="0">

> Bottom Tabs

<br/>
<img src="https://i.ibb.co/TRyPhgc/lower.png" height="600px" alt="lower" border="0">

> Side Tabs

## Contributing
### Prerequisites
1. Install [Node Version Manager (NVM)](https://github.com/creationix/nvm#install-script)
1. Install [Node and npm using NVM](https://github.com/creationix/nvm#usage)
1. Install the dependencies: `npm i`

### Development
Development occurs one of two places. Application development occurs in `Electron`; however, `Storybook` is used as an isolated component development environment. For many components, it is recommended that you create a `story` within `Storybook` to serve as active documentation.

#### Electron
Start the `Electron` application in development mode.
```
npm run serve:electron
```

#### Storybook
Start the `Storybook` server.
```
npm run serve:storybook
```

### Building
All of the following commands assume you are running running a `Linux` subsystem. 

#### Linux
```
npm run electron:build
```

#### MacOS
You can only build for MacOS on MacOS.

#### Windows
To build for windows, you must first install `Docker`. Once that has been complete, run the following docker command to start the `wine` container. Beware, you may run into sass issues.

```
docker run --rm -ti \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
 --env ELECTRON_CACHE="/root/.cache/electron" \
 --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
 -v ${PWD}:/project \
 -v ${PWD}/node_modules:/project/node_modules \
 -v ~/.cache/electron:/root/.cache/electron \
 -v ~/.cache/electron-builder:/root/.cache/electron-builder \
 electronuserland/builder:wine
```

This will load you into a bash shell in the `/project` folder. Once you are there, run the following command to the the `.exe` file:
```
npm run electron:build -- --win
```

#### Electron
Currently, we are able to build the `Electron` application; however, deployment and auto-update mechanisms have yet to be created. To build the application, run the following command:
```
npm run build:electron
```

#### Storybook
`GitHub Pages` deploys the website located in our `docs` folder on the `master` branch. To update this folder, you must first build the storybook website.
```
npm run build:storybook
```

After, you must create a PR into `develop` and then another into `master`. The site itself will deploy automatically once the PR into `master` has been merged.

# Testing
Currently, there is a small unit suite available. These tests make use of [Vue Test Utils](https://vue-test-utils.vuejs.org/) and can be initiated using the following command.
```
npm run test:unit
```
There is also an `test:e2e` command; however, this test suite does not currently contain any tests.

# Authors
|[<img src="https://avatars1.githubusercontent.com/u/18077531?s=460&v=4" width="128">](https://github.com/jsmith) |[<img src="https://avatars1.githubusercontent.com/u/36887395?s=400&v=4" width="128">](https://github.com/desilvamatt) | [<img src="https://avatars3.githubusercontent.com/u/27429447?s=460&v=4" width="128">](https://github.com/aeldesoky) | [<img src="https://avatars0.githubusercontent.com/u/30574445?s=400&v=4" width="128">](https://github.com/alexodonn)
|:---:|:---:|:---:|:---:|
| [Jacob Smith](https://github.com/jsmith) | [Matt DeSilva](https://github.com/desilvamatt) |[Amir Eldesoky](https://github.com/aeldesoky) | [Alex ODonnell](https://github.com/alexodonn)
|<sup>Software Engineering</sup>|<sup>Electrical Engineering</sup>|<sup>Electrical Engineering</sup>|<sup>Electrical Engineering</sup>

# TODO
- Naming elements in the playlist
