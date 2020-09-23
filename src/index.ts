import Application from './Application';

// start the application
new Application().start(
    process.argv.slice(2).includes('--immediate'),
    !process.argv.slice(2).includes('--not-headless'),
);
