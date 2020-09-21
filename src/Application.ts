import puppeteer from 'puppeteer';
import { performance } from 'perf_hooks';

import { Card, CardDBRecord, Scannable, ScanResult } from './core';

import logger from './utils/logger';
import { databases } from './utils/db';

import PBTech from './sites/pbtech';
import PLEComputers from './sites/plecomputers';
import PCCaseGear from './sites/pccasegear';
import Scorptec from './sites/scorptec';

class Application {
    scanners: Scannable[] = [new PBTech(), new PLEComputers(), new PCCaseGear(), new Scorptec()];

    async scanSites() {
        logger.debug('Scheduler::scanSites - running');
        const start = performance.now();

        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--window-size=1920,1080', '--window-position=1921,0'],
        });

        await Promise.allSettled(
            this.scanners.map(
                (scanner) =>
                    new Promise(async (resolve) => {
                        logger.debug(`Scheduler::scanSites - running ${scanner.constructor.name}`);
                        const start = performance.now();

                        const result = await scanner.scan(browser);

                        const end = performance.now();
                        logger.debug(
                            `Scheduler::scanSites - finished running ${scanner.constructor.name} in ${end - start}ms`,
                        );

                        for await (const card of result.cards) {
                            const cardRecord = await databases.cards.findOne<CardDBRecord>({
                                productNumber: card.productNumber,
                                scanner: scanner.constructor.name,
                            });

                            if (!cardRecord) {
                                logger.info(
                                    `New card on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) for ${card.price} with availablity of "${card.availability}"`,
                                );
                            } else {
                                if (cardRecord.price !== card.price) {
                                    logger.info(
                                        `Card price changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from ${cardRecord.price} to ${card.price}`,
                                    );
                                }

                                if (cardRecord.availability !== card.availability) {
                                    logger.info(
                                        `Card availability changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.availability}" to "${card.availability}"`,
                                    );
                                }

                                if (cardRecord.stockStore !== card.stockStore) {
                                    logger.info(
                                        `Card store stock changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.stockStore}" to "${card.stockStore}"`,
                                    );
                                }

                                if (cardRecord.stockSupplier !== card.stockSupplier) {
                                    logger.info(
                                        `Card supplier stock changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.stockSupplier}" to "${card.stockSupplier}"`,
                                    );
                                }
                            }

                            await databases.cards.update<CardDBRecord>(
                                {
                                    productNumber: card.productNumber,
                                    scanner: scanner.constructor.name,
                                },
                                { ...card, scanner: scanner.constructor.name },
                                { upsert: true },
                            );
                        }

                        resolve();
                    }),
            ),
        );

        const end = performance.now();
        logger.debug(`Scheduler::scanSites - finished running after ${end - start}ms`);

        await browser.close();
    }

    /**
     * Starts the application.
     */
    async start() {
        logger.debug('Starting application');

        // schedule.scheduleJob('* * * * *', () => this.scanSites());
        await this.scanSites();

        // compact the database
        // @ts-ignore
        databases.cards.persistence.compactDatafile();
    }
}

export default Application;
