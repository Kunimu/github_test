/*
-------------------14/07/08---------------------------
実装内容
・スコア、タイムの表示。
・制限時間で終了。
・パズルのバグの修正。
　ーすぐ横、縦以外のブロックも消せたのを修正。
　ーパズル外をドラッグした時の無駄な計算を回避。
　ードラッグが一方通行だったのを戻ってやり直せるように修正。
・スコア換算の仕方を変更。

実装予定（優先順）
・コンボの表示。
・フィーバー時の演出を追加。
・画像変更。
・数字の数、表示ブロックの数の調整。
・スタート画面、スコア表示画面の追加。

-------------------14/07/09---------------------------
実装内容
・コンボ数の表示
・フィーバー時にFEVER TIME!と表示

実装したい機能はほぼ実装できたので見た目を改善していきたいと思います。
イラストレーターの体験版が期限切れになったのが想定外ですが、なんとか別の方法で画像を作って、
レイアウトを変えていきます。
その他難易度、得点の付け方などいろいろ調整していく予定です。
*/

enchant();
 
//画像の設定
var block_IMG = "number.png";    //ブロックの画像
var tile_IMG  = "tile.png";      //タイルの画像
 
//定数の設定
var background_WIDTH = 480;   //背景の横幅
var background_HIGHT = 600;   //背景の縦幅
var block_SIZE = 80;          //ブロックのサイズ
var normal_NUM = 5;           //通常時の最大数
var block_COL  = 6;           //ブロックの配置する数横
var block_ROW  = 5;           //ブロックの配置する数縦
var block_NUM  = normal_NUM;  //ブロックの最大数 

//ドラッグ情報
var dragOkFlg;            //ドラッグしていいか
var dragStartFlg;         //ドラッグを開始したフラグ
var dragStartX;           //ドラッグを開始したx座標
var dragStartY;           //ドラッグを開始したy座標
var dragBlock;            //ドラッグ中のブロック
var nearbyFlg;

//パズルの判定
var sameFlg;              //同じ数字かどうかのフラグ
var continuousFlg;        //連続数かどうかのフラグ
var feverFlg;             //フィーバータイムの判定フラグ
 
var blockList;            //ブロックを収納する配列
var moveblockList;        //ドラッグされたブロックを収納する配列

var scoreCount = 0;       //スコアをカウント
var comboCount;           //コンボをカウント
var chainCount;           //一度に消した数をカウント
var comboBouns = 100;     //コンボで増えるスコアのボーナス
var chainBouns = 1000;    //連結で増えるボーナス
var continuousBouns = 3;  //連続数を消した時のボーナス
var scoreBouns = 1;       //スコアのボーナス
var feverBouns = 5;       //フィーバー時の得点のボーナス倍率
var feverCombo = 5;       //フィーバーに入るためのコンボ数
var fever_NUM = 3;        //フィーバー時の最大数
var fever_TIME = 10000;   //フィーバーの時間(ms)

var comboLabel = Label();
var feverLabel = Label();
 
 
window.onload = function () {
  game = new Core (background_WIDTH, background_HIGHT);
  game.fps = 24;
  game.preload(block_IMG, tile_IMG, 'end.png');
  game.rootScene.backgroundColor = '#000';
  ColorList = new Array("rgb(255,0,0)","rgb(255,255,0)","rgb(0,255,0)","rgb(0,255,255)","rgb(0,0,255)","rgb(255,0,255)");
 
  game.onload = function () {
    scene = new GameStartScene ();
    game.pushScene(scene);

    //スコアの表示
    var scoreLabel = new ScoreLabel(0, 16);
    //scoreLabel.scaleX = 3;
    //scoreLabel.scaleY = 3;
    scene.addChild(scoreLabel);

    scene.onenterframe = function(){
      scoreLabel.score = scoreCount;
    }

    //時間の表示
    var timeLabel = new TimeLabel (0, 0, 'countdown');
    //timeLabel.scaleX = 3;
    //timeLabel.scaleY = 3;
    timeLabel.time = 60;
    timeLabel.onenterframe = function () {
      if (timeLabel.time <= 0) {
        game.end(scoreLabel.score, scoreLabel.score + '点！', game.assets['end.png']);
      }
    }
    scene.addChild(timeLabel);
    
  }

  game.start();
}
 
 
 
