# Backend
> The backend repository for the cloud backup feature of Vusic.

## Local Development
```
npm i
```

## Heroku Configuration
```
# step 1
heroku buildpacks:set -a dawgvusic https://github.com/Pagedraw/heroku-buildpack-select-subdir

# step 2
heroku config:add BUILDPACK='packages/backend=https://github.com/heroku/heroku-buildpack-nodejs#v83' -a dawgvusic
```
> See https://jaketrent.com/post/deploy-lerna-packages-heroku/