# DrawNetwork
A paint like program that lets you draw with multiple people in a web browser.

Before you run draw.network locally you will need to install the npm packages
```
npm install
```

## Building
DrawNetwork uses Rollup to bundle JavaScript and SCSS  
`npm run build:prod` - builds the production ready and minified bundle.  
`npm run build:dev` - builds and raises the -watch flag, any changes made will be rebuilt. By default the dev build is un-minified


## Running the app
```
npm run start
```
If you want to make changes on the front-end, use the `npm run build:dev`


### update notes
There is a `iife` that is fired at the very bottom of the global.js file that acts as the init step. Once we actually refactor this will be removed and an actual initialize function will be implemented.