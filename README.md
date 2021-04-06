# DrawNetwork
A paint like program that lets you draw with multiple people in a web browser.

Before you run draw.network locally you will need to install the npm packages
```
npm install
```

## Building
DrawNetwork uses Rollup to bundle JavaScript and uses node-sass to complie scss into css.  

Builds production ready and minified bundles of js and css
```
npm run build
```

### Dev builds
indiviudal commands for both js and css. By default the dev build is un-minified  
```
npm run build:dev:js
npm run build:dev:scss
```

## Running the app
```
npm run start
```

### update notes
There is a `iife` that is fired at the very bottom of the global.js file that acts as the init step. Once we actually refactor this will be removed and an actual initialize function will be implemented.