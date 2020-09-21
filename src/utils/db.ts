import Datastore from 'nedb-promises';

export const databases = {
    cards: Datastore.create({
        filename: './db/cards.db',
        timestampData: true,
        autoload: true,
    }),
};
