var bitcoin = require('bitcoinjs-lib-zcash');
var util = require('./util.js');

// public members
var txHash;

exports.txHash = function(){
  return txHash;
};

function scriptCompile(addrHash){
    script = bitcoin.script.compile(
        [
            bitcoin.opcodes.OP_DUP,
            bitcoin.opcodes.OP_HASH160,
            addrHash,
            bitcoin.opcodes.OP_EQUALVERIFY,
            bitcoin.opcodes.OP_CHECKSIG
        ]);
    return script;
}

function scriptFoundersCompile(address){
    script = bitcoin.script.compile(
        [
            bitcoin.opcodes.OP_HASH160,
            address,
            bitcoin.opcodes.OP_EQUAL
        ]);
    return script;
}


exports.createGeneration = function(rpcData, blockReward, feeReward, recipients, poolAddress){
    var poolAddrHash = bitcoin.address.fromBase58Check(poolAddress).hash;
    var tx = new bitcoin.Transaction();
    var blockHeight = rpcData.height;
    // input for coinbase tx
    var cbHeightBuff = bitcoin.script.number.encode(blockHeight);
    var serializedBlockHeight = new Buffer.concat([
        Buffer.from([cbHeightBuff.length]),
        cbHeightBuff,
        new Buffer('00', 'hex') // OP_0
    ]);

    tx.addInput(new Buffer('0000000000000000000000000000000000000000000000000000000000000000', 'hex'),
        4294967295,
        4294967295,
        new Buffer.concat([serializedBlockHeight,
            Buffer('5a2d4e4f4d50212068747470733a2f2f6769746875622e636f6d2f6a6f7368756179616275742f7a2d6e6f6d70', 'hex')])
    );

    // calculate total fees
    var feePercent = 0;
    for (var i = 0; i < recipients.length; i++) {
        feePercent = feePercent + recipients[i].percent;
    }
    
    tx.addOutput(
                 scriptCompile(poolAddrHash),
                 Math.floor(blockReward * (1 - (feePercent / 100)))
                 );
    for (var i = 0; i < recipients.length; i++) {
       tx.addOutput(
           scriptCompile(bitcoin.address.fromBase58Check(recipients[i].address).hash),
           Math.round(blockReward * (recipients[i].percent / 100))
       );
    }

    if (rpcData.default_witness_commitment !== undefined) {
        tx.addOutput(new Buffer(rpcData.default_witness_commitment, 'hex'), 0);
    }

    txHex = tx.toHex();

    // assign
    txHash = tx.getHash().toString('hex');

    /*
    console.log('txHex: ' + txHex.toString('hex'));
    console.log('txHash: ' + txHash);
    */

    return txHex;
};

module.exports.getFees = function(feeArray){
    var fee = Number();
    feeArray.forEach(function(value) {
        fee = fee + Number(value.fee);
    });
    return fee;
};
    ])
