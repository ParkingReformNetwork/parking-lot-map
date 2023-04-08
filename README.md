# Parking Lot Map

The code behind https://parkingreform.org/parking-lot-map/.

The code is fairly simple and we intentionally are not using fancy frameworks like React or Svelte. The main files are `index.html`, `js/script.js`, and `data/*.geojson`. `js/script.js` will load the `.geojson` files to dynamically update `index.html` with all our data.

# How tos

All the commands take place in a _terminal_, a text-based interface for interacting with your computer. On macOS, you can open the "Terminal" app. On Windows, you can use "Git Bash", which will be installed when you install Git below.

You will also need to install:

- Git, which we use for "version control": https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
- NPM, which is how we run JavaScript and our tests. Use the LTS at https://nodejs.dev/en/download/

To run the below commands, open your terminal app. Make sure you have `git clone`d the fork of your repository somewhere on your machine. Then, use `cd <directory>` to navigate there, e.g. `cd code/parking-lot-map`.

## Start the server

```bash
❯ npm start
```

Then open http://127.0.0.1:1234 in a browser. Hit `CTRL-C` to stop the server.

When the server is running, you can make any changes you want to the project. Reload the page in the browser to see those changes. (You may need to force reload, e.g. hold the shift key while reloading on macOS.)

## Run tests

You must first have the server running in a tab of your terminal by running `npm start`. Then, in a new tab, you can run this:

```bash
❯ npm test
```

## Autoformat code

```bash
❯ npm run fmt
```

## Lint code

"Linting" means using tools that check for common issues that may be bugs or low code quality.

```bash
❯ npm run lint
```

## Update parking lot data

We have a script that will update `data/parking-lots.geojson` for you.

First, export the geoJSON file and save it as the file `parking-lots-update.geojson` in the root of this repository. If the file already exists, overwrite it with your new data.

Then, determine the city/state name. This is the same as what we show in the city toggle on the site, e.g. `Saint Louis, MO`.

Now, run the below but replace the last part with the city/state name (in single quotes!):

```bash
❯ npm run update-lots -- 'My City, AZ'
```

If the city is brand new, add the flag `--add`:

```bash
❯ npm run update-lots -- 'My City, AZ' --add
```

Run the site with `npm start` and make sure it's what you want. Also, autoformat the file with `npm run fmt`.

Then, save your changes in Git (in a new branch) and open a pull request. See the section "Make a contribution" below.

## Update city score card and boundaries

To change the score card, directly edit it in `data/cities-polygons.geojson`. Search for your city name, like `Saint Louis, Mo`. Be careful to not change the key names.

To update the boundaries, export the geoJSON file and save it as the file `city-update.geojson` in the root of this repository. If the file already exists, overwrite it with your new data.

Then, determine the city/state name. This is the same as what we show in the city toggle on the site, e.g. `Saint Louis, MO`.

Now, run the below but replace the last part with the city/state name (in single quotes!):

```bash
❯ npm run update-city-boundaries -- 'My City, AZ'
```

If the city is brand new, add the flag `--add`:

```bash
❯ npm run update-city-boundaries -- 'My City, AZ' --add
```

When adding a new city, first run the script, then open up `data/cities-polygons.geojson` and manually update the score card values.

Regardless of whether what you updated, start the site with `npm start` and make sure it's what you want. Also, autoformat the file with `npm run fmt`.

Finally, save your changes in Git (in a new branch) and open a pull request. See the section "Make a contribution" below.

## Build to preview a release

We use continuous deployment, meaning that we re-deploy the site every time we merge a pull request.

You can preview what a build will look like by running `npm run build`. Then use `npm run serve-dist` to start the server.

You can also run our integration tests on built dist folder. Run `npm run serve-dist` in one terminal, then `npm run test-dist` in another.

## Make a contribution

We use the typical forking model to make contributions by opening Pull Requests. See https://docs.github.com/en/get-started/quickstart/contributing-to-projects.
