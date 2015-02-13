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
    var ctx = c.getContext('2d');
    var w = parseInt(c.getAttribute('width')),
        h = parseInt(c.getAttribute('height')),
        cell = w / 12;
    function Block(type) {
        this.type = type;
        this.curstate = 1;
        this.states = (this.type == 1 || this.type == 2) ? 2 : ((this.type == 4 || this.type == 4) ? 4 : 1);
        this.i = -3;
        this.j = 6;
        this.speed = 100;
        this.defer = 0;
        switch (this.type) {
            case 1:
                this.outline = [{i: this.i, j: this.j},
                    {i: this.i + 1, j: this.j},
                    {i: this.i + 2, j: this.j},
                    {i: this.i + 3, j: this.j}];
                break;
            case 2:
                this.outline = [{i: this.i, j: this.j},
                    {i: this.i - 1, j: this.j + 1},
                    {i: this.i, j: this.j + 1},
                    {i: this.i, j: this.j + 2}];
                break;
        }
        this.dropBlock = function () { // 下落方块
            if(this.defer == this.speed) {
                var l = this.outline.length - 1;
                this.outline.map(function (o, i) {
                    o.i = o.i + 1;
                });
                //this.outline.push({i: this.outline[l].i + 1, j: this.outline[l].j});
                this.defer = 0;
            }
            else
                this.defer ++;
        };
        this.setSpeed = function () {
            this.speed = 2;
            this.defer = 0;
        }
    }
    var Blocks = {
        nullimg: imga['null.png'],
        cellimg: imga['cell.png'],
        matrix: new Array(21), // 方块矩阵，-1表示空，0表示正在移动，1表示已存在
        bline: new Array(21),
        block: new Block(1),
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
            //if(that.block.defer == 0) {
            //    var d = that.block.outline.shift();
            //    d.i >= 0 ? that.matrix[d.i][d.j] = -1 : '';
            //    that.block.outline.map(function (o) {
            //        o.i >= 0 ? that.matrix[o.i][o.j] = 0 : '';
            //    });
            //    for(var g = 0; g<that.matrix.length;g++)
            //        console.log(that.matrix[g]);
            //    console.log('\n')
            //}
            that.block.outline.map(function (o) {
                o.i > 0 ? that.matrix[o.i - 1][o.j] = -1 : '';
            });
            that.block.outline.map(function (o) {
                o.i >= 0 ? that.matrix[o.i][o.j] = 0 : '';
            });
            this.matrix.map(function (l, i) {
                l.map(function (m, j) {
                    img = (m == -1 ? that.nullimg : that.cellimg);
                    ctx.drawImage(img, j * cell, i * cell, img.width, img.height);
                });
            });
        },
        rotateBlock: function (x, y) {
            return {x: y, y: -x};
        },
        setSite: function (dir) { // 设置左右移动后的位置
            var count, o, l = this.block.outline.length; // 是否允许左右移动
            for(count = 0; count < l; count ++){
                o = this.block.outline[count];
                // 是否碰到已存在的方块，是否碰到左右边界
                if((Blocks.matrix[o.i][o.j + dir] == 1) || (o.j + dir == -1 || o.j + dir == 12)){
                    break; // 一旦发生碰撞，就退出循环，并不执行移动操作
                }
            }
            if(count == l) { // 当count=l时，表明移动操作没有发生碰撞
                this.block.outline.map(function (o) {
                    if (o.i >= 0) {
                        Blocks.matrix[o.i][o.j] = -1;
                        o.j = (o.j + dir == -1 || o.j + dir == 12) ? o.j : o.j + dir; // 位置
                        Blocks.matrix[o.i][o.j] = 0;
                    }
                    else
                        o.j = (o.j + dir == -1 || o.j + dir == 12) ? o.j : o.j + dir; // 位置
                });
            }
        },
        reachBottom: function () {
            var that = this;
            that.block.outline.map(function (o, i) {
                if(o.i > 0) {
                    if (o.i == 20 || that.matrix[o.i + 1][o.j] == 1) {
                        that.block.outline.map(function (o0) {
                            that.matrix[o0.i][o0.j] = 1; // 方块停止后，修改矩阵数据
                        });
                        for(var g = 0; g<that.matrix.length;g++)
                            console.log(that.matrix[g]);
                        console.log('\n')
                        that.block = new Block(2);
                    }
                }
            });
        },
        detectMat: function () { // 检测矩阵，判断是否有连续一行
            var count = 0,
                detecta = []; // 需要爆破的行号
            this.matrix.map(function (l, i) {
                l.map(function (c, j) {
                    c == 0 && count ++;
                });
                count == 12 && detecta.push(i);
                count = 0;
            });
            return detecta.length == 0 ? false : detecta;
        },
        ruinMat: function () { // 爆破连续的一行
            var dmat = this.detectMat();
            if(dmat){
                dmat.map(function (d) {
                    Blocks.matrix.splice(d, 1);
                    Blocks.matrix.push([0,0,0,0,0,0,0,0,0,0,0,0]);
                });
            }
            dmat = null;
        }
    };
    Blocks.init();
    setInterval(function () {
        Blocks.reachBottom(); // 检测是否到达底部或者碰到已有方块
        Blocks.block.dropBlock(); // 下落方块
        Blocks.refreshMat(); // 刷新矩阵
    },10);
    document.onkeydown = function (e) {
        switch (e.keyCode){ // 向上按键
            case 37: // ←
                Blocks.setSite(-1);
                break;
            case 38: // ↑
                //    ctx.rotate(20*Math.PI/150);
                Blocks.block.transBlock();
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

var c = document.getElementById('tetris');
(function () { // 适应手机屏幕
    c.setAttribute('height', 420 > window.innerHeight ? window.innerHeight.toString() : '420');
    c.setAttribute('width', 240 > window.innerWidth ? window.innerWidth.toString() : '240');
})();

var oimgarr = {};
loadAllImg(['null.png','cell.png'],
    parseInt(c.getAttribute('width')) / 240, function () {
        run(c, oimgarr);
    });

