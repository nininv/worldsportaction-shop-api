import {logger} from '../logger';

require("dotenv").config();

const puppeteer = require('puppeteer');

const WON = 1;
const LOST = 2;
const DRAWN = 3;

const TIMEOUT = 40000;

async function login(page, mnbUrl: string, mnbUser: string, mnbPassword: string,) {
    await page.goto(mnbUrl);

    await page.type('#ctl00_MainPlaceHolder_ctl00_txtUsr', mnbUser);
    await page.type('#ctl00_MainPlaceHolder_ctl00_txtPwd', mnbPassword);

    const wait = page.waitForNavigation({timeout: TIMEOUT});
    await page.click('#ctl00_MainPlaceHolder_ctl00_Submit1');
    await wait;

    logger.info(`Logged into mynb`);
}

async function submitScore(mynetballMatchId: string,
                           team1Score: number,
                           team2Score: number,
                           mnbUrl: string,
                           mnbUser: string,
                           mnbPassword: string,) {

    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true
    });

    try {

        const page = await browser.newPage();
        page.on("dialog", (dialog) => {
            dialog.accept();
        });

        await login(page, mnbUrl, mnbUser, mnbPassword);

        // Submit the score.
        await page.goto(`${mnbUrl}/pages/admin/matchscore_12.aspx?&matchID=${mynetballMatchId}&popup=1`);

        // Version 1
        if (await page.$(`#ctl00_MainPlaceHolder_dlScores_ctl00_dg1_ctl06_tbScore_1`) !== null) {
            await type(page, '#ctl00_MainPlaceHolder_dlScores_ctl00_dg1_ctl06_tbScore_1', `${team1Score}`);
            await type(page, '#ctl00_MainPlaceHolder_dlScores_ctl01_dg1_ctl06_tbScore_1', `${team2Score}`);
        }

        // Version 2
        if (await page.$(`#ctl00_MainPlaceHolder_dlScores_ctl00_dg1_ctl04_tbScore_1`) !== null) {
            await type(page, '#ctl00_MainPlaceHolder_dlScores_ctl00_dg1_ctl04_tbScore_1', `${team1Score}`);
            await type(page, '#ctl00_MainPlaceHolder_dlScores_ctl01_dg1_ctl04_tbScore_1', `${team2Score}`);
        }

        await page.select('#ctl00_MainPlaceHolder_dlScores_ctl00_dlResultType', `${team1Score > team2Score ? WON : team1Score === team2Score ? DRAWN : LOST}`);
        await page.select('#ctl00_MainPlaceHolder_dlScores_ctl01_dlResultType', `${team2Score > team1Score ? WON : team2Score === team1Score ? DRAWN : LOST}`);
        const wait = page.waitForNavigation({timeout: TIMEOUT});
        await page.click('#ctl00_MainPlaceHolder_ucSave');
        await wait;

        logger.info(`Submitted MYNB score: ${team1Score} ${team2Score} to ${mynetballMatchId}`);

    } catch (err) {
        logger.error(`Error while submitting scores for match ${mynetballMatchId}`, err);
        throw Error(`Failed to submit scores to MyNetball.`);
    }

    browser.close();
}


function normalizeName(name: string) {
    if (name) {
        return name
            .replace(/,/g, '')
            .replace(/ /g, '')
            .toLowerCase();
    }
    return name;
}

async function type(page, selector, value) {
    await page.evaluate((selector, value) => {
        document.querySelector(selector).value = value;
    }, selector, value);
}

export {
    submitScore
};
