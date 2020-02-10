# Vusic
![Build Status](https://img.shields.io/github/workflow/status/dawg/vusic/Release?style=for-the-badge&logo=GitHub)
![Version](https://img.shields.io/github/package-json/v/dawg/vusic?style=for-the-badge)

![Vusic](https://i.ibb.co/qRRVRwh/image.png)
> A DAW for the 21st century! 


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
Development occurs one of two places. Application development occurs in `Electron`. To start the `Electron` application in development mode, use this command:
```
npm run serve:electron
```

### Building
The following command will build `Vusic` for your current operating system. It is not very easy to build cross-platform. As such, we use `Travis CI` to build for Linux, MacOS, and Windows at the same time. See the `.travis.yml` file for more information.
```
npm run build
```

#### Electron
Currently, we are able to build the `Electron` application; however, deployment and auto-update mechanisms have yet to be created. To build the application, run the following command:
```
npm run build:electron
```

# Testing
Currently, there is a small unit suite available. These tests make use of [Vue Test Utils](https://vue-test-utils.vuejs.org/) and can be initiated using the following command.
```
npm run test:unit
```
There is also an `test:e2e` command; however, this test suite does not currently contain any tests.

# Deploying
First, replace of references of the version in `package.json` and `.travis.yml` to the new version. Then add and commit your changes.

# Authors
|[<img src="https://avatars1.githubusercontent.com/u/18077531?s=460&v=4" width="128">](https://github.com/jsmith) |[<img src="https://avatars1.githubusercontent.com/u/36887395?s=400&v=4" width="128">](https://github.com/desilvamatt) | [<img src="https://avatars3.githubusercontent.com/u/27429447?s=460&v=4" width="128">](https://github.com/aeldesoky) | [<img src="https://avatars0.githubusercontent.com/u/30574445?s=400&v=4" width="128">](https://github.com/alexodonn)
|:---:|:---:|:---:|:---:|
| [Jacob Smith](https://github.com/jsmith) | [Matt DeSilva](https://github.com/desilvamatt) |[Amir Eldesoky](https://github.com/aeldesoky) | [Alex ODonnell](https://github.com/alexodonn)
|<sup>Software Engineering</sup>|<sup>Electrical Engineering</sup>|<sup>Electrical Engineering</sup>|<sup>Electrical Engineering</sup>

# Releasing
Change all of the version references in `package.json` and `.travis.yml` to the new version. Make sure to change the paths in the `deploy` section of the `.travis.yml`. Add and commit your changes and then tag your release:
```
git tag -a vX.X.X -m "YOUR MESSAGE HERE"
```

Then, push the commits and tags:
```
git push
git push --tags
```

*For now, this will need to be done directly on master (I think).*

# References
[GridSound](https://gridsound.com) was a great reference during development. For example, components such as `Timeline.vue` and `BeatLines.vue` were based off similar component implementations from [gs-ui-components](https://github.com/gridsound/gs-ui-components).

[VS Code](https://code.visualstudio.com/) was also used as a reference during development. We are big fans of the structure and navigation tools (Shortcuts, Command Palette, etc) and wanted to implement similar features within `Vusic`.
