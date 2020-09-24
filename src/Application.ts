import config from 'config';
// @ts-ignore
import PushBullet from 'pushbullet';
import asyncBatch from 'async-batch';
import notifier from 'node-notifier';
import schedule from 'node-schedule';
import puppeteer from 'puppeteer-extra';
import { performance } from 'perf_hooks';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { CardDBRecord, Scannable } from './core';

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
import SaveOnIt from './sites/saveonit';
import IJK from './sites/ijk';
import FantasticHobbies from './sites/fantastichobbies';
import EYO from './sites/eyo';
import AllNeeds from './sites/allneeds';
import DDComputer from './sites/ddcomputer';
import TechHut from './sites/techhut';
import MegaBuy from './sites/megabuy';
import Centrecom from './sites/centrecom';

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
        new SaveOnIt(),
        new IJK(),
        new FantasticHobbies(),
        new EYO(),
        new AllNeeds(),
        new DDComputer(),
        new TechHut(),
        new MegaBuy(),
        new Centrecom(),
    ];

    pusher: any;

    constructor() {
        if (config.has('pushbullet_key') && config.has('pushbullet_device_id')) {
            this.pusher = new PushBullet(config.get<string>('pushbullet_key'));
        }
    }

    async scanSites(headless: boolean) {
        logger.debug('Scheduler::scanSites - running');
        const start = performance.now();

        puppeteer.use(StealthPlugin());

        const browser = await puppeteer.launch({
            headless,
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: config.get<number>('timeout'),
        });

        await asyncBatch(
            this.scanners,
            (scanner) =>
                new Promise(async (resolve, reject) => {
                    try {
                        logger.debug(`Scheduler::scanSites - running ${scanner.constructor.name}`);
                        const start = performance.now();

                        const result = await scanner.scan(browser);

                        const end = performance.now();
                        logger.debug(
                            `Scheduler::scanSites - finished running ${scanner.constructor.name} in ${
                                end - start
                            }ms. Found ${result.cards.length} cards`,
                        );

                        for await (const card of result.cards) {
                            const cardRecord = await databases.cards.findOne<CardDBRecord>({
                                productNumber: card.productNumber,
                                scanner: scanner.constructor.name,
                            });

                            if (!cardRecord) {
                                this.recordChange(
                                    '3080 Finder - New Card',
                                    `New card on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) for ${card.price} with availablity of "${card.availability}" [${card.url}]`,
                                );
                            } else {
                                if (cardRecord.price !== card.price) {
                                    this.recordChange(
                                        '3080 Finder - Price Changed',
                                        `Card price changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from ${cardRecord.price} to ${card.price} [${card.url}]`,
                                    );
                                }

                                if (cardRecord.availability !== card.availability) {
                                    this.recordChange(
                                        '3080 Finder - Availability Changed',
                                        `Card availability changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.availability}" to "${card.availability}" [${card.url}]`,
                                    );
                                }

                                if (cardRecord.stockStore !== card.stockStore) {
                                    this.recordChange(
                                        '3080 Finder - Stock Changed',
                                        `Card store stock changed on ${scanner.constructor.name}: ${card.name} (${card.productNumber}) from "${cardRecord.stockStore}" to "${card.stockStore}" [${card.url}]`,
                                    );
                                }

                                if (cardRecord.stockSupplier !== card.stockSupplier) {
                                    this.recordChange(
                                        '3080 Finder - Stock Changed',
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
                    } catch (e) {
                        logger.error(
                            `Error when scanning ${scanner.constructor.name} - ${e?.message || 'Unknown error'}`,
                        );
                        resolve();
                    }

                    resolve();
                }),
            config.get<number>('batch_size'),
        );

        const end = performance.now();
        logger.debug(`Scheduler::scanSites - finished running after ${end - start}ms`);

        await browser.close();

        // compact the database
        // @ts-ignore
        databases.cards.persistence.compactDatafile();
    }

    private recordChange(title: string, message: string) {
        if (config.get<boolean>('send_notifications')) {
            if (this.pusher) {
                this.pusher.note(config.get<string>('pushbullet_device_id'), '3080 Finder', message);
            }

            notifier.notify({
                title,
                message,
            });
        }

        logger.info(message);
    }

    /**
     * Starts the application.
     */
    async start(immediate: boolean = false, headless: boolean = true, runOnce: boolean = false) {
        logger.debug('Starting application');

        if (!runOnce) {
            schedule.scheduleJob(config.get<string>('cron_expression'), () => this.scanSites(true));
        }

        if (runOnce || immediate) {
            await this.scanSites(headless);
        }
    }
}

export default Application;
