# 3080-finder

Finds Nvidia RTX 3080 graphics cards at various retailers in Australia.

## What is it?

First thing to note is that this will **NOT** purchase cards for you. This is only intended to be used to check
stock/availability/price/card changes at various retailers in Australia.

I built this as I didn't want to have to preorder a card, and wanted some way to see when new cards come online with
stock or ETA's are added to shopping sites.

An alert will trigger when:

- A new card is added to a retailer
- A cards price is changed
- A cards availability has changed
- A cards stock level has changed (this is not common on most shops, but some do provide it)

The first time you run the application it will blast you with notifications as it finds all the cards on all the shops.

By default it will check for changes every 5 minutes, but it can be customised in the config using standard
[cron syntax](https://crontab.guru/).

## Development

To get setup you will need to make sure you have the following installed on your machine:

- [NodeJS 12](https://nodejs.org/en/download/)
  - check out [nvm](https://github.com/creationix/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows)

We'll assume you're a capable developer, so we won't tell you how to go about installing those on your machine :)

Next clone this repo to a directory and then run `npm install` to install all the dependencies needed to run.

Once installed you can run `npm run dev` to start the process and auto reload when any changes are made to files.

## Building

To build the project simply run `npm run build` which will compile all the files in the `src/` directory with TypeScript
and then spit it out in the `dist/` directory.

Once built simply run `npm run start` which will run the `index.js` file in the `dist/` folder.

## Config

Configuration is handled through a NPM package called `config`. You can see all the ways to change the configuration at
<https://github.com/lorenwest/node-config>.

Do not change the `default.json` file at all. When new configs are added with defaults, if you have a conflict here, it
may negate some changes and cause issues.

The best thing to do is to create a `local.json` file in the config folder and put your config in there. That file is
gitignored by default, so shouldn't get committed up.

Alternatively you can provide a `NODE_CONFIG` environment variable with a json string.

### Add PushBullet alerting

To add in alerting for PushBullet, you'll need 2 config keys:

- `pushbullet_key`: this is an access token from
  [https://www.pushbullet.com/#settings/account](PushBullet settings page)
- `pushbullet_device_id`: this is your device ID to send the message to. You can find this in the url in PushBullet web
  dashboard under devices. The url will be like `https://www.pushbullet.com/#devices/{this is your device id}`

## Database

This project uses NEDB to provide a local json filesystem database. It will store all the data locally in the `db/`
directory.

## Logging

By default, all logging will be done to the console during development, and to a log file in the `logs` directory in
production.

By default the logging level is set to `error` level, but can be set to:

- error
- info
- debug

## License

This code is licensed under the MIT license. For more details see the `LICENSE` file in the root of this repository.
