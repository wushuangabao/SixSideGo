cc.Class({
    extends: cc.Component,

    properties: {
        overLabel: {
            default: null,
            type: cc.Label
        },
        lastChessTag: {
            default: null,
            type: cc.Node
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
        UI1: {
            default: null,
            type: cc.Node
        },
        danji: {
            default: true,
            displayName: "是否单机"
        },
        audioButton: {
            type: cc.AudioSource,
            default: null
        },
        audioChessDown: {
            type: cc.AudioSource,
            default: null
        },
        audioChessDead: {
            type: cc.AudioSource,
            default: null
        },
        audioGameOver: {
            type: cc.AudioSource,
            default: null
        },
        dBorderX: {
            default: 30
        },
        dBorderY: {
            default: 10
        },
        w: {
            default: 30,
            displayName: "小六边形的边长"
        }
    },

    // 初始化游戏参数
    initializeParams() {
        this.strOver = '';
        this.seconds = 0;
        this.size = 13; // 棋盘边长与小六边形边长的比值
        this.maxY = 18; // 行数
        this.maxX = 27; // 列数
        this.overLabel.string = '';
        this.labelDaoJiShi.string = '' + this.daojishi;
        this.UiDaoJiShi.color = new cc.Color(0, 125, 255);
        this.jie = {  // 记录劫点
            red: null,
            blue: null,
            tag: 0
        };
        this.ting = {  // 记录停一手
            red: false,
            blue: false
        };
        this.gameState = 'blue';
        this.recordList = []; // 行棋记录
        this.recordDead = []; // 提子记录
        this.recordJie = [];  // 劫点记录
    },

    // 根据窗口大小更新 Canvas 设计分辨率
    updateCanvasResolution() {
        var cvs = cc.find('Canvas').getComponent(cc.Canvas);
        this.curDR = cc.view.getFrameSize();  // 在 native 平台下，它返回全屏视图下屏幕的尺寸
        var s = this.curDR;
        var rw = s.width, rh = s.height;
        var finalW, finalH;
        console.log("view size: ", rw, rh);

        // console.log("---- cc.view.getFrameSize() ----");
        // console.log("rw =", rw);
        // console.log("rh =", rh);

        if ((rw / rh) > 0.25 * Math.sqrt(3)) {
            // 如果更长，则用定高
            finalH = s.height;
            finalW = finalH * rw / rh;
            this.w0 = finalH;
        }
        else {
            // 如果更短，则用定宽
            finalW = s.width;
            finalH = rh / rw * finalW;
            this.w0 = finalW;
        }
        console.log("w0 = ", this.w0);
        cvs.designResolution = cc.size(finalW, finalH);
        this.curDR = cvs.designResolution;  // Canvas调整后的设计分辨率

        // console.log("---- cvs.designResoluntion2 ----");
        // console.log("w =", finalW);
        // console.log("h =", finalH);
        // //cvs.node.emit('resize');
    },

    // 记录自适应布局需要的初始尺寸
    cacheResponsiveMetrics() {
        this.boardBaseSize = this.node.getContentSize();
        this.ui1BaseBounds = this.getChildrenBounds(this.UI1);
        this.ui2BaseBounds = this.getChildrenBounds(this.UI2);
    },

    // 整理 UI1 内部按钮与计时器的相对位置
    arrangeUI1Panel() {
        let actionButtons = [
            this.btnTingYiShou,
            this.btnRenShu,
            this.btnHuiQi
        ].filter(function (node) {
            return !!node;
        });
        let centerX = 0;
        let timerTop = 0;
        let buttonGap = 18;
        let stackGap = 26;
        if (this.UiDaoJiShi) {
            this.UiDaoJiShi.setPosition(centerX, 0);
            let timerSize = this.UiDaoJiShi.getContentSize();
            timerTop = this.UiDaoJiShi.y - timerSize.height * this.UiDaoJiShi.anchorY;
        }
        let currentTop = timerTop - stackGap;
        for (let i = 0; i < actionButtons.length; ++i) {
            let button = actionButtons[i];
            let size = button.getContentSize();
            let y = currentTop - size.height * (1 - button.anchorY);
            button.setPosition(centerX, y);
            currentTop = y - size.height * button.anchorY - buttonGap;
        }
    },

    // 整理 UI2 内部提示文本与重新开始按钮的相对位置
    arrangeUI2Panel() {
        if (!this.UI2 || !this.restartButton || !this.overLabel) {
            return;
        }
        let centerX = 0;
        let infoNode = this.overLabel.node;
        let infoGap = 22;
        infoNode.setPosition(centerX, 0);
        let infoSize = infoNode.getContentSize();
        let restartSize = this.restartButton.getContentSize();
        let y = infoNode.y - infoSize.height * infoNode.anchorY - infoGap - restartSize.height * (1 - this.restartButton.anchorY);
        this.restartButton.setPosition(centerX, y);
    },

    // 计算一个节点直属子节点形成的包围盒
    getChildrenBounds(node) {
        let hasChild = false;
        let left = 0, right = 0, top = 0, bottom = 0;
        for (let i = 0; i < node.childrenCount; ++i) {
            let child = node.children[i];
            if (!child.active) {
                continue;
            }
            let size = child.getContentSize();
            let childLeft = child.x - size.width * child.anchorX;
            let childRight = child.x + size.width * (1 - child.anchorX);
            let childBottom = child.y - size.height * child.anchorY;
            let childTop = child.y + size.height * (1 - child.anchorY);
            if (!hasChild) {
                left = childLeft;
                right = childRight;
                bottom = childBottom;
                top = childTop;
                hasChild = true;
            } else {
                left = Math.min(left, childLeft);
                right = Math.max(right, childRight);
                bottom = Math.min(bottom, childBottom);
                top = Math.max(top, childTop);
            }
        }
        if (!hasChild) {
            let size = node.getContentSize();
            left = -size.width * node.anchorX;
            right = size.width * (1 - node.anchorX);
            bottom = -size.height * node.anchorY;
            top = size.height * (1 - node.anchorY);
        }
        return {
            left: left,
            right: right,
            bottom: bottom,
            top: top,
            width: right - left,
            height: top - bottom
        };
    },

    // 计算 UI 组缩放后可用的宽高
    getScaledSize(bounds, scale) {
        return {
            width: bounds.width * scale,
            height: bounds.height * scale
        };
    },

    // 计算右侧栏布局
    calculateSideLayout(canvasSize, margin, gap) {
        let columnBaseWidth = Math.max(this.ui1BaseBounds.width, this.ui2BaseBounds.width);
        let uiScale = Math.min(
            1,
            (canvasSize.height - margin * 2 - 16) / (this.ui1BaseBounds.height + this.ui2BaseBounds.height),
            (canvasSize.width * 0.32) / columnBaseWidth
        );
        if (uiScale <= 0) {
            return null;
        }
        let ui1Size = this.getScaledSize(this.ui1BaseBounds, uiScale);
        let ui2Size = this.getScaledSize(this.ui2BaseBounds, uiScale);
        let panelGap = Math.max(12, margin * 0.6);
        let columnWidth = Math.max(ui1Size.width, ui2Size.width);
        let sideInnerPadding = Math.max(12, margin);
        let sideAreaWidth = Math.max(columnWidth + sideInnerPadding * 2, canvasSize.width * 0.36);
        let boardWidth = canvasSize.width - margin * 2 - gap - sideAreaWidth;
        let boardHeight = canvasSize.height - margin * 2;
        if (boardWidth <= 0 || boardHeight <= 0) {
            return null;
        }
        let boardScale = Math.min(
            boardWidth / this.boardBaseSize.width,
            boardHeight / this.boardBaseSize.height
        );
        if (boardScale <= 0) {
            return null;
        }
        let boardLeft = -canvasSize.width * 0.5 + margin;
        let boardRight = boardLeft + boardWidth;
        let panelLeft = boardRight + gap;
        let panelRight = panelLeft + sideAreaWidth;
        let panelCenterX = (panelLeft + panelRight) * 0.5;
        return {
            boardScale: boardScale,
            uiScale: uiScale,
            ui2Scale: uiScale,
            boardPos: cc.v2(
                boardLeft + boardWidth * 0.5,
                0
            ),
            ui1Pos: cc.v2(
                panelCenterX,
                canvasSize.height * 0.5 - margin - this.ui1BaseBounds.top * uiScale
            ),
            ui2Pos: cc.v2(
                panelCenterX,
                canvasSize.height * 0.5 - margin - ui1Size.height - panelGap - this.ui2BaseBounds.top * uiScale
            )
        };
    },

    // 计算顶部布局
    calculateTopLayout(canvasSize, margin, gap) {
        let columnBaseWidth = Math.max(this.ui1BaseBounds.width, this.ui2BaseBounds.width);
        let panelGap = Math.max(12, margin * 0.6);
        let uiScale = Math.min(
            1,
            (canvasSize.width - margin * 2) / columnBaseWidth,
            (canvasSize.height * 0.16) / this.ui1BaseBounds.height,
            (canvasSize.height * 0.16) / this.ui2BaseBounds.height
        );
        if (uiScale <= 0) {
            return null;
        }
        let ui1Size = this.getScaledSize(this.ui1BaseBounds, uiScale);
        let ui2Size = this.getScaledSize(this.ui2BaseBounds, uiScale);
        let boardWidth = canvasSize.width - margin * 2;
        let boardHeight = canvasSize.height - margin * 2 - ui1Size.height - ui2Size.height - panelGap * 2;
        if (boardWidth <= 0 || boardHeight <= 0) {
            return null;
        }
        let boardScale = Math.min(
            boardWidth / this.boardBaseSize.width,
            boardHeight / this.boardBaseSize.height
        );
        if (boardScale <= 0) {
            return null;
        }
        return {
            boardScale: boardScale,
            uiScale: uiScale,
            ui2Scale: uiScale,
            boardPos: cc.v2(
                0,
                (ui2Size.height - ui1Size.height) * 0.5
            ),
            ui1Pos: cc.v2(
                0,
                canvasSize.height * 0.5 - margin - this.ui1BaseBounds.top * uiScale
            ),
            ui2Pos: cc.v2(
                0,
                -canvasSize.height * 0.5 + margin - this.ui2BaseBounds.bottom * uiScale
            )
        };
    },

    // 根据窗口大小自适应布局棋盘、UI1 和 UI2
    applyResponsiveLayout() {
        if (!this.boardBaseSize || !this.ui1BaseBounds || !this.ui2BaseBounds) {
            return;
        }
        let visibleSize = cc.view.getVisibleSize();
        let canvasSize = cc.size(visibleSize.width, visibleSize.height);
        let margin = Math.max(8, Math.min(canvasSize.width, canvasSize.height) * 0.03);
        let gap = Math.max(8, margin * 0.5);
        let sideLayout = this.calculateSideLayout(canvasSize, margin, gap);
        let topLayout = this.calculateTopLayout(canvasSize, margin, gap);
        let layout = sideLayout;
        if (!layout || (topLayout && topLayout.boardScale > layout.boardScale)) {
            layout = topLayout;
        }
        if (!layout) {
            return;
        }
        this.node.setScale(layout.boardScale);
        this.node.setPosition(layout.boardPos);
        this.UI1.setScale(layout.uiScale);
        this.UI1.setPosition(layout.ui1Pos);
        this.UI2.setScale(layout.ui2Scale);
        this.UI2.setPosition(layout.ui2Pos);
        this.refreshLastChessTag();
    },

    // 调整画面和布局
    resize() {
        this.updateCanvasResolution();
        this.applyResponsiveLayout();
    },

    registerResizeHandler() {
        this.onViewResize = function () {
            this.resize();
        }.bind(this);
        if (cc.view.setResizeCallback) {
            cc.view.setResizeCallback(this.onViewResize);
        }
    },

    onDestroy() {
        if (cc.view.setResizeCallback) {
            cc.view.setResizeCallback(null);
        }
    },

    // 根据当前最后一手刷新黄色标记位置
    refreshLastChessTag() {
        if (!this.lastChessTag) {
            return;
        }
        let len = this.recordList.length;
        if (len <= 0) {
            this.lastChessTag.active = false;
            return;
        }
        let chess = this.chessList[this.recordList[len - 1]];
        if (!chess) {
            this.lastChessTag.active = false;
            return;
        }
        this.lastChessTag.active = true;
        this.lastChessTag.setPosition(chess.x, chess.y);
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

    // 获取某个点位相连的 3 个邻点
    getNeighbors(chess) {
        return [
            this.upDownOf(chess),
            this.leftOf(chess),
            this.rightOf(chess)
        ];
    },

    // 收集同色连通块，并判断整块是否还有气
    collectGroupAndCheckLiberty(color, chess) {
        this.listTagNum = [];
        if (!chess || chess.tagColor != color) {
            return false;
        }
        let stack = [chess];
        let visited = {};
        let hasLiberty = false;
        while (stack.length > 0) {
            let current = stack.pop();
            if (!current || current.tagColor != color) {
                continue;
            }
            let tagNum = current.tagNum;
            if (visited[tagNum]) {
                continue;
            }
            visited[tagNum] = true;
            this.listTagNum.push(tagNum);
            let neighbors = this.getNeighbors(current);
            for (let i = 0; i < neighbors.length; ++i) {
                let neighbor = neighbors[i];
                if (!neighbor || !neighbor.tagColor) {
                    continue;
                }
                if (neighbor.tagColor == 'null') {
                    hasLiberty = true;
                }
                else if (neighbor.tagColor == color && !visited[neighbor.tagNum]) {
                    stack.push(neighbor);
                }
            }
        }
        return hasLiberty;
    },

    // 判断 chess 及其周围同色棋子的死活。tiZou 表示死子是否提走。
    judgeDead(chess, color, tiZou) {
        if (!chess) {
            return false;
        }
        if (chess.tagColor != color) {
            if (chess.tagColor == 'null')
                return true;
            else {
                this.jie.tag -= 2;  // 劫的标记-2
                return false;
            }
        }
        var isAlive = this.collectGroupAndCheckLiberty(color, chess);
        if (!isAlive && tiZou) {
            this.removeDead(color);
        }
        return !isAlive;
    },

    // 提死子，死子储存在 this.listTagNum 中
    removeDead(color) {
        let len = this.listTagNum.length;
        if (len > 0) {
            this.audioChessDead.play();
            for (var i = 0; i < len; i++) {
                let chess = this.chessList[this.listTagNum[i]];
                this.setChess(chess, 'null');
            }
            // 记录提子信息
            let recordId = this.recordList.length,
                lastIdOfDead = this.recordDead.length - 1;
            // 如果提子记录的最后一项的 id 属性正好是当前的 行棋序号(recordId)，说明提子超过一处
            if (this.recordDead[lastIdOfDead] && this.recordDead[lastIdOfDead].id === recordId) {
                for (i = 0; i < len; ++i)
                    this.recordDead[lastIdOfDead].list.push(this.listTagNum[i]);
            } else {
                this.recordDead.push({
                    id: recordId,
                    list: this.listTagNum
                });
            }
            if (len == 1) {
                this.jie.tag += 1;  // 劫的标记+1
                this.jie[color] = this.listTagNum[0]; // 设置 color 的劫点位置
            }
        }
    },

    // 根据 str 指示的颜色设置 chess 节点的图片
    setChess(chess, str) {
        if (!chess)
            return;
        if (!str) {
            str = chess.tagColor;
        } else if (chess.tagColor != str) {
            chess.tagColor = str;
        }
        if (str === 'null') {
            if (chess.tagType == 'A') {
                chess.getComponent(cc.Sprite).spriteFrame = this.nullSpriteFrameA;
            }
            else {
                chess.getComponent(cc.Sprite).spriteFrame = this.nullSpriteFrameB;
            }
            chess.tagColor = str;
        } else if (str === 'red') {
            if (chess.tagType == 'A') {
                chess.getComponent(cc.Sprite).spriteFrame = this.redSpriteFrameA;
            }
            else {
                chess.getComponent(cc.Sprite).spriteFrame = this.redSpriteFrameB;
            }
        } else if (str === 'blue') {
            if (chess.tagType == 'A') {
                chess.getComponent(cc.Sprite).spriteFrame = this.blueSpriteFrameA;
            }
            else {
                chess.getComponent(cc.Sprite).spriteFrame = this.blueSpriteFrameB;
            }
        }
    },

    // 点击某落子点 的回调函数
    onTouchChess(event) {
        var self = event.currentTarget;
        if (self.tagColor != 'null')
            return;
        // 考察是否为劫点
        if (self.tagNum == this.jie[this.gameState])
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
            if (this.collectGroupAndCheckLiberty(this.gameState, self))
                this.putChess(self);
            else
                self.tagColor = 'null';
        }
    },

    // 落子
    putChess(self) {
        this.audioChessDown.play();
        self.tagColor = this.gameState;
        this.setChess(self, this.gameState);
        // 记录劫点信息
        if (this.jie[this.gameState] != null) {
            this.recordJie.push({
                id: this.recordList.length,
                tagNum: this.jie[this.gameState],
                color: this.gameState
            });
        }
        // 记录行棋位置
        this.recordList.push(self.tagNum);
        this.refreshLastChessTag();
        this.changeGameState();
    },

    // 进入下一轮
    changeGameState() {
        this.jie[this.gameState] = null;  // 劫点清除
        if (this.gameState == 'red') {
            this.UiDaoJiShi.color = new cc.Color(0, 125, 255);
            this.gameState = 'blue';
        }
        else {
            this.UiDaoJiShi.color = new cc.Color(255, 25, 0);
            this.gameState = 'red'
        }
        if (this.ting[this.gameState])
            this.ting[this.gameState] = false;  // 停一手记号清除
        this.labelDaoJiShi.string = "" + this.daojishi;
        this.seconds = 0;
    },

    fanState() {
        if (this.gameState == 'red')
            return 'blue';
        else
            return 'red';
    },

    // 根据落子点在chessList中的索引值，计算落子点的物理坐标
    ccV2ById(x, y, dx, dy) {
        var w = this.w,
            cx = dx || this.dBorderX,
            cy = dy || this.dBorderY,
            xx = Math.sqrt(3) * 0.5 * w * x + cx,
            yy = 1.5 * w * y + cy;
        return cc.v2(xx, yy);
    },

    onLoad() {
        this.daojishi = Global.timePerState;
        this.UiDaoJiShi = this.UI1.getChildByName("DaoJiShi");
        this.labelDaoJiShi = this.UiDaoJiShi.getComponent(cc.Label);
        this.btnRenShu = this.UI1.getChildByName("BtnRenShu");
        this.btnHuiQi = this.UI1.getChildByName("BtnHuiQi");
        this.btnTingYiShou = this.UI1.getChildByName("BtnTingYiShou");
        this.UI2 = this.overLabel.node.parent;
        this.restartButton = this.UI2.getChildByName("BtnRestart");
        this.initializeParams();
        this.lastChessTag.active = false;
        this.updateCanvasResolution();
        var self = this,
            sqrt3 = Math.sqrt(3),
            boardZhanBi = 0.02; // 棋盘宽度占画面宽度的比例
        // if (this.w0 == this.curDR.width) {
        //     this.w0 = this.w0 * boardZhanBi;
        //     this.dBorderX = 0.5 * (this.curDR.width - this.w0);
        //     this.w0 = this.w0 / sqrt3;
        //     this.dBorderY = 0.5 * this.curDR.height - this.w0;
        //     this.w = this.w0 / this.size;
        // } else {
        //     this.w0 = this.w0 * boardZhanBi;
        //     console.log("w0 = ", this.w0);
        //     this.dBorderY = 0.5 * (this.curDR.height - this.w0);
        //     this.w = this.w0 * 2 / this.size;
        //     this.w0 = this.w0 * sqrt3 * 0.5;
        //     this.dBorderX = 0.5 * (this.curDR.width - this.w0);
        // }
        var scaleNode = this.w / 200,
            dx = this.dBorderX,
            dy = this.dBorderY;

        // 调整棋盘边界的位置
        var borderW = this.size * this.w;
        // 落子点格子与边界的错位修正值

        // 设置 UI 的位置等
        // var yUi = (this.curDR.height + borderW) * 0.33333;
        // this.UI1.setPosition(0, -yUi);
        this.labelDaoJiShi.string = "" + this.daojishi;

        // 初始化棋盘上的点，并为每个节点添加事件
        this.chessList = new Array();
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
                    newNode.setPosition(this.ccV2ById(x, y, dx, dy));  // 使每个节点位于指定位置
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
        this.arrangeUI1Panel();
        this.arrangeUI2Panel();
        this.cacheResponsiveMetrics();
        this.resize();
        this.registerResizeHandler();
    },

    // 判断输赢
    judgeWinner() {
        var cntRed = 0, cntBlue = 0;
        let visitedNull = {};
        for (var i = 0; i < this.chessList.length; ++i) {
            let chess = this.chessList[i];
            if (!chess || !chess.tagColor) {
                continue;
            }
            if (chess.tagColor == 'red') {
                cntRed++;
            }
            else if (chess.tagColor == 'blue') {
                cntBlue++;
            }
            else if (!visitedNull[chess.tagNum]) {
                let region = this.collectEmptyRegion(chess, visitedNull);
                let owner = this.getRegionOwner(region.borderColors);
                if (owner == 'red') {
                    cntRed += region.points.length;
                }
                else if (owner == 'blue') {
                    cntBlue += region.points.length;
                }
            }
        }
        this.strOver = '红' + cntRed + '蓝' + cntBlue + '，'
        if (cntRed > cntBlue)
            return 'red';
        else if (cntRed < cntBlue)
            return 'blue';
    },

    // 收集一整块相连空地，并记录其边界接触到的棋子颜色
    collectEmptyRegion(chess, visitedNull) {
        let stack = [chess];
        let points = [];
        let borderColors = {};
        while (stack.length > 0) {
            let current = stack.pop();
            if (!current || current.tagColor != 'null' || visitedNull[current.tagNum]) {
                continue;
            }
            visitedNull[current.tagNum] = true;
            points.push(current.tagNum);
            let neighbors = this.getNeighbors(current);
            for (let i = 0; i < neighbors.length; ++i) {
                let neighbor = neighbors[i];
                if (!neighbor || !neighbor.tagColor) {
                    continue;
                }
                if (neighbor.tagColor == 'null') {
                    if (!visitedNull[neighbor.tagNum]) {
                        stack.push(neighbor);
                    }
                }
                else {
                    borderColors[neighbor.tagColor] = true;
                }
            }
        }
        return {
            points: points,
            borderColors: borderColors
        };
    },

    // 根据空地边界颜色判断归属
    getRegionOwner(borderColors) {
        if (borderColors.red && !borderColors.blue) {
            return 'red';
        }
        else if (!borderColors.red && borderColors.blue) {
            return 'blue';
        }
        return 'null';
    },

    // 根据 this.recordJie 和 id 设置劫点
    resetJie(id) {
        let rid = this.recordJie.length - 1;
        if (rid < 0) return;
        var r = this.recordJie[rid];
        if (r.id == id) {
            this.recordJie.pop();
            this.jie[r.color] = r.tagNum;
        }
    },

    // 根据 this.recordDead 和 id 重新放上死子
    resetDead(id) {
        let rid = this.recordDead.length - 1;
        if (rid < 0) return;
        var r = this.recordDead[rid];
        if (r.id == id) {
            this.recordDead.pop();
            if (id % 2 === 0) var c = 'red';
            else var c = 'blue';
            for (var i = 0; i < r.list.length; ++i) {
                let chess = this.chessList[r.list[i]];
                chess.tagColor = c;
                this.setChess(chess);
            }
        }
    },

    // 悔棋 - 按钮点击回调函数
    huiqi() {
        this.audioButton.play();
        // case: 单机
        if (this.danji) {
            // 返回上一步的状态
            let num = this.recordList.pop();
            if (num === undefined) return;
            let chess = this.chessList[num],
                id = this.recordList.length;
            chess.tagColor = 'null';
            this.setChess(chess, 'null');
            this.resetJie(id);
            this.resetDead(id);
            this.changeGameState();
            this.refreshLastChessTag();
        }
        // case: 联机
        else {
            this.overLabel.string = this.getColorHanZi(this.gameState) + '请求悔棋';
            this.tagOverLabel = 2;  // 显示 2 秒
            // todo: 发送悔棋的请求给对手
        }
    },

    // 认输 - 按钮点击回调函数
    renshu() {
        this.strOver = this.getColorHanZi(this.gameState) + '认输，';
        this.gameOver(this.fanState());
    },

    // 停一手 - 按钮点击回调函数
    tingyishou() {
        this.audioButton.play();
        this.ting[this.gameState] = true;
        this.overLabel.string = this.getColorHanZi(this.gameState) + '停一手';
        this.tagOverLabel = 2; // 显示 2 秒
        if (this.ting[this.fanState()]) {
            this.gameOver(this.judgeWinner());
        } else {
            this.changeGameState();
        }
    },

    getColorHanZi(color) {
        if (color == 'red')
            return '红方';
        else if (color == 'blue')
            return '蓝方';
        else return 'null';
    },

    // color 为胜利方
    gameOver(color) {
        if (!color)
            var color = this.judgeWinner();
        this.audioGameOver.play();
        let colorHanzi = this.getColorHanZi(color);
        if (colorHanzi == 'null')
            this.overLabel.string = this.strOver + '双方平局';
        else
            this.overLabel.string = this.strOver + colorHanzi + '获胜';
        this.tagOverLabel = 30; // 显示 30 秒
        this.labelDaoJiShi.string = '';
    },

    // 重新开始 - 按钮点击回调函数
    restart() {
        if (true) {
            cc.director.loadScene("menu");
        } else {  // case: 不返回初始界面，直接重新开始
            this.tagOverLabel = 0;
            this.initializeParams();
            for (var i = 0; i < this.chessList.length; ++i) {
                let chess = this.chessList[i];
                if (chess && chess.tagColor) {
                    this.setChess(chess, 'null');
                }
            }
        }
    },

    update(dt) {
        if (this.labelDaoJiShi.string != '')
            this.seconds += dt;
        // 每隔 1 秒
        if (this.seconds >= 1) {
            this.seconds = 0;
            let daojishi = Number(this.labelDaoJiShi.string) - 1;
            if (daojishi < 0) {
                this.labelDaoJiShi.string = '' + this.daojishi;
                this.strOver = this.getColorHanZi(this.gameState) + '超时，';
                this.gameOver(this.fanState());
            }
            else this.labelDaoJiShi.string = '' + daojishi;
            // 如果 overLabel 存在显示文字
            if (this.tagOverLabel) {
                this.tagOverLabel -= 1;
                if (this.tagOverLabel <= 0) {
                    this.overLabel.string = '';
                    this.strOver = '';
                }
            }
        }
    }
});
