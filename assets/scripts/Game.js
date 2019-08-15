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
        chessPrefabA: {
            default: null,
            type: cc.Prefab
        },
        chessPrefabB: {
            default: null,
            type: cc.Prefab
        },
        nullSpriteFrameB: {
            default: null,
            type: cc.SpriteFrame
        },
        nullSpriteFrameA: {
            default: null,
            type: cc.SpriteFrame
        },
        redSpriteFrameB: {
            default: null,
            type: cc.SpriteFrame
        },
        redSpriteFrameA: {
            default: null,
            type: cc.SpriteFrame
        },
        blueSpriteFrameA: {
            default: null,
            type: cc.SpriteFrame
        },
        blueSpriteFrameB: {
            default: null,
            type: cc.SpriteFrame
        },
        touchChess: {  // 每一回合落下的棋子
            default: null,
            type: cc.Node,
            visible: false  // 属性窗口不显示
        },
        gameState: 'blue',
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
        this.curDR1 = cvs.designResolution;  // Canvas的设计分辨率
        var dr = this.curDR1;
        var s = cc.view.getFrameSize();  //在 native 平台下，它返回全屏视图下屏幕的尺寸
        var rw = s.width;
        var rh = s.height;
        var finalW = rw;
        var finalH = rh;

        console.log("---- cc.view.getFrameSize() ----");
        console.log("rw =", rw);
        console.log("rh =", rh);
        console.log("---- cvs.designResoluntion1 ----");
        console.log("w =", dr.width);
        console.log("h =", dr.height);

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
        this.curDR2 = cvs.designResolution;  // Canvas调整后的设计分辨率

        console.log("---- cvs.designResoluntion2 ----");
        console.log("w =", finalW);
        console.log("h =", finalH);
        //cvs.node.emit('resize');
    },

    // 求 chess 左方的落子点
    leftOf(chess0, x, y) {
        var tagNum = chess0.tagNum;
        if (tagNum == 352)
            return this.chessList[324];
        else if (tagNum == 109)
            return this.chessList[135];
        var chess;
        if (!x || !y) {
            var x = tagNum % this.maxX,
                y = Math.floor(tagNum / this.maxX);
        }
        if (chess0.tagType == 'A') {
            if (chess0.tagBorder == 1)
                chess = this.chessList[y * this.maxX - this.maxX + x - 2];
            else if (chess0.tagBorder == 2)
                chess = this.chessList[y * this.maxX + this.maxX + x];
        } else if (chess0.tagType == 'B') {
            if (chess0.tagBorder == 2)
                chess = this.chessList[y * this.maxX - this.maxX + x];
            else if (chess0.tagBorder == 3)
                chess = this.chessList[y * this.maxX + this.maxX + x - 2];
        }
        if (chess === undefined) chess = this.chessList[tagNum - 1];
        if (chess === 'midX') {  // chess 为顶端或低端角上的点
            return this.chessList[tagNum - 2];
        }
        return chess;
    },

    // 求 chess 右方的落子点
    rightOf(chess0, x, y) {
        var tagNum = chess0.tagNum;
        if (tagNum == 376)
            return this.chessList[350];
        else if (tagNum == 133)
            return this.chessList[161];
        var chess;
        if (!x || !y) {
            var x = tagNum % this.maxX,
                y = Math.floor(tagNum / this.maxX);
        }
        if (chess0.tagType == 'A') {
            if (chess0.tagBorder == 5)
                chess = this.chessList[y * this.maxX + this.maxX + x];
            else if (chess0.tagBorder == 6)
                chess = this.chessList[y * this.maxX - this.maxX + x + 2];
        } else if (chess0.tagType == 'B') {
            if (chess0.tagBorder == 4)
                chess = this.chessList[y * this.maxX + this.maxX + x + 2];
            else if (chess0.tagBorder == 5)
                chess = this.chessList[y * this.maxX - this.maxX + x];
        }
        if (chess === undefined) chess = this.chessList[tagNum + 1];
        if (chess === 'midX') {  // chess 为顶端或低端角上的点
            return this.chessList[tagNum + 2];
        } else return chess;
    },

    // 求 chess 上方或下方的落子点
    upDownOf(chess0, x, y) {
        var tagNum = chess0.tagNum;
        if (!x || !y) {
            var x = tagNum % this.maxX,
                y = Math.floor(tagNum / this.maxX);
        }
        if (tagNum == 324)
            return this.chessList[352];
        else if (tagNum == 135)
            return this.chessList[109];
        else if (tagNum == 350)
            return this.chessList[376];
        else if (tagNum == 161)
            return this.chessList[133];
        var chess;
        if (chess0.tagType == 'A') {
            if (chess0.tagBorder == 3)
                chess = this.chessList[y * this.maxX - this.maxX + x + 2];
            else if (chess0.tagBorder == 4)
                chess = this.chessList[y * this.maxX - this.maxX + x - 2];
            else chess = this.chessList[y * this.maxX - this.maxX + x];
        } else if (chess0.tagType == 'B') {
            if (chess0.tagBorder == 1)
                chess = this.chessList[y * this.maxX + this.maxX + x + 2];
            else if (chess0.tagBorder == 6)
                chess = this.chessList[y * this.maxX + this.maxX + x - 2];
            else chess = this.chessList[y * this.maxX + this.maxX + x];
        }
        return chess;
    },

    // 判断指定的chessList索引对应的落子点，是否处于棋盘内
    // putInList: 对于每个棋盘外的落子点，把 null 加入 chessList 数组
    // todo: 目前针对 size=13 的场景，将6个角上的点排除在外，4、13等数字都是固定的。需要增加通用的判断方法。
    isInBoard(x, y, putInList) {
        var ok = false;
        this.tagBorder = 0;
        if (y <= 4) {
            let leftX = 12 - 3 * y,
                rightX = 14 + 3 * y;
            if (x >= leftX && x <= rightX) {
                if (putInList === true) {
                    if (x == leftX || x == leftX + 1) this.tagBorder = 3;
                    else if (x == rightX || x == rightX - 1) this.tagBorder = 4;
                }
                ok = true;
            }
        }
        else if (y >= 13) {
            let leftX = 3 * y - 39,
                rightX = 65 - 3 * y;
            if (x >= leftX && x <= rightX) {
                if (putInList === true) {
                    if (x == leftX || x == leftX + 1) this.tagBorder = 1;
                    else if (x == rightX || x == rightX - 1) this.tagBorder = 6;
                }
                ok = true;
            }
        }
        else ok = true;
        // 将6个角上的点排除
        if ((y == 0 || y == 17) && x == 13) {
            if (putInList === true)
                this.chessList.push('midX');
            return false;
        }
        else if (x == 0 && (y == 13 || y == 4)) {
            if (putInList === true)
                this.chessList.push('leftX');
            return false;
        }
        else if (x == 26 && (y == 13 || y == 4)) {
            if (putInList === true)
                this.chessList.push('rightX');
            return false;
        }
        if (!ok && putInList === true) this.chessList.push(null);
        return ok;
    },

    // 判断是否可以落子
    canPutChess(color, chess) {
        if (arguments.length >= 2) {
            var self = chess;
        }
        else {
            var self = this.touchChess;
            if (self.tagColor != 'null')
                return false;
            this.listTagNum = new Array();
        }
        var tagNum = self.tagNum,
            tagColor = self.tagColor,
            list = this.listTagNum;
        // 当 self 没有归入 list
        if (list.indexOf(tagNum) == -1) {
            // 当 self 的颜色不同于当前执行判断的颜色
            if (tagColor != color && arguments.length >= 2) {
                if (tagColor == 'null')
                    return true;
                else return false;
            }
            var x = tagNum % this.maxX,
                y = Math.floor(tagNum / this.maxX),
                b1 = true, b2 = true, b3 = true;
            // 将 self 归入 list
            list.push(tagNum);
            // 判断三个方向
            b1 = this.canPutChess(color, this.upDownOf(self, x, y));
            b2 = this.canPutChess(color, this.leftOf(self, x, y));
            b3 = this.canPutChess(color, this.rightOf(self, x, y));
            if (!b1 && !b2 && !b3)
                return false;
            else return true;
        }
        else return false;
    },

    // 判断 chess 及其周围同色棋子的死活。tiZou 表示死子是否提走。
    judgeDead(chess, color, tiZou) {
        if (chess.tagColor != color) {
            if (chess.tagColor == 'null')
                return true;
            else{
                this.jie.tag -= 2;  // 劫的标记-2
                return false;
            }
        }
        this.listTagNum = new Array();
        var isAlive = this.canPutChess(color, chess);
        if (!isAlive && tiZou) {
            // 提死子 this.listTagNum
            console.log('dead list: ', this.listTagNum);
            let len = this.listTagNum.length;
            if (len > 0) {
                for (var i = 0; i < len; i++) {
                    let chess = this.chessList[this.listTagNum[i]];
                    if (chess.tagType == 'A') {
                        chess.getComponent(cc.Sprite).spriteFrame = this.nullSpriteFrameA;
                    }
                    else {
                        chess.getComponent(cc.Sprite).spriteFrame = this.nullSpriteFrameB;
                    }
                    chess.tagColor = 'null';
                }
                if (len == 1) {
                    this.jie.tag += 1;  // 劫的标记+1
                    this.jie[color] = this.listTagNum[0];
                }
            }
        }
        return !isAlive;
    },

    // 点击某落子点 的回调函数
    onTouchChess(event) {
        var self = event.currentTarget;
        if (self.tagColor != 'null')
            return;
        // 考察是否为劫点
        if(self.tagNum == this.jie[this.gameState])
            return;
        // 考察周围是否可以提子（直接提走）
        var fanState = this.fanState();
        self.tagColor = this.gameState;
        var b1 = this.judgeDead(this.upDownOf(self), fanState, true),
            b2 = this.judgeDead(this.leftOf(self), fanState, true),
            b3 = this.judgeDead(this.rightOf(self), fanState, true);
        if (b1 || b2 || b3) {
            // 如果提掉了对手的不止一个劫点，该劫点就不成立
            if (this.jie.tag != 1)
                this.jie[fanState] = null;
            // 清零劫点标记
            this.jie.tag = 0;
            this.putChess(self);
        } else {
            this.touchChess = self;
            self.tagColor = 'null';
            if (this.canPutChess(this.gameState))
                this.putChess(self);
        }
    },

    // 落子
    putChess(self) {
        self.tagColor = this.gameState;
        // case: B型落子
        if (self.tagType == 'B') {
            if (this.gameState == 'red') {
                self.getComponent(cc.Sprite).spriteFrame = this.redSpriteFrameB;
            } else {
                self.getComponent(cc.Sprite).spriteFrame = this.blueSpriteFrameB;
            }
        }
        // case: A型落子
        else if (self.tagType == 'A') {
            if (this.gameState == 'red') {
                self.getComponent(cc.Sprite).spriteFrame = this.redSpriteFrameA;
            } else {
                self.getComponent(cc.Sprite).spriteFrame = this.blueSpriteFrameA;
            }
        }
        // 劫点清除
        this.jie[this.gameState] = null;
        // 切换颜色
        this.gameState = this.fanState();
    },

    fanState() {
        if (this.gameState == 'red')
            return 'blue';
        else
            return 'red';
    },

    // 根据落子点在chessList中的索引值，计算落子点的物理坐标
    ccV2ById(x, y) {
        var w = this.w,
            cx = this.curDR2.width / 2,
            cy = this.curDR2.height / 2,
            xx = Math.sqrt(3) / 2 * w * x - cx + this.dBorderX,
            yy = 1.5 * w * y - cy + this.dBorderY;
        return cc.v2(xx, yy);
    },

    onLoad() {
        this.chessList = new Array();
        this.size = 13; // 棋盘边长与小六边形边长的比值
        this.maxY = 18; // 行数
        this.maxX = 27; // 列数
        this.overSprite.node.x = 10000; // 让结束画面位于屏幕外
        this.jie = {  // 记录劫点
            red: null,
            blue: null,
            tag: 0
        };
        this.resize();
        var self = this;
        var boardZhanBi = 10 / 11; // 棋盘宽度占画面宽度的比例
        var w1 = this.curDR2.width * boardZhanBi / Math.sqrt(3),
            w2 = this.curDR2.height * boardZhanBi * 0.5;
        if (w1 > w2) {
            this.w = w2 / this.size;
            this.dBorderX = this.curDR1.width * 0.5 - 0.5 * Math.sqrt(3) * w2;
            this.dBorderY = this.curDR1.height * 0.5 - 0.75 * w2
        } else {
            this.dBorderX = this.curDR1.width * 0.5 - 0.5 * Math.sqrt(3) * w1;
            this.dBorderY = this.curDR1.height * 0.5 - 0.75 * w1
            this.w = w1 / this.size;
        }
        var scaleNode = this.w / 200;

        // 初始化棋盘上的点，并为每个节点添加事件
        for (var y = 0; y < this.maxY; y++) {
            for (var x = 0; x < this.maxX; x++) {
                if (this.isInBoard(x, y, true)) {
                    // 添加落子点（cc_Node类型）
                    var newNode;
                    if ((x + y) % 2 == 0) {
                        newNode = cc.instantiate(this.chessPrefabB);
                        newNode.tagType = 'B';
                    } else {
                        newNode = cc.instantiate(this.chessPrefabA);
                        newNode.tagType = 'A';
                    }
                    newNode.setScale(scaleNode);  // 缩放到合适大小
                    this.node.addChild(newNode);
                    this.chessList.push(newNode);
                    newNode.setPosition(this.ccV2ById(x, y));  // 使每个节点位于指定位置
                    newNode.tagNum = this.maxX * y + x;
                    newNode.tagColor = 'null';
                    // 添加边界标签。  1-6：从左上的边开始，逆时针排列。 其他暂时设置为0
                    newNode.tagBorder = this.tagBorder;
                    if (x == 0) newNode.tagBorder = 2;
                    else if (x == this.maxX - 1) newNode.tagBorder = 5;
                    // 添加点击事件
                    newNode.on(cc.Node.EventType.TOUCH_END, function (event) {
                        self.onTouchChess(event);
                    });
                }
            }
        }
        this.gameState = 'blue';
    },

    judgeOver() {
        var x0 = this.touchChess.tagNum % this.maxX;
        var y0 = parseInt(this.touchChess.tagNum / this.maxX);
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
