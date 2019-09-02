window.Global = {
    timePerState: 60
};

cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    startGame(event, time) {
        Global.timePerState = time;
        cc.director.loadScene("game");
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    // start () {},

    // update (dt) {},
});
