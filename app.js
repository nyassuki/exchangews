const binance = require('./exchange/binance.js');
const bybit = require('./exchange/bybit.js');
const okx = require('./exchange/okx.js');
require('dotenv').config();

const wss = require('./ws.js');
const wsServer = wss.createWebSocketServer(9909);

 async function startWSS(symbols) {
    try {
        // Remove hyphens for Binance and Bybit (they use BTCUSDT format)
        const symbolNoHyphen = symbols.map(symbol => symbol.replace('-', ''));
        // Initialize exchange data streams
        const binanceData = new binance.BinanceMultiPairData(symbolNoHyphen);
        const bybitData = new bybit.BybitMultiPairData(symbolNoHyphen);
        const okxData = new okx.OKXMultiPairData(symbols, "FUTURES"); // OKX uses BTC-USDT format
        okxData.on('market', data => {
			//console.log(data);
			sendMarketData("OKX","market",data);
		});

		okxData.on('orderbook', data => {
			const bdata = data.bids;
		 	if(bdata.length >= 10) {
		 		sendMarketData("OKX","orderbook",data);
		 	}
 		});

		okxData.on('spread', data => {
		  	//console.log('Spread update:', data);
		  	sendMarketData("OKX","spread",data); 
		});

		okxData.on('candle', data => {
		  	//console.log(data);
		  	sendMarketData("OKX","candle",data); 
		});
		okxData.connect();

		//Single event handlers for all pairs
		bybitData.on('market', data => {
		  //console.log(data);
		  sendMarketData("BYBIT","market",data); 
		});

		bybitData.on('orderbook', data => {
		  //console.log(data);
		  sendMarketData("BYBIT","orderbook",data); 
		});

		bybitData.on('spread', data => {
		  //console.log(data);
		  sendMarketData("BYBIT","spread",data); 
		});

		bybitData.on('candle', data => {
		  //console.log(data);
		  sendMarketData("BYBIT","candle",data); 
		});
		bybitData.connect();
		binanceData.on('market', data => {
		  	//console.log(data);
		  	sendMarketData("BINANCE","market",data); 
		});

		binanceData.on('orderbook', data => {
		  	//console.log( data);
		  	sendMarketData("BINANCE","orderbook",data); 
		});

		binanceData.on('spread', data => {
		  	//console.log(data);
		  	sendMarketData("BINANCE","spread",data); 
		});

		binanceData.on('candle', data => {
		  //console.log(data);
		  sendMarketData("BINANCE","candle",data); 
		});
		binanceData.connect();
    } catch (error) {
        console.error('❌ Error initializing WebSocket streams:', error);
        throw error;
    }
}
function sendMarketData(exchange,type,data) {
  try {
    websocketServer.broadcastMessage({
      data_type:'exchange_data',
      exchange:exchange,
      type: type,
      data: data,
      timestamp: Date.now()
    });
    
    //console.log(`Broadcasted to ${wsServer.getClientCount()} clients`);
  } catch (error) {
    console.error('❌ Failed to broadcast message:', error);
  }
}
(async () => {
    try {
      	const symbols = [
		  'BTC-USDT',
		  'ETH-USDT',
		  'XRP-USDT',
		  'SOL-USDT',
		  'ADA-USDT',
		  'DOT-USDT',
		  'DOGE-USDT'
		];
        const firstMarketData = await startWSS(symbols);
    } catch (error) {
        console.error('❌ Failed to start WebSocket streams:', error);
    }
})();
