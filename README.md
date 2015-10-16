# DrawNetwork
A paint like program that lets you draw with multiple people in a web browser.

Before you run draw.network locally you will need to install the npm packages
```
npm install
```

## Running
```
npm run start
```

You will need to build the application first. 

```
npm run build && npm run start
```
If you want to run it in development mode append `dev` after build

## Building
DrawNetwork uses Gulp to minify JavaScript, CSS and the HTML. You can do this
```
npm run build
```

This will build the production version, which uses `Googles Closure Complier` on the JavaScript. However if you need to run in development with source maps you can do so via this command:
```
npm run build dev 
```
