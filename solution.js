const puppeteer = require('puppeteer');
const WEBSITE_URL = 'http://sdetchallenge.fetch.com/';
const WEIGH_BUTTON_SELECTOR = "weigh";
const WEIGHINGS_SELECTOR = '.game-info > ol > li';
const LEFT_SIDE = "left";
const RIGHT_SIDE = "right";
clickButton = async (page, classSelector) => await page.click(`#${classSelector}`);

clickCoin = async (page, coinIdx) => await page.click(`#coin_${coinIdx}`);
addGold = async (page, bowl, gold, tileIdx) => await page.type(`#${bowl}_${tileIdx}`, `${gold}`);
getWeighings = async (page) => await page.$$eval(WEIGHINGS_SELECTOR, lis => lis.map(li => li.textContent));
checkForFakeBar = (weights, pairIdx) => {
  const regex = /[<>]/;
  const filteredWeights = weights.filter(str => regex.test(str));
  let fakeGold = undefined;
  if(filteredWeights.length == 0){
    if(pairIdx == 3){
      return 8;
    }
    return fakeGold;
  }
  else if(filteredWeights[0].includes(">")){
    fakeGold = pairIdx * 2 + 1;
  }
  else{
    fakeGold = pairIdx * 2 ;
  }
  return fakeGold;
}

(async () => {
  let numberOfWeighings = 0;

  // Open browser
  const browser = await puppeteer.launch({
    headless: false
  });
  // Create a new page
  const page = await browser.newPage();
  // Add a listener for alert dialogs
  page.on('dialog', async dialog => {
    // Print the message of the alert dialog
    console.log(dialog.message());
    // Dismiss the alert dialog
    await dialog.dismiss();
    await browser.close();
  });
  // Navigate to game
  await page.goto(WEBSITE_URL);
  
  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  for(let goldIndex = 0; goldIndex < 4; goldIndex++){
    // Keep adding gold symetrically until imbalance occurs
    await addGold(page, LEFT_SIDE, goldIndex * 2, goldIndex);
    await addGold(page, RIGHT_SIDE, goldIndex * 2 + 1, goldIndex);
    // Weigh scale
    await clickButton(page, WEIGH_BUTTON_SELECTOR);
    // Track number of weighings
    numberOfWeighings++;


    let weighings = await getWeighings(page);

    // Accomodate for lag by continuously fetching weighings 
    while(weighings.length != numberOfWeighings){
      weighings = await getWeighings(page);
    }

    const fakeGold = checkForFakeBar(weighings, goldIndex);

    if(fakeGold){
      clickCoin(page, fakeGold);
      console.log("Number of weighings: ", numberOfWeighings);
      console.log(weighings);
      break;
    }
  }
  
  
  
})();