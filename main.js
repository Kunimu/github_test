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

var blockList;            //ブロックを収納する配列
var moveblockList;        //ドラッグされたブロックを収納する配列


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
    //changeFlg    = false;

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

      //半透明のものを削除
      moveblockList = new Array();
      for (var i = 0; i < 30; i++){
        if(blockList[i].opacity == 0.2){
          blockList[i].scene.removeChild(blockList[i]);
          
         /* removeKind = blockList[i].no;
          blockList[x + y * block_COL] = null;
          blockList[i].tl.fadeOut(10).then(function(){
            scene.removeChild(this);
          });*/
        }
      }
      
      dropBlock();

    }
  });

  //ドラッグ中のイベントを追加
  block.addEventListener('touchmove', function(e) {
    if(dragStartFlg){
      var dx = e.x;
      var dy = e.y;

      var nowX = Math.floor(dx / block_SIZE);
      var nowY = Math.floor((dy - 200) / block_SIZE);

      //ドラッグしたブロックを半透明にする
        if(dragStartX !== nowX || dragStartY !== nowY){
          if (blockList[nowX + nowY * block_COL].no == blockList[dragStartX + dragStartY * block_COL].no){
   
          //ドラッグしたブロックを透明化
          blockList[nowX + nowY * block_COL].opacity = 0.2;
          dragStartX = nowX;
          dragStartY = nowY;
          }
        }
    }
  }); 

} 


//消えた分を補充する 下からずらしてく
function dropBlock(){
  for(var x = 0; x < block_COL; x++){
    var maxCount = 0; //画面外の何個目か
    for(var y = block_ROW - 1; y >= 0; y--){
      var block = getBlock(x,y);
      //空だったらずらす
      if(block == null){
        var flg = true;   //whileようフラグ
        var count = 1;    //何こ上までからか
        while(flg){
          //上が画面内か判定
          if( y - count >= 0){
            //上もからっぽ
            if(getBlock(x,y-count) == null){
              count++;
            }else{
              //ずらす
              flg = false;
              blockList[x + y * block_COL] = getBlock(x,y-count);
              blockList[x + (y - count) * block_COL] = null;
              getBlock(x,y).tl.moveBy(0,count * block_SIZE,10);
            }
          //画面外なので新しく作る
          }else{
            flg = false;
            //画面外なので新しくつくる
            maxCount++;
            //var stamp = createStamp(scene,x,y - count - maxCount + 1);
            var block = createBlock(scene,x,y);
            block.y = block_SIZE * (y - count - maxCount + 1) + 200;
            block.tl.moveBy(0,(count + maxCount - 1) * block_SIZE,10);
          }
        }
      }
    }
  }
}



// ブロックの取得
function getBlock(x,y){
  return blockList[x + y * block_COL];
}


//ランダム関数
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}




