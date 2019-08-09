cc.Class({
    extends: cc.Component,

    properties: {

        overSprite: {
            default: null,
            type: cc.Sprite,
        },

        overLabel: {
            default: null,
            type: cc.Label
        },

        chessPrefab: {//棋子的预制资源
            default: null,
            type: cc.Prefab
        },

        whiteSpriteFrame: {//白棋的图片
            default: null,
            type: cc.SpriteFrame
        },

        blackSpriteFrame: {//黑棋的图片
            default: null,
            type: cc.SpriteFrame
        },

        touchChess: {//每一回合落下的棋子
            default: null,
            type: cc.Node,
            visible: false//属性窗口不显示
        },

        gameState: 'white',

        fiveGroupScore: []//五元组分数
    },
    // 重新开始
    startGame() {
        cc.director.loadScene("Game");
    },
    // 返回菜单
    toMenu() {
        cc.director.loadScene("Menu");
    },

    // 调整画面宽高
    resize() {
        var cvs = cc.find('Canvas').getComponent(cc.Canvas);
        this.canvasNode = cvs.node;
        this.curDR = cvs.designResolution;  // Canvas的设计分辨率
        var dr = this.curDR;
        var s = cc.view.getFrameSize();  //在 native 平台下，它返回全屏视图下屏幕的尺寸
        var rw = s.width;
        var rh = s.height;
        var finalW = rw;
        var finalH = rh;

        console.log("---- cc.view.getFrameSize() ----");
        console.log("rw =", rw);
        console.log("rh =", rh);
        console.log("---- cvs.designResoluntion ----");
        console.log("dr.w =", dr.width);
        console.log("dr.h =", dr.height);

        if ((rw / rh) > (dr.width / dr.height)) {
            // 如果更长，则用定高
            finalH = dr.height;
            finalW = finalH * rw / rh;
        }
        else {
            // 如果更短，则用定宽
            finalW = dr.width;
            finalH = rh / rw * finalW;
        }
        cvs.designResolution = cc.size(finalW, finalH);
        cvs.node.width = finalW;
        cvs.node.height = finalH;
        //cvs.node.emit('resize');
    },

    // 点击某落子点 的回调函数
    onTouchChess(event) {
        var self = event.currentTarget;
        this.touchChess = self;
        if (this.gameState == 'black' && self.getComponent(cc.Sprite).spriteFrame == null) {
            self.getComponent(cc.Sprite).spriteFrame = this.blackSpriteFrame;//下子后添加棋子图片使棋子显示
            this.judgeOver();
            if (this.gameState == 'white') {
                this.scheduleOnce(function () { this.ai() }, 1);//延迟一秒电脑下棋
            }
        }
    },

    onLoad() {
        this.chessList = new Array();
        this.size = 13; // 棋盘边长与小六边形边长的比值
        this.maxY = 18; // 行数
        this.maxX = 27; // 列数
        this.overSprite.node.x = 10000; // 让结束画面位于屏幕外
        this.resize();
        var self = this;
        var boardZhanBi = 10 / 11; // 棋盘宽度占画面宽度的比例
        var w1 = this.canvasNode.width * boardZhanBi / (Math.sqrt(3) * size),
            w2 = this.canvasNode.height * boardZhanBi / (1.5 * size);
        this.w = w1 > w2 ? w2 : w1; // 小六边形的边长

        // 初始化棋盘上225个棋子节点，并为每个节点添加事件
        for (var y = 0; y < this.maxY; y++) {
            for (var x = 0; x < this.maxX; x++) {
                // 添加Chess（cc_Node类型）
                var newNode = cc.instantiate(this.chessPrefab);
                this.node.addChild(newNode);
                this.chessList[y].push(newNode);
                // 根据棋盘和棋子大小计算使每个棋子节点位于指定位置
                newNode.setPosition(cc.v2());
                // 添加点击事件
                let ok = false;
                if (y < 4) { if (x >= 12 - 3 * y && x <= 14 + 3 * y) ok = true; }
                else if (y > 13) { if (x >= 3 * y - 39 && x <= 65 - 3 * y) ok = true; }
                else ok = true;
                if (ok)
                    newNode.on(cc.Node.EventType.TOUCH_END, function (event) {
                        self.onTouchChess(event);
                    });
            }
        }

        // 开局白棋（电脑）在棋盘中央下一子
        this.chessList[112].getComponent(cc.Sprite).spriteFrame = this.whiteSpriteFrame;
        this.gameState = 'black';
    },

    // 电脑下棋逻辑
    ai: function () {
        //评分
        for (var i = 0; i < this.fiveGroup.length; i++) {
            var b = 0;//五元组里黑棋的个数
            var w = 0;//五元组里白棋的个数
            for (var j = 0; j < 5; j++) {
                this.getComponent(cc.Sprite).spriteFrame
                if (this.chessList[this.fiveGroup[i][j]].getComponent(cc.Sprite).spriteFrame == this.blackSpriteFrame) {
                    b++;
                } else if (this.chessList[this.fiveGroup[i][j]].getComponent(cc.Sprite).spriteFrame == this.whiteSpriteFrame) {
                    w++;
                }
            }
            if (b + w == 0) {
                this.fiveGroupScore[i] = 7;
            } else if (b > 0 && w > 0) {
                this.fiveGroupScore[i] = 0;
            } else if (b == 0 && w == 1) {
                this.fiveGroupScore[i] = 35;
            } else if (b == 0 && w == 2) {
                this.fiveGroupScore[i] = 800;
            } else if (b == 0 && w == 3) {
                this.fiveGroupScore[i] = 15000;
            } else if (b == 0 && w == 4) {
                this.fiveGroupScore[i] = 800000;
            } else if (w == 0 && b == 1) {
                this.fiveGroupScore[i] = 15;
            } else if (w == 0 && b == 2) {
                this.fiveGroupScore[i] = 400;
            } else if (w == 0 && b == 3) {
                this.fiveGroupScore[i] = 1800;
            } else if (w == 0 && b == 4) {
                this.fiveGroupScore[i] = 100000;
            }
        }
        //找最高分的五元组
        var hScore = 0;
        var mPosition = 0;
        for (var i = 0; i < this.fiveGroupScore.length; i++) {
            if (this.fiveGroupScore[i] > hScore) {
                hScore = this.fiveGroupScore[i];
                mPosition = (function (x) {//js闭包
                    return x;
                })(i);
            }
        }
        //在最高分的五元组里找到最优下子位置
        var flag1 = false;//无子
        var flag2 = false;//有子
        var nPosition = 0;
        for (var i = 0; i < 5; i++) {
            if (!flag1 && this.chessList[this.fiveGroup[mPosition][i]].getComponent(cc.Sprite).spriteFrame == null) {
                nPosition = (function (x) { return x })(i);
            }
            if (!flag2 && this.chessList[this.fiveGroup[mPosition][i]].getComponent(cc.Sprite).spriteFrame != null) {
                flag1 = true;
                flag2 = true;
            }
            if (flag2 && this.chessList[this.fiveGroup[mPosition][i]].getComponent(cc.Sprite).spriteFrame == null) {
                nPosition = (function (x) { return x })(i);
                break;
            }
        }
        //在最最优位置下子
        this.chessList[this.fiveGroup[mPosition][nPosition]].getComponent(cc.Sprite).spriteFrame = this.whiteSpriteFrame;
        this.touchChess = this.chessList[this.fiveGroup[mPosition][nPosition]];
        this.judgeOver();
    },

    judgeOver: function () {
        var x0 = this.touchChess.tagNum % 15;
        var y0 = parseInt(this.touchChess.tagNum / 15);
        //判断横向
        var fiveCount = 0;
        for (var x = 0; x < 15; x++) {
            if ((this.chessList[y0 * 15 + x].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                fiveCount++;
                if (fiveCount == 5) {
                    if (this.gameState === 'black') {
                        this.overLabel.string = "你赢了";
                        this.overSprite.node.x = 0;
                    } else {
                        this.overLabel.string = "你输了";
                        this.overSprite.node.x = 0;
                    }
                    this.gameState = 'over';
                    return;
                }
            } else {
                fiveCount = 0;
            }
        }
        //判断纵向
        fiveCount = 0;
        for (var y = 0; y < 15; y++) {
            if ((this.chessList[y * 15 + x0].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                fiveCount++;
                if (fiveCount == 5) {
                    if (this.gameState === 'black') {
                        this.overLabel.string = "你赢了";
                        this.overSprite.node.x = 0;
                    } else {
                        this.overLabel.string = "你输了";
                        this.overSprite.node.x = 0;
                    }
                    this.gameState = 'over';
                    return;
                }
            } else {
                fiveCount = 0;
            }
        }
        //判断右上斜向
        var f = y0 - x0;
        fiveCount = 0;
        for (var x = 0; x < 15; x++) {
            if (f + x < 0 || f + x > 14) {
                continue;
            }
            if ((this.chessList[(f + x) * 15 + x].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                fiveCount++;
                if (fiveCount == 5) {
                    if (this.gameState === 'black') {
                        this.overLabel.string = "你赢了";
                        this.overSprite.node.x = 0;
                    } else {
                        this.overLabel.string = "你输了";
                        this.overSprite.node.x = 0;
                    }
                    this.gameState = 'over';
                    return;
                }
            } else {
                fiveCount = 0;
            }
        }
        //判断右下斜向
        f = y0 + x0;
        fiveCount = 0;
        for (var x = 0; x < 15; x++) {
            if (f - x < 0 || f - x > 14) {
                continue;
            }
            if ((this.chessList[(f - x) * 15 + x].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                fiveCount++;
                if (fiveCount == 5) {
                    if (this.gameState === 'black') {
                        this.overLabel.string = "你赢了";
                        this.overSprite.node.x = 0;
                    } else {
                        this.overLabel.string = "你输了";
                        this.overSprite.node.x = 0;
                    }
                    this.gameState = 'over';
                    return;
                }
            } else {
                fiveCount = 0;
            }
        }
        //没有输赢交换下子顺序
        if (this.gameState === 'black') {
            this.gameState = 'white';
        } else {
            this.gameState = 'black';
        }
    }

});
