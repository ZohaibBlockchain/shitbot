class Servant {
    constructor(name, speed, binanceClient, leverage, state, amountInUSDT,takeProfitPercentage,StopLossPercentage) {
        this.name = name;
        this.symbol = process.env.INSTRUMENT;
        this.speed = speed;
        this.totalProfit = 0;
        this.binance = binanceClient
        this.leverage = leverage;
        this.state = state;
        this.trade = false;
        this.tradeSide = undefined;
        this.lastSignalTime = 0;
        this.lastSignal = undefined;
        this.HelperSignal = undefined;
        this.TP = undefined;
        this.SL = undefined;
        this.takeProfitPercentage = takeProfitPercentage;
        this.stopLossPercentage = StopLossPercentage;
        this.amountInUSDT = amountInUSDT;
        this.tradeProgress = false;
        this.tradeQuantity = 0;
        this.maxPrecision = 3;
        this.totalTrades = 0;
        this.protiableTrades = 0;
        this.lostTrades = 0;
        this.tradeExists(); //First check
        this.setLeverage(); //Second check
        this.heart();
        this.counter = 0;
    }



    get getDetails() {
        return `Name: ${this.name}, Symbol: ${this.symbol}, Speed: ${(this.speed) / 1000}PS, TP: ${this.TP}, SL: ${this.SL}, LastSignal: ${this.lastSignal}, TradeQuantity: ${this.tradeQuantity}, Precision: ${this.maxPrecision}, TotalTrades: ${this.totalTrades}, Total Profitable Trades: ${this.protiableTrades}, Total Lost Trades: ${this.lostTrades}`;
    }

    async heart() {

        setTimeout(() => {
            this.heart();
        }, this.speed);

        if (this.state === 'init') {
            return;
        }
        else {
            const price = await this.getPrice();
            if (!this.trade)//create new trade
            {
                if (((Date.now() - this.lastSignalTime) / 1000) < 5) {
                    if (this.lastSignal === 'long' && this.HelperSignal === 'long' &&!this.tradeProgress) {
                        this.tradeProgress = true;
                        // this.maxPrecision = await this.getPrecisionForPair(this.symbol);

                        const quantity = (((this.amountInUSDT - 1) / price) * this.leverage).toFixed(this.maxPrecision);
                        const _trade = await this.binance.futuresMarketBuy(this.symbol, quantity);
                        console.log(_trade, ' ', this.symbol, quantity);
                        console.log(price);
                        if (_trade.origQty === (quantity).toString()) {
                            console.log('Trade Started');
                            this.tradeProgress = false;
                            this.trade = true;
                            this.tradeSide = 'long';
                            this.updateConditions(price, this.leverage, true, this.takeProfitPercentage, this.stopLossPercentage)
                            this.tradeQuantity = _trade.origQty;
                        }
                    } else if (this.lastSignal === 'short' && this.HelperSignal === 'short' && !this.tradeProgress) {
                        console.log(price);
                        this.tradeProgress = true;
                        const quantity = (((this.amountInUSDT - 1) / price) * this.leverage).toFixed(this.maxPrecision);
                        const _trade = await this.binance.futuresMarketSell(this.symbol, quantity);
                        if (_trade.origQty === (quantity).toString()) {
                            console.log('Trade Started');
                            this.tradeProgress = false;
                            this.trade = true;
                            this.tradeSide = 'short';
                            this.updateConditions(price, this.leverage, false, this.takeProfitPercentage, this.stopLossPercentage)
                            this.tradeQuantity = _trade.origQty;
                        }
                    }
                } else {
                    if(this.counter >= 10)
                    {
                        console.log('waiting for Signals')
                        console.log(this.getDetails);
                        this.counter = 0;
                    }else{
                        this.counter++;
                    }
                }
            } else {
               
                if(this.counter >= 10)
                {
                    console.log('waiting for Opportunity to make Profit')
                    console.log(this.getDetails);
                    this.counter = 0;
                }else{
                    this.counter++;
                }
                if (this.tradeSide === 'long') {
                    if (price >= this.TP && !this.tradeProgress) {
                        //close Trade
                        this.tradeProgress = true;
                        const _trade = await this.binance.futuresMarketSell(this.symbol, this.tradeQuantity);
                        if (_trade.origQty === (this.tradeQuantity).toString()) {
                            console.log(price);
                            console.log('Trade Closed in profit');
                            this.totalTrades++;
                            this.protiableTrades++;
                            this.tradeProgress = false;
                            this.trade = false;
                            this.tradeSide = undefined;
                            this.TP = undefined;
                            this.SL = undefined;
                            this.tradeQuantity = 0;
                        }

                    } else if (price <= this.SL && !this.tradeProgress) {
                        console.log(price);
                        this.tradeProgress = true;
                        const _trade = await this.binance.futuresMarketSell(this.symbol, this.tradeQuantity);
                        console.log(price);
                        if (_trade.origQty === (this.tradeQuantity).toString()) {
                            console.log('Trade Closed in Loss');
                            this.totalTrades++;
                            this.lostTrades++;
                            this.tradeProgress = false;
                            this.trade = false;
                            this.tradeSide = undefined;
                            this.TP = undefined;
                            this.SL = undefined;
                            this.tradeQuantity = 0;
                        }
                    }

                } else if (this.tradeSide === 'short') {

                    if (price <= this.TP && !this.tradeProgress) {
                        this.tradeProgress = true;
                        const _trade = await this.binance.futuresMarketBuy(this.symbol, this.tradeQuantity);
                        console.log(price);
                        if (_trade.origQty === (this.tradeQuantity).toString()) {
                            console.log('Trade Closed in profit');
                            this.totalTrades++;
                            this.protiableTrades++;
                            this.tradeProgress = false;
                            this.trade = false;
                            this.tradeSide = undefined;
                            this.TP = undefined;
                            this.SL = undefined;
                            this.tradeQuantity = 0;
                        }

                    } else if (price >= this.SL && !this.tradeProgress) {

                        this.tradeProgress = true;
                        const _trade = await this.binance.futuresMarketBuy(this.symbol, this.tradeQuantity);
                        console.log(price);
                        if (_trade.origQty === (this.tradeQuantity).toString()) {
                            console.log('Trade Closed in Loss');
                            this.totalTrades++;
                            this.lostTrades++;
                            this.tradeProgress = false;
                            this.trade = false;
                            this.tradeSide = undefined;
                            this.TP = undefined;
                            this.SL = undefined;
                            this.tradeQuantity = 0;
                        }
                    }
                }
            }
        }
    }


    getPrice() {
        return new Promise((resolve, reject) => {
            this.binance.prices(this.symbol, (error, ticker) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    // console.log("Price:", ticker[this.symbol]);
                    resolve(ticker[this.symbol]);
                }
            });
        });
    }

    async tradeExists() {
        try {
            let position_data = await this.binance.futuresPositionRisk(), markets = Object.keys(position_data);
            for (let market of markets) {
                let obj = position_data[market], size = Number(obj.positionAmt);
                if (size == 0) {
                } else {
                    this.state = 'Dead';
                    throw 'Trade Found remove all trades to start the bot'; // This will reject the promise with the caught error
                }
            }
        } catch (error) {
            console.error(error);
            throw error; // This will reject the promise with the caught error
        }
    }




    async setLeverage() {
        try {
            const res = await this.binance.futuresLeverage(this.symbol, this.leverage);
            console.log(res);

            if (res.leverage !== this.leverage) {
                this.state = 'Dead'
                throw '[0x02] Worker state is dead';
            } else {
                this.state = 'Trading'
                console.log('done');
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }


    async updateSignal(signal,helperSignal) {
        if(helperSignal === '0')
        {
            this.lastSignal = signal;
            this.lastSignalTime = Date.now();
        }else{
            this.HelperSignal = signal
        }
    }

    updateConditions(entryPrice, leverage, isLongPosition, takeProfitPercentage, stopLossPercentage) {
        let takeProfitPrice, stopLossPrice;

        // Adjust the percentages based on leverage
        let adjustedTakeProfitPercentage = takeProfitPercentage / leverage;
        let adjustedStopLossPercentage = stopLossPercentage / leverage;

        if (isLongPosition) {
            // For a long position
            takeProfitPrice = entryPrice * (1 + (adjustedTakeProfitPercentage / 100));
            stopLossPrice = entryPrice * (1 - (adjustedStopLossPercentage / 100));
        } else {
            // For a short position
            takeProfitPrice = entryPrice * (1 - (adjustedTakeProfitPercentage / 100));
            stopLossPrice = entryPrice * (1 + (adjustedStopLossPercentage / 100));
        }


        this.TP = takeProfitPrice.toFixed(2);
        this.SL = stopLossPrice.toFixed(2);
        console.log(`Take Profit Price: ${takeProfitPrice.toFixed(2)}`);
        console.log(`Stop Loss Price: ${stopLossPrice.toFixed(2)}`);
    }




    // Function to get precision for a specific trading pair
    async getPrecisionForPair(pair) {
        try {
            const exchangeInfo = await this.binance.futuresExchangeInfo();
            const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === pair);
            if (symbolInfo) {
                return symbolInfo.baseAssetPrecision;
            } else {
                throw new Error(`Trading pair ${pair} not found.`);
            }
        } catch (error) {
            console.error('Error fetching exchange info:', error);
            throw error;
        }
    }

}




export default Servant;