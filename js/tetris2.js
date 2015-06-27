/**
 * Created by zqc on 2015/2/10.
 */

(function () {

    var config = {
        I: -1,
        J: 6,
        SPEED: 25,
        FASTSPEED: 1,
        TIME: 40
    };

    function dlImg(img) { // 返回一个img对象
        var oimg = new Image();
        oimg.src = 'images/' + img;
        return oimg;
    }

    /**
     * @param img img对象数组
     * @param sw 屏幕适应的一个比值
     * @param fun 程序入口函数
     */
    function loadAllImg(img, sw, fun) {
        var l = img.length,
            i,h = 0;
        for(i = 0; i < l; i ++){
            oimgarr[img[i]] = dlImg(img[i]);
            oimgarr[img[i]].onload = function () { // 加载是异步的
                this.width = this.width  * sw;
                this.height = this.height  * sw;
                h ++;
                h >= l && fun(); // 所有图片加载成功后调用fun函数
            }
        }
    }

    /**
     * @param c canvas DOM对象
     * @param imga img对象数组
     */
    function run (c, imga) {
        var ctx = c.getContext('2d'), time = null;
        var w = parseInt(c.getAttribute('width')), // 画布的宽
            cell = w / 12; // 单元方块的边长
        function Block(type) {
            this.type = type; // 形状类型
            this.i = config.I; // 初始行位置
            this.j = config.J; // 初始列位置
            this.speed = config.SPEED; // 初始速度
            this.defer = 0; // 延迟累计
            switch (this.type) { // 根据type值初始化形状包含的方块的坐标，outline属性值存储着这些坐标值
                case 1: // l字
                    this.outline = [{i: this.i, j: this.j},
                        {i: this.i - 1, j: this.j},
                        {i: this.i - 2, j: this.j},
                        {i: this.i - 3, j: this.j}];
                    break;
                case 2: // 上字
                    this.outline = [{i: this.i, j: this.j - 1},
                        {i: this.i - 1, j: this.j},
                        {i: this.i, j: this.j},
                        {i: this.i, j: this.j + 1}];
                    break;
                case 3: // L字
                    this.outline = [{i: this.i - 2, j: this.j - 1},
                        {i: this.i - 1, j: this.j - 1},
                        {i: this.i, j: this.j - 1},
                        {i: this.i, j: this.j}];
                    break;
                case 4: // 田字
                    this.outline = [{i: this.i - 1, j: this.j - 1},
                        {i: this.i, j: this.j - 1},
                        {i: this.i, j: this.j},
                        {i: this.i - 1, j: this.j}];
                    break;
                case 5: // 转字
                    this.outline = [{i: this.i - 1, j: this.j - 1},
                        {i: this.i, j: this.j - 1},
                        {i: this.i, j: this.j},
                        {i: this.i + 1, j: this.j}];
                    break;
            }
            this.dropBlock = function () { // 下落方块
                if(this.defer == this.speed) {
                    this.outline.map(function (o) {
                        o.i = o.i + 1; // 行（i）坐标加1表示向下移
                    });
                    this.defer = 0;
                }
                else
                    this.defer ++;
            };
            this.speedUp= function () { // 按下方向键时，形状加速下降
                this.speed = 1;
                this.defer = 0;
            };
            this.isReady = function () {
                return this.speed == this.defer;
            }
        }
        var Blocks = {
            nullimg: imga['null.png'],
            cellimg: imga['cell.png'],
            pause: false,
            matrix: new Array(21), // 方块矩阵，-1表示空，0表示正在移动，1表示已存在
            bline: new Array(21),
            block: new Block(1),
            score: 0,
            init: function () { // 初始化数组
                for(var i = 0; i < 21; i ++) {
                    this.bline[i] = {i: 21, j: i};
                    this.matrix[i] = new Array(12);
                    for (var j = 0; j < 12; j ++) {
                        this.matrix[i][j] = -1;
                        ctx.drawImage(this.nullimg, j * cell, i * cell, this.nullimg.width, this.nullimg.height);
                    }
                }
            },
            start: function () {
                var that = this;
                time = setInterval(function () {
                    that.block.dropBlock(); // 下落方块
                    that.refreshMat(); // 刷新矩阵
                    that.reachBottom(); // 检测是否到达底部或者碰到已有方块
                }, config.TIME);
                this.pause = false;
            },
            suspend: function () {
                this.pause = true;
                clearInterval(time);
            },
            refreshMat: function () { // 执行一次矩阵刷新
                var img = null, that = this;
                that.block.outline.forEach(function (o) { // 将移动前的位置都置为-1
                    if(o.i > 0 && that.matrix[o.i - 1][o.j] != 1 )
                        that.matrix[o.i - 1][o.j] = -1;
                });
                that.block.outline.forEach(function (o) { // 刷新移动后的位置
                    if(o.i >= 0)
                        that.matrix[o.i][o.j] = 0;
                });
                this.matrix.forEach(function (l, i) { // 重绘矩阵
                    l.forEach(function (m, j) {
                        img = (m == -1 ? that.nullimg : that.cellimg);
                        ctx.drawImage(img, j * cell, i * cell, img.width, img.height);
                    });
                });
            },
            rotatePoint: function (c, p) { // c点为旋转中心，p为旋转点，一次顺时针旋转90度。返回旋转后的坐标
                return {j: p.i - c.i + c.j, i: -p.j + c.i + c.j};
            },
            rotateBlock: function () {
                var that = this, i, o = null, ctr = that.block.outline[1], l = that.block.outline.length;
                if (that.block.type != 4) { // 田字形无法旋转
                    for (i = 0; i < l; i++) {
                        o = that.rotatePoint(ctr, that.block.outline[i]);
                        if (o.j < 0 || o.j > 11 || o.i > 20) { // 旋转时不可以碰到边界
                            break;
                        }
                        else if (o.i > 0 && o.j >= 0 && o.j <= 20 && Blocks.matrix[o.i][o.j] == 1) { // 旋转时不可以已有方块的点
                            break;
                        }
                    }
                    if (i == 4) {
                        that.block.outline.forEach(function (o, i) {
                            if (o.i >= 0)
                                that.matrix[o.i][o.j] = -1; // 清空变化前的位置
                            that.block.outline[i] = that.rotatePoint(ctr, o);
                        });
                    }
                }
            },
            setSite: function (dir) { // 设置左右移动后的位置
                var i, o, l = this.block.outline.length;
                for(i = 0; i < l; i ++){
                    o = this.block.outline[i];
                    // 是否碰到已存在的方块，是否碰到左右边界
                    if(o.i >= 0 && ((Blocks.matrix[o.i][o.j + dir] == 1) || (o.j + dir == -1 || o.j + dir == 12))){
                        break; // 一旦发生碰撞，就退出循环，并不执行移动操作
                    }
                }
                if(i == l) { // 当count=l时，表明移动操作没有发生碰撞
                    this.block.outline.forEach(function (o) {
                        if (o.i >= 0) {
                            Blocks.matrix[o.i][o.j] = -1; // 将当前位置置为-1
                            o.j = (o.j + dir == -1 || o.j + dir == 12) ? o.j : o.j + dir; // 是否允许移动，允许则将o.j+dir的值赋予o.j
                            Blocks.matrix[o.i][o.j] = 0; // 刷新最新值
                        }
                        else { // 小于0时（在矩阵之外），也需进行左右移动
                            o.j = (o.j + dir == -1 || o.j + dir == 12) ? o.j : o.j + dir;
                        }
                    });
                }
            },
            reachBottom: function () {
                var that = this, i, j, o, l = that.block.outline.length;
                if(that.block.isReady()) { // 当前方块下落帧结束时，然后进行检测是否到达了底部
                    for (j = 0; j < l; j ++) {
                        o = that.block.outline[j];
                        if (o.i >= 0 && (o.i == 20 || that.matrix[o.i + 1][o.j] == 1)) { // 向下移动时发生碰撞
                            break; // 方块到达底部或落在其他方块上，方块停止下落，产生新的方块
                        }
                    }
                    if (j < l) { // 当方块落在底部或其他方块时，进行检测
                        for(i = 0; i < l; i ++) {
                            o = that.block.outline[i];
                            if(o.i >= 0){
                                that.matrix[o.i][o.j] = 1;  // 方块停止后，修改矩阵数据
                            }
                            else {
                                that.gameOver();
                                return;
                            }
                        }
                        that.ruinMat(); // 检测是否需要爆破行，如果有则执行爆破操作
                        that.block = new Block(parseInt(Math.random() * 5) + 1);
                    }
                }
            },
            detectMat: function () { // 检测矩阵，判断是否有连续一行，返回一个数组
                var count = 0, s,
                    detecta = []; // 需要爆破的行号
                this.matrix.forEach(function (l, i) {
                    for(s = 0; s < l.length; s ++){
                        if(l[s] == 1) count ++; else break;
                    }
                    count == 12 && detecta.push(i);
                    count = 0;
                });
                return detecta.length == 0 ? false : detecta;
            },
            ruinMat: function () { // 爆破连续的一行
                var dmat = this.detectMat(); // 返回整行都有方块的行号集合
                if(dmat){
                    this.score = this.score + (dmat.length == 1 ? 100 : dmat.length == 2 ? 250 : dmat.length == 3 ? 450 : 700);
                    score.innerHTML = this.score.toString();
                    dmat.forEach(function (d) {
                        Blocks.matrix.splice(d, 1); // 删掉整行都有方块的行
                        Blocks.matrix.unshift([-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]); // 弥补被删的行
                    });
                }
                dmat = null;
            },
            gameOver: function () {
                clearInterval(time);
                alert('你挂了');
            }
        };
        Blocks.init();
        Blocks.start();
        document.onkeydown = function (e) {
            switch (e.keyCode){ // 向上按键
                case 37: // ←
                    Blocks.setSite(-1);
                    break;
                case 38: // ↑
                    Blocks.rotateBlock();
                    break;
                case 39: // →
                    Blocks.setSite(1);
                    break;
                case 40: // ↓
                    if(Blocks.block.speed == config.SPEED)
                        Blocks.block.speedUp();
                    break;
                case 32: // 暂停
                    !Blocks.pause ? Blocks.suspend() : Blocks.start();
                    break;
                default :
                    return false;
            }
        };
        document.onkeyup = function (e) {
            if(e.keyCode == 40){
                Blocks.block.speed = config.SPEED;
            }
        }
    }

    var c = document.getElementById('tetris'),
        score = document.getElementById('score');
        c.setAttribute('height', 420 > window.innerHeight ? window.innerHeight.toString() : '420');
        c.setAttribute('width', 240 > window.innerWidth ? window.innerWidth.toString() : '240');

    var oimgarr = {}; // 全局变量
    loadAllImg(['null.png','cell.png'],
        parseInt(c.getAttribute('width')) / 240, function () {
            run(c, oimgarr);
        });
})();