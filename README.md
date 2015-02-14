## tetris 俄罗斯方块

全局函数说明
--
``JavaScript
####全局函数 function dlImg
#####参数：img(string)
#####功能：生成并返回一个image对象
``

``JavaScript
####全局函数 function loadAllImg
#####参数：img(Array)
#####参数：sw(int)
#####参数：fun(function)
#####功能：下载图片，按照sw的缩放比例对图片进行缩放
``

``JavaScript
####全局函数 ```function run (c, imga) {}```
#####参数：c(DOM)
#####参数：imga(Object)
#####功能：游戏入口函数，进行游戏的各个操作
``

``JavaScript
####全局对象```oimgarr```：
#####功能：保存已下载的图片数据，image对象
``

游戏各功能说明
--
``JavaScript
####Block类：方块类，产生各种方块
``
