enchant();

//画像の設定
var block_IMG = "number.png";    //ブロックの画像
var tile_IMG = "tile.png";      //タイルの画像

//定数の設定
var background_WIDTH = 480;     //背景の横
var background_HIGHT = 600;     //背景の縦
var block_SIZE = 80;        //ブロックのサイズ
var block_NUM = 6;          //ブロックの数字
var block_COL = 6;          //ブロックの配置する数横
var block_ROW = 5;          //ブロックの配置する数縦

//ドラッグ情報
var dragOkFlg;            //ドラッグしていいか
var dragStartFlg;         //ドラッグを開始したフラグ
var dragStartX;           //ドラッグを開始したx座標
var dragStartY;           //ドラッグを開始したy座標
var dragBlock;            //ドラッグ中のブロック
var changeFlg;

var blockList;            //ブロックを収納する配列


window.onload = function () {
  game = new Game (background_WIDTH, background_HIGHT);
  game.fps = 24;
  game.preload(block_IMG, tile_IMG);



  game.onload = function () {
    scene = new GameStartScene ();
    game.pushScene(scene);

    game.rootScene.backgroundColor = '#000';


  }
  game.start();
};

//ゲーム画面
GameStartScene = enchant.Class.create(enchant.Scene, {
  initialize : function () {
    Scene.call(this);
    //変数の初期化
    dragOkFlg    = false;
    dragStartFlg = false;
    changeFlg    = false;

    //背景の生成
    var tile = new Sprite (background_WIDTH, 400);
    tile.image = game.assets[tile_IMG];
    tile.y = background_HIGHT - 400;
    this.addChild(tile);

    //配列の作成
    blockList = new Array();
    for (var y = 0; y < block_ROW; y++){
      for(var x = 0; x < block_COL; x++){
        createBlock(this, x, y);
      }
    }
    dragOkFlg = true;

  }
});

//ブロックの作製
function createBlock(stage, x, y){
  var block = new Sprite(block_SIZE, block_SIZE);     //ブロックのサイズ
  block.image = game.assets[block_IMG];         //ブロックの画像
  var no = rand(0, block_NUM - 1);
  block.no    = no;                    //ブロックの数字
  block.frame = no;                   //ブロックの画像番号
  block.x     = block_SIZE * x;
  block.y     = block_SIZE * y + background_HIGHT - 400;
  stage.addChild(block);
  blockList[x + y * block_COL]  = block;

  //タッチを開始した時のイベントを追加
  block.addEventListener('touchstart', function(e) {

    //もしドラッグOKならドラッグスタート
    if(dragOkFlg){
      dragBlock = e.target;
      dragStartFlg = true;
      changeFlg = false;

      dragStartX = Math.floor(e.target.x / block_SIZE);
      dragStartY = Math.floor((e.target.y - 200) / block_SIZE);
      e.target.opacity = 0.2;             //ドラッグしたブロックを透明化
    }
  });

  //タッチ終了時のイベントを追加
  block.addEventListener('touchend', function(e) {
    if(dragOkFlg){
      dragStartFlg = false;
      dragOkFlg    = true;
      dragBlock.opacity = 1.0;

      if(changeFlg){
        console.log('パネルチェック');
        console.log(timeLabel.time);
      }else{
        dragOkFlg = true;
      }
    }
  });

  //ドラッグ中のイベントを追加
  block.addEventListener('touchmove', function(e) {
    if(dragOkFlg){
      var dx = e.x;
      var dy = e.y;

      var nowX = Math.floor(dx / block_SIZE);
      var nowY = Math.floor((dy - 200) / block_SIZE);

      //入れ替わってたら入れ替える
          if(dragStartX !== nowX || dragStartY !== nowY){
                changeFlg = true;
                var moveBlock = blockList[nowX + nowY * block_COL];
                moveBlock.x = dragStartX * block_SIZE;
                moveBlock.y = dragStartY * block_SIZE + 200;
                dragBlock.x = nowX * block_SIZE;
                dragBlock.y = nowY * block_SIZE + 200;

                blockList[nowX + nowY * block_COL] = blockList[dragStartX + dragStartY * block_COL];
                blockList[dragStartX + dragStartY * block_COL] = moveBlock;
                dragStartX = nowX;
                dragStartY = nowY;
          }
    }


  }); 

} 

//ランダム関数
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}