//ゲーム画面
GameStartScene = enchant.Class.create(enchant.Scene, {
  initialize : function () {
    Scene.call(this);
    //変数の初期化
    dragOkFlg    = false;
    dragStartFlg = false;
    feverFlg = true;

    comboCount = 0;
    scoreCount = 0;


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
    chainCount = 1;

 
    //もしドラッグOKならドラッグスタート
    if(dragOkFlg){
      dragBlock = e.target;
      dragStartFlg = true;
      sameFlg = true;
      continuousFlg = true;
      nearbyFlg = false;
 
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

      //一個なら消さない
      if (chainCount == 1) {
        dragBlock.opacity = 1;
      }else{ 
        //コンボの判定
        if (chainCount >= 3) {
          comboCount ++;
        } else {
          comboCount = 0;
        }

        //フィーバーのコンボ数に達すればフィーバー突入
        if (comboCount >= feverCombo && feverFlg) {
          feverTime();
          removeLabel(comboLabel);
        }else{
          //半透明のものを削除
          for (var i = 0; i <= (block_COL * block_ROW) - 1; i++){
            if(blockList[i].opacity == 0.2){
              var block = blockList[i];
              block.opacity = 1;
              blockList[i] = null;
              //フィードアウトして消えるようにする
              block.tl.fadeOut(10).then(function(){
                scene.removeChild(this);
              });
            }
          }  
          //特点の加算
          if(sameFlg){
            scoreCount += ((comboCount * comboBouns) + ((chainCount - 1) * chainBouns)) * scoreBouns;
          } else if (continuousFlg){
            scoreCount += ((comboCount * comboBouns) + ((chainCount - 1) * chainBouns)) * scoreBouns * continuousBouns;
          }


          //消えたところにブロックを落とす
          dropBlock();

          if (comboCount >= 1) {
            createComboLabel();
          } else{
            removeLabel(comboLabel);
          }

        }  
      }  
    }  

    //確認
    console.log(comboCount + 'combo');
    console.log(chainCount + 'chain');
    console.log(scoreCount + '点');

  });
 

  //ドラッグ中のイベントを追加
  block.addEventListener('touchmove', function(e) {
    if(dragStartFlg){
      var dx = e.x;
      var dy = e.y;
 
      var nowX = Math.floor(dx / block_SIZE);
      var nowY = Math.floor((dy - 200) / block_SIZE);

      if (nowY < 0 || nowY > block_ROW || nowX < 0 || nowX > block_COL){
        return;
      }

      //タッチしているブロックがひとつ前と隣接しているか判断      
      if ((Math.abs(dragStartX - nowX) == 0 && Math.abs(dragStartY - nowY) == 1) || (Math.abs(dragStartX - nowX) == 1 && Math.abs(dragStartY - nowY) == 0) ){
      //同じ数かどうか判定 
        if (blockList[nowX + nowY * block_COL].no == blockList[dragStartX + dragStartY * block_COL].no && sameFlg){
          continuousFlg = false;
          //ドラッグしたブロックを透明化
          if (blockList[nowX + nowY * block_COL].opacity == 1){
            blockList[nowX + nowY * block_COL].opacity = 0.2;
            chainCount ++;
          //戻った場合透明化をなくす            
          }else if (blockList[nowX + nowY * block_COL].opacity == 0.2){
            blockList[dragStartX + dragStartY * block_COL].opacity = 1;
            chainCount --;
            //一個まで戻ったら連続数でも消せるようにする
            if(chainCount == 1){
              continuousFlg = true;
            }
          }

          //現在の座標をdragStartに代入
          dragStartX = nowX;
          dragStartY = nowY;

        //連続数の判定
        }else if (blockList[nowX + nowY * block_COL].no == blockList[dragStartX + dragStartY * block_COL].no + 1 && continuousFlg){
          sameFlg = false;
          //ドラッグしたブロックを透明化
          blockList[nowX + nowY * block_COL].opacity = 0.2;
          //現在の座標をdragStartに代入
          dragStartX = nowX;
          dragStartY = nowY;

          chainCount ++;
        //連続判定のときのやり直し  
        }else if (blockList[nowX + nowY * block_COL].no == blockList[dragStartX + dragStartY * block_COL].no - 1 && continuousFlg){
          sameFlg = false;
          //ドラッグした前のブロックの透明化を戻す
          if (blockList[nowX + nowY * block_COL].opacity == 0.2){
            blockList[dragStartX + dragStartY * block_COL].opacity = 1;
          }
          //現在の座標をdragStartに代入
          dragStartX = nowX;
          dragStartY = nowY;

          chainCount --;
          //一個まで戻ったら同じ数でも消せるようにする
          if(chainCount == 1){
            sameFlg = true;
          }          
        }
      }        
    }
  }); 
  return block;
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
              getBlock(x,y).tl.moveBy(0, count * block_SIZE, 10);
            }
          //画面外なので新しく作る
          }else{
            flg = false;
            //画面外なので新しくつくる
            maxCount++;
            var block = createBlock(scene,x,y);
            block.y = block_SIZE * (y - count - maxCount + 1) + 200;
            block.tl.moveBy(0, (count + maxCount - 1) * block_SIZE, 10);
            
          }
        }
      }
    }
  }
}
 
