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
        this.img = imga[String(this.type) + String(this.curstate) + '.png'];
        this.x = w / 2;
        this.y = -this.img.height;
        this.speed = w / 12;
        this.defer = 10;
        this.dropBlock = function () { // 下落方块
            ctx.drawImage(this.img, this.x, this.y, this.img.width, this.img.height);
            if(this.defer == 10) {
                this.y = this.y + this.speed;
                this.defer = 0;
            }
            this.defer ++;
        };
        this.transBlock = function() {
            if(this.curstate < this.states) {
                this.curstate ++;
            }
            else
                this.curstate = 1;
            this.img = imga[String(this.type) + String(this.curstate) + '.png'];
        };
    }
    var Bg = {
        img: imga['bg.png'],
        refreshBg: function () {
            ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height);
        }
    };
    var Blocks = {
        matrix: new Array(21),
        bline: new Array(21),
        block: new Block(1),
        init: function () { // 初始化数组
            for(var i = 0; i < 21; i ++) {
                this.bline[i] = 21*cell;
                this.matrix[i] = new Array(12);
                for (var j = 0; j < 12; j++)
                    this.matrix[i][j] = 0;
            }
        },
        setSite: function (x, y) {
            this.block.x = this.block.x + x;
            this.block.y = this.block.y + y;
        },
        reachBottom: function () {
            var that = this;
            that.bline.map(function (b, i) {
                if(that.block.y >= b - that.block.img.height)
                    that.block = new Block(2);
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
        Bg.refreshBg();
        Blocks.block.dropBlock();
        Blocks.reachBottom();
    },100);
    document.onkeydown = function (e) {
        switch (e.keyCode){ // 向上按键
            case 37: // ←
                Blocks.setSite(-cell, 0);
                break;
            case 38: // ↑
            //    ctx.rotate(20*Math.PI/150);
                Blocks.block.transBlock();
                break;
            case 39: // →
                Blocks.setSite(cell, 0);
                break;
            case 40: // ↓
                break;
            default :
                return false;
        }
    }
}

var c = document.getElementById('tetris');
(function () { // 适应手机屏幕
    c.setAttribute('height', 420 > window.innerHeight ? window.innerHeight.toString() : '420');
    c.setAttribute('width', 240 > window.innerWidth ? window.innerWidth.toString() : '240');
})();

var oimgarr = {};
loadAllImg(['bg.png','11.png','12.png','21.png','22.png','31.png',
        '41.png','42.png','43.png','44.png','51.png','52.png','53.png','54.png'],
    parseInt(c.getAttribute('width')) / 240, function () {
    run(c, oimgarr);
});

