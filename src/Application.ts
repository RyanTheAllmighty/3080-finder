import config from 'config';
import puppeteer from 'puppeteer';
// @ts-ignore
import PushBullet from 'pushbullet';
import schedule from 'node-schedule';
import { performance } from 'perf_hooks';

import { Card, CardDBRecord, Scannable, ScanResult } from './core';

import logger from './utils/logger';
import { databases } from './utils/db';

import PBTech from './sites/pbtech';
import PLEComputers from './sites/plecomputers';
import PCCaseGear from './sites/pccasegear';
import Scorptec from './sites/scorptec';
import MWave from './sites/mwave';
import CPLOnline from './sites/cplonline';
import GameDude from './sites/gamedude';
import AussieAppliances from './sites/aussieappliances';
import ShoppingExpress from './sites/shoppingexpress';
import BudgetPC from './sites/budgetpc';
import PCByte from './sites/pcbyte';
import AustinComputers from './sites/austincomputers';
import UMart from './sites/umart';
import ComputerAlliance from './sites/computeralliance';
import OnlineComputer from './sites/onlinecomputer';

class Application {
    scanners: Scannable[] = [
        new PBTech(),
        new PLEComputers(),
        new PCCaseGear(),
        new Scorptec(),
        new MWave(),
        new CPLOnline(),
        new GameDude(),
        new AussieAppliances(),
        new ShoppingExpress(),
        new BudgetPC(),
        new PCByte(),
        new AustinComputers(),
        new UMart(),
        new ComputerAlliance(),
        new OnlineComputer(),
    ];

    pusher = new PushBullet(config.get<string>('pushbullet_key'));

    async scanSites(headless: boolean) {
        logger.debug('Scheduler::scanSites - running');
        const start = performance.now();

        const browser = await puppeteer.launch({
            headless,
            defaultViewport: null,
            args: ['--window-size=1920,1080', '--window-position=1921,0'],
            timeout: 60000,
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
                                this.pusher.note(
                                    config.get<string>('pushbullet_device_id'),
                                    '3080 Finder',
                                    `New card on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) for ${card.price} with availablity of "${card.availability}" [${card.url}]`,
                                );

                                logger.info(
                                    `New card on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) for ${card.price} with availablity of "${card.availability}" [${card.url}]`,
                                );
                            } else {
                                if (cardRecord.price !== card.price) {
                                    this.pusher.note(
                                        config.get<string>('pushbullet_device_id'),
                                        '3080 Finder',
                                        `Card price changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from ${cardRecord.price} to ${card.price} [${card.url}]`,
                                    );

                                    logger.info(
                                        `Card price changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from ${cardRecord.price} to ${card.price} [${card.url}]`,
                                    );
                                }

                                if (cardRecord.availability !== card.availability) {
                                    this.pusher.note(
                                        config.get<string>('pushbullet_device_id'),
                                        '3080 Finder',
                                        `Card availability changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.availability}" to "${card.availability}" [${card.url}]`,
                                    );

                                    logger.info(
                                        `Card availability changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.availability}" to "${card.availability}" [${card.url}]`,
                                    );
                                }

                                if (cardRecord.stockStore !== card.stockStore) {
                                    this.pusher.note(
                                        config.get<string>('pushbullet_device_id'),
                                        '3080 Finder',
                                        `Card store stock changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.stockStore}" to "${card.stockStore}" [${card.url}]`,
                                    );

                                    logger.info(
                                        `Card store stock changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.stockStore}" to "${card.stockStore}" [${card.url}]`,
                                    );
                                }

                                if (cardRecord.stockSupplier !== card.stockSupplier) {
                                    this.pusher.note(
                                        config.get<string>('pushbullet_device_id'),
                                        '3080 Finder',
                                        `Card supplier stock changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.stockSupplier}" to "${card.stockSupplier}" [${card.url}]`,
                                    );

                                    logger.info(
                                        `Card supplier stock changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.stockSupplier}" to "${card.stockSupplier}" [${card.url}]`,
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

        // compact the database
        // @ts-ignore
        databases.cards.persistence.compactDatafile();
    }

    /**
     * Starts the application.
     */
    async start() {
        logger.debug('Starting application');

        schedule.scheduleJob('*/5 * * * *', () => this.scanSites(true));

        // await this.scanSites(false);
    }
}

export default Application;