//フィーバーの内容
function feverTime() {
  //定数をフィーバーの数字に変える
  block_NUM = fever_NUM;
  bouns = feverBouns;
  comboCount = 0;
  feverFlg = false;

  console.log('FEVER TIME !');

  //ブロックのリセット
  resetBlock(); 

//     var feverLabel = new Label('FEVER TIME !');
      feverLabel.text = 'FEVER TIME !';
      feverLabel.font = "48px monospace"; 
      feverLabel.color = "rgb(255,255,0)";
      feverLabel.x = (background_WIDTH - feverLabel.width) / 2;  //feverLabel.width = 300;
      feverLabel.y = 112;
      feverLabel.chick = 0;
      feverLabel.colorNo = 0;
      scene.addChild(feverLabel);
 
      feverLabel.addEventListener(Event.ENTER_FRAME,function(){
      //きらきらさせる
      feverLabel.chick++;
        if(feverLabel.chick % 1 == 0){
          feverLabel.colorNo++; 
          feverLabel.colorNo %= ColorList.length;
          feverLabel.color = ColorList[feverLabel.colorNo];
        }
      });

  setTimeout ('feverEnd()', fever_TIME);  //何秒か後にフィーバーを終了させる
}

//フィーバーを終わらせる関数
function feverEnd() {
  //定数をもとに戻す
  block_NUM = normal_NUM;
  bouns = 1;
  comboCount = 0;
  feverFlg = true;

  scene.removeChild(feverLabel);
  //ブロックのリセット
  resetBlock();

  console.log('FEVER END');
}

//ブロックのリセット
function resetBlock(){
  //ブロックの削除
  for (var k = 0; k <= (block_ROW * block_COL) - 1; k++){
    block = blockList[k];
    blockList[k] = null;
    block.tl.fadeOut(10).then(function(){
      scene.removeChild(this);
    }); 
  }
  //ブロックの再生成
  dropBlock();

}

//コンボラベルの生成
function createComboLabel() {

      comboLabel.text = comboCount +'combo';
      comboLabel.font = "48px monospace"; 
      comboLabel.color = "rgb(255,255,0)";
      comboLabel.x = 144;
      comboLabel.y = 48;

      scene.addChild(comboLabel);
      
}




function removeLabel(Label) {
        scene.removeChild(Label);
} 
 
// ブロックの取得
function getBlock(x,y){
  return blockList[x + y * block_COL];
}
 
 
//ランダム関数
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
