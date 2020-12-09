
const puppeteer = require('puppeteer');
const winston = require('winston');
const { format, createLogger, transports } = require('winston');
var AWS = require('aws-sdk');

// Set region
AWS.config.update({ region: 'us-east-1' });

const logger = winston.createLogger({
  format: format.combine(
    format.label({ label: '[my-label]' }),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    //
    // The simple format outputs
    // `${level}: ${message} ${[Object with everything else]}`
    //
    // format.simple()
    //
    // Alternatively you could use this custom printf format if you
    // want to control where the timestamp comes in your final message.
    // Try replacing `format.simple()` above with this:
    //
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  defaultMeta: { service: 'nano-speedy' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.File({ filename: '/Users/code4days/Documents/logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/Users/code4days/Documents/logs/combined.log' }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
logger.info("starting application.");
(async () => {
  logger.info("Searching US website");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');
  const url = 'https://us.louisvuitton.com/eng-us/products/nano-speedy-monogram-010575';
  // const url = 'https://us.louisvuitton.com/eng-us/products/trunk-clutch-epi-nvprod1040054v#M53052'
  logger.info("urls: " + url);
  await page.goto(url, { waitUntil: 'networkidle2' });
  // await page.screenshot({path: 'example.png'});
  const found = await page.evaluate(() => window.find("In stock"));
  logger.info("in stock: " + found);
  await browser.close();
  // if found is true... reach out to sns topic and send text message.
  if (found) {
    logger.info("The bag is available");
    // Create publish parameters
    var params = {
      Message: 'Nano Speedy now available on US website!!!', /* required */
      TopicArn: 'arn:aws:sns:us-east-1:233567662909:LV-Availability-Topic'
    };
    logger.info("Params for SNS created.");
    var publishTextPromise = new AWS.SNS().publish(params).promise();

    // Handle promise's fulfilled/rejected states
    publishTextPromise.then(
      function (data) {
        logger.info(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
        logger.info("MessageID is " + data.MessageId);
      }).catch(
        function (err) {
          logger.error(err, err.stack);
        });
  }
  
})();
(async () => {
  logger.info("Searching UK website");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36');
  // const url = 'https://uk.louisvuitton.com/eng-gb/products/nano-speedy-monogram-010575';
  const url = 'https://uk.louisvuitton.com/eng-gb/products/trunk-clutch-epi-nvprod1040054v#M53052'
  logger.info("url: " + url);
  await page.goto(url, { waitUntil: 'networkidle2' });
  // await page.screenshot({path: 'example.png'});
  const found = await page.evaluate(() => window.find("Available"));
  logger.info("Available: " + found);
  await browser.close();
  // if found is true... reach out to sns topic and send text message.
  if (found) {
    logger.info("The bag is available");
    // Create publish parameters
    var params = {
      Message: 'Nano Speedy now available on UK website!!!', /* required */
      TopicArn: 'arn:aws:sns:us-east-1:233567662909:LV-Availability-Topic'
    };
    logger.info("Params for SNS created.");
    var publishTextPromise = new AWS.SNS().publish(params).promise();

    // Handle promise's fulfilled/rejected states
    publishTextPromise.then(
      function (data) {
        logger.info(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
        logger.info("MessageID is " + data.MessageId);
      }).catch(
        function (err) {
          logger.error(err, err.stack);
        });
  }
  
})();
logger.info('application ended');