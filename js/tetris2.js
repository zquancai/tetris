/**
 * Created by zqc on 2015/2/10.
 */

function dlImg(img) { // 返回一个img对象
    var oimg = new Image();
    oimg.src = 'images/' + img;
    return oimg;
}

function loadAllImg(img, sw, fun) {
    var l = img.length,
        i,h = 0;
    for(i = 0; i < l; i ++){
        oimgarr[img[i]] = dlImg(img[i]);
        oimgarr[img[i]].onload = function () {
            this.width = this.width  * sw;
            this.height = this.height  * sw;
            h ++;
            h >= l && fun();
        }
    }
}

function run (c, imga) {
    var ctx = c.getContext('2d'), time = null;
    var w = parseInt(c.getAttribute('width')), // 画布的宽
        h = parseInt(c.getAttribute('height')), // 画布的高
        cell = w / 12; // 单元方块的边长
    function Block(type) {
        this.type = type;
        this.i = -1;
        this.j = 6;
        this.speed = 100;
        this.defer = 0;
        switch (this.type) {
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
            var that = this;
            if(this.defer == this.speed) {
                this.outline.map(function (o) {
                    o.i = o.i + 1;
                });
                //that.center.i  = that.center.i + 1;
                this.defer = 0;
            }
            else
                this.defer ++;
        };
        this.setSpeed = function () {
            this.speed = 2;
            this.defer = 0;
        };
        this.isReady = function () {
            return this.speed == this.defer;
        }
    }
    var Blocks = {
        nullimg: imga['null.png'],
        cellimg: imga['cell.png'],
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
        refreshMat: function () {
            var img = null, that = this;
            that.block.outline.map(function (o) { // 将移动前的位置都置为-1
                if(o.i > 0 && that.matrix[o.i - 1][o.j] != 1 )
                    that.matrix[o.i - 1][o.j] = -1;
            });
            that.block.outline.map(function (o) { // 刷新移动后的位置
                if(o.i >= 0)
                    that.matrix[o.i][o.j] = 0;
            });
            this.matrix.map(function (l, i) {
                l.map(function (m, j) {
                    img = (m == -1 ? that.nullimg : that.cellimg);
                    ctx.drawImage(img, j * cell, i * cell, img.width, img.height);
                });
            });
        },
        rotateBlock: function () {
            var that = this, i, o = null, ctr = that.block.outline[1];
            for(i = 0; i < 4; i ++){
                o = that.rotatePoint(ctr, that.block.outline[i]);
                if(o.j < 0 || o.j > 11 || o.i > 20){ // 旋转时不可以碰到边界及已有方块的点
                    break;
                }
                else if(o.i > 0 && o.j >= 0 && o.j <= 20 && Blocks.matrix[o.i][o.j] == 1){
                    break;
                }
            }
            if(that.block.type != 4 && i == 4) { // 田字形无法旋转
                that.block.outline.map(function (o, i) {
                    if(o.i >= 0)
                        that.matrix[o.i][o.j] = -1; // 清空变化前的位置
                    that.block.outline[i] = that.rotatePoint(ctr, o);
                });
            }
            else
                console.log('不允许旋转')
        },
        rotatePoint: function (c, p) { // c点为旋转中心，p为旋转点，一次顺时针旋转90度
            return {j: p.i - c.i + c.j, i: -p.j + c.i + c.j};
        },
        setSite: function (dir) { // 设置左右移动后的位置
            var that = this,count, o, l = this.block.outline.length;
            for(count = 0; count < l; count ++){
                o = this.block.outline[count];
                // 是否碰到已存在的方块，是否碰到左右边界
                if(o.i >= 0 && ((Blocks.matrix[o.i][o.j + dir] == 1) || (o.j + dir == -1 || o.j + dir == 12))){
                    break; // 一旦发生碰撞，就退出循环，并不执行移动操作
                }
            }
            if(count == l) { // 当count=l时，表明移动操作没有发生碰撞
                this.block.outline.map(function (o) {
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
            var that = this, count, o, l = that.block.outline.length, i;
            if(that.block.isReady()) { // 当前方块下落帧已结束，然后进行检测是否到达了底部
                for (count = 0; count < l; count++) {
                    o = that.block.outline[count];
                    if (o.i >= 0 && (o.i == 20 || that.matrix[o.i + 1][o.j] == 1)) { // 向下移动时发生碰撞
                        break; // 方块到达底部或落在其他方块上，方块停止下落，产生新的方块
                    }
                }
                if (count < l) { // 当方块落在底部或其他方块时，进行检测
                    for(i = 0; i < 4; i++) {
                        o = that.block.outline[i];
                        if(o.i >= 0){
                            that.matrix[o.i][o.j] = 1;  // 方块停止后，修改矩阵数据
                        }
                        else {
                            that.gameOver();
                            return;
                        }
                    }
                    that.ruinMat(); // 检测是否需要爆破行，如果有执行爆破操作
                    that.block = new Block(parseInt(Math.random() * 5) + 1);
                }
            }
        },
        detectMat: function () { // 检测矩阵，判断是否有连续一行，返回一个数组
            var count = 0, s,
                detecta = []; // 需要爆破的行号
            this.matrix.map(function (l, i) {
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
                dmat.map(function (d) {
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
    time = setInterval(function () {
        Blocks.block.dropBlock(); // 下落方块
        Blocks.refreshMat(); // 刷新矩阵
        Blocks.reachBottom(); // 检测是否到达底部或者碰到已有方块
    },10);
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
                Blocks.block.setSpeed();
                break;
            default :
                return false;
        }
    };
    document.onkeyup = function (e) {
        if(e.keyCode == 40){
            Blocks.block.speed = 100;
        }
    }
}

var c = document.getElementById('tetris'),
    score = document.getElementById('score');
(function () { // 适应手机屏幕
    c.setAttribute('height', 420 > window.innerHeight ? window.innerHeight.toString() : '420');
    c.setAttribute('width', 240 > window.innerWidth ? window.innerWidth.toString() : '240');
})();

var oimgarr = {};
loadAllImg(['null.png','cell.png'],
    parseInt(c.getAttribute('width')) / 240, function () {
        run(c, oimgarr);
    });