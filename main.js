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

-------------------14/07/11--------------------------
実装内容
・画像を新しいものに変更（トップ、数字ブロック、ゲーム背景、結果背景）
・topと結果のシーンを追加し、シーン間を遷移するように設定。

問題点
・ラベルに幅があるようで、それを超える文字数を表示できない
・game.startとgame.endがよく理解できていない
・スコアと時間
を作った背景画像の部分に表示したいがよくわからない

上記の問題点が改善できなかった場合発表に支障が出るため、
・game.start→ゲーム→game.end→スコア表示
・スコアと時間もデフォルトのものを使用
というものを発表物の保険として作成しておきたいと思います。

-------------------14/07/12--------------------------
実装内容
・トップと結果画像の追加
・最後にボーナススコアを追加
・スコアと時間の表記を変更
・ゲーム難易度を調整

*/

enchant();
 
//画像の設定
var block_IMG = "numberBlock2.png";      //ブロックの画像
var background_IMG  = "background.png";  //タイルの画像
var start_IMG = "startscene.png";        //スタート画面
var result_IMG = "result.png";           //結果画面
var timeup_IMG = "timeup.png";           //時間切れ画面
 
//定数の設定
var background_WIDTH = 640;   //背景の横幅
var background_HIGHT = 1136;  //背景の縦幅
var ad_HIGHT   = 120;         //下の広告の幅
var block_SIZE = 80;          //ブロックのサイズ
var normal_NUM = 6;           //通常時の最大数
var block_COL  = 8;           //ブロックの配置する数横
var block_ROW  = 8;           //ブロックの配置する数縦
var block_NUM  = normal_NUM;  //ブロックの最大数 
var limitTime  = 60;          //制限時間 

//ドラッグ情報
var dragOkFlg;                //ドラッグしていいか
var dragStartFlg;             //ドラッグを開始したフラグ
var dragStartX;               //ドラッグを開始したx座標
var dragStartY;               //ドラッグを開始したy座標
var dragBlock;                //ドラッグ中のブロック
var nearbyFlg;                //隣接しているかどうかのフラグ

//パズルの判定
var sameFlg;                  //同じ数字かどうかのフラグ
var continuousFlg;            //連続数かどうかのフラグ
var feverFlg;                 //フィーバータイムの判定フラグ
 
var blockList;                //ブロックを収納する配列
var moveblockList;            //ドラッグされたブロックを収納する配列
var comboLabel = Label();     //コンボの表示
var feverLabel = Label();     //フィーバーの表示

//得点のボーナス
var scoreBouns = 1;           //スコアのボーナス
var comboBouns = 100;         //コンボで増えるスコアのボーナス
var chainBouns = 1000;        //連結で増えるボーナス
var continuousBouns = 3;      //連続数を消した時のボーナス
var lastfeverBouns  = 50000;  //最後のフィーバーの回数で決まるボーナス
var lastcomboBouns  = 10000;   //最後の最大コンボ数でかかるボーナス

//カウント
var scoreCount = 0;           //スコアをカウント
var comboCount = 0;           //コンボをカウント
var chainCount = 0;           //一度に消した数をカウント
var fevercount = 0;           //フィーバーの回数を記憶   
var maxcombocount = 0;        //最大コンボを記憶

//フィーバーの設定数字
var feverBouns = 5;           //フィーバー時の得点のボーナス倍率
var feverCombo = 10;          //フィーバーに入るためのコンボ数
var fever_NUM  = 2;           //フィーバー時の最大数
var fever_TIME = 10000;       //フィーバーの時間(ms)
 

 
window.onload = function () {
  game = new Core (background_WIDTH, background_HIGHT);
  game.fps = 24;
  game.preload(block_IMG, background_IMG, start_IMG, result_IMG, timeup_IMG);
  //点滅させる色を格納
  ColorList = new Array("rgb(255,0,0)","rgb(255,255,0)","rgb(0,255,0)","rgb(0,255,255)","rgb(0,0,255)","rgb(255,0,255)");
 
  game.onload = function () {
    //スタート画面作成
    var startscene = new Sprite (background_WIDTH, background_HIGHT);
    startscene.image = game.assets[start_IMG];
    game.rootScene.addChild(startscene);

    //ゲーム、結果画面、時間切れ画面の作成
    gamescene = new GameStartScene();
    resultscene = new ResultScene();

    //タッチするとゲームスタート
    game.rootScene.addEventListener('touchstart', function() {
      game.pushScene(gamescene);
      Time();
      Score();
    }); 

  }
  game.start();
}


//スコアの表示
function Score(){
    //スコアの表示
    var scoreLabel = new ScoreLabel(0, 0);
    scoreLabel.x = ((352 - scoreLabel.width) / 2) + 272;
    scoreLabel.y = ((80 - scoreLabel.height) / 2) + 96;  
    scoreLabel.label = ' ';
    scoreCount = 0;
    scoreLabel.scaleX = 3;
    scoreLabel.scaleY = 3;
    gamescene.addChild(scoreLabel);

    gamescene.onenterframe = function(){
      scoreLabel.score = scoreCount;
    }  
}


//制限時間の表示
function Time(){
    //時間の表示
    timeLabel = new TimeLabel (0, 0, 'countdown');
    timeLabel.x = ((240 - timeLabel.width) / 2) + 16;
    timeLabel.y = ((80 - timeLabel.height) / 2) + 96;  
    timeLabel.label = '';    
    timeLabel.scaleX = 3;
    timeLabel.scaleY = 3;
    timeLabel.time = limitTime;
    gamescene.addChild(timeLabel);

    //制限時間で終了
    timeLabel.onenterframe = function () {
      if (timeLabel.time <= 0) {
        timeLabel._count = 0;       //カウントダウンを止める
        timeLabel.time = 0;         //綺麗に０秒で止める
        dragStartFlg = false;
        dragOkFlg = false;
            console.log(resultFlg);
        TimeUp();
      } 
    }        

}
//タイムアップ時に表示
function TimeUp(){
    var timeupscene = new Sprite(background_WIDTH, background_HIGHT);
    timeupscene.image = game.assets[timeup_IMG];
    gamescene.addChild(timeupscene);

    setTimeout("resultFlg = true", 2000);

    if(resultFlg){
      timeupscene.addEventListener('touchstart', function() {
        Result();                          //ゲーム画面をレセット
        game.replaceScene(resultscene);  
      }); 
    } 
}

 
//ゲーム画面
GameStartScene = enchant.Class.create(enchant.Scene, {
  initialize : function () {
    Scene.call(this);
    //変数の初期化
    dragOkFlg    = false;
    dragStartFlg = false;
    feverFlg     = true;
    resultFlg = false;
    console.log(resultFlg);
    //背景の生成
    var tile = new Sprite (background_WIDTH, background_HIGHT);
    tile.image = game.assets[background_IMG];
    this.addChild(tile);

    
 
    //配列を作成しブロックを配置
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
  var block = new Sprite(block_SIZE, block_SIZE);   //ブロックのサイズ
  block.image = game.assets[block_IMG];             //ブロックの画像
  var no = rand(0, block_NUM - 1);
  block.no    = no;                                 //ブロックの数字
  block.frame = no;                                 //ブロックの画像番号
  block.x     = block_SIZE * x;
  block.y     = block_SIZE * y + background_HIGHT - (block_SIZE * block_ROW + ad_HIGHT);
  stage.addChild(block);
  blockList[x + y * block_COL]  = block;
 
  //タッチを開始した時のイベントを追加
  block.addEventListener('touchstart', function(e) {
    chainCount = 1;

    //もしドラッグOKならドラッグスタート
    if(dragOkFlg){
      dragBlock = e.target;
      dragStartFlg  = true;
      sameFlg       = true;
      continuousFlg = true;
      nearbyFlg     = false;
 
      dragStartX = Math.floor(e.target.x / block_SIZE);
      dragStartY = Math.floor((e.target.y - (background_HIGHT - (block_SIZE * block_ROW) - ad_HIGHT)) / block_SIZE);
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
        //3個以上つながっていたらコンボに追加
        if (chainCount >= 3) {
          comboCount ++;
        } else {
          comboCount = 0;
        }
        
        if (comboCount > maxcombocount){
          maxcombocount = comboCount;
        }
        

        //フィーバーのコンボ数に達すればフィーバー突入
        if (comboCount >= feverCombo && feverFlg) {
          feverTime();
        }else{
          //半透明のものを削除
          for (var i = 0; i <= (block_COL * block_ROW) - 1; i++){
            if(blockList[i].opacity == 0.2){
              var block = blockList[i];
              block.opacity = 1;
              blockList[i] = null;
              //フィードアウトして消えるようにする
              block.tl.fadeOut(10).then(function(){
                gamescene.removeChild(this);
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

          //コンボの表示
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
    console.log('max' + maxcombocount + 'combo');

  });
 

  //ドラッグ中のイベントを追加
  block.addEventListener('touchmove', function(e) {
    if(dragStartFlg){
      var dx = e.x;
      var dy = e.y;
 
      var nowX = Math.floor(dx / block_SIZE);
      var nowY = Math.floor((dy - (background_HIGHT - (block_SIZE * block_ROW) - ad_HIGHT)) / block_SIZE);


      //画面外をタッチしているか確認
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
            var block = createBlock(gamescene,x,y);
            block.y = block_SIZE * (y - count - maxCount + 1) + (background_HIGHT - (block_SIZE * block_ROW) - ad_HIGHT);
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
  fevercount ++;

  //ブロックのリセット
  resetBlock(); 
  //コンボラベルの消去
  removeLabel(comboLabel);

  feverLabel.text = 'FEVER TIME!'
  feverLabel.font = "80px monospace"; 
  feverLabel.color = "rgb(255,255,0)";
  feverLabel.width = 480;
  feverLabel.x = (background_WIDTH - feverLabel.width) / 2;  
  feverLabel.y = 286;
  feverLabel.chick = 0;
  feverLabel.colorNo = 0;
  gamescene.addChild(feverLabel);

  //きらきらさせる 
  feverLabel.addEventListener(Event.ENTER_FRAME,function(){
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

  //フィーバーの表示を消去
  gamescene.removeChild(feverLabel);
  //ブロックのリセット
  resetBlock();
}


//ブロックのリセット
function resetBlock(){
  //ブロックの削除
  for (var k = 0; k <= (block_ROW * block_COL) - 1; k++){
    block = blockList[k];
    blockList[k] = null;
    block.tl.fadeOut(10).then(function(){
      gamescene.removeChild(this);
    }); 
  }
  //ブロックの再生成
  dropBlock();

}

//コンボラベルの生成
function createComboLabel() {

  comboLabel.text = comboCount +' combo';
  comboLabel.font = "64px monospace"; 
  comboLabel.color = "rgb(255,255,0)";
  comboLabel.width = 320;
  comboLabel.x = ((background_WIDTH - comboLabel.width) / 2);
  comboLabel.y = 176;

  gamescene.addChild(comboLabel);      
}





//結果画面
ResultScene = enchant.Class.create(enchant.Scene, {
  initialize : function () {
    Scene.call(this);

    //背景の生成
    var resultscene = new Sprite (background_WIDTH, background_HIGHT);
    resultscene.image = game.assets[result_IMG];
    this.addChild(resultscene);

    myLabel(40, 320, this, '#fff', 'SCORE');
    myLabel(40, 400, this, '#ff0', 'BOUNS POINT')
    myLabel(40, 480, this, '#fff', 'MAX COMBO');
    myLabel(40, 560, this, '#fff', 'FEVER');
    myLabel(40, 720, this, '#f00', 'TOTAL SCORE');  

    //リプレイボタン
    var replayButton = new Sprite(240, 80);
    replayButton.x = 40;
    replayButton.y = 860;
    replayButton.opacity = 0;
    this.addChild(replayButton);

    //リプレイボタンをおした時の操作
    replayButton.addEventListener('touchstart', function() {
      game.replaceScene(gamescene);
      Time();
      Score();
      ResetResult();
    });    

    //トップに戻るボタン
    var topButton = new Sprite(240, 80);
    topButton.x = 360;
    topButton.y = 860;
    topButton.opacity = 0;
    this.addChild(topButton);

    //トップボタンをおした時の操作
    topButton.addEventListener('touchstart', function() {
      ResetResult();
      game.popScene(resultscene);
    });    
    
  }  
});


//スコア結果の計算
function Result() {
  //ゲーム画面をリセット
  ResetGame();

  //合計スコアを計算
  totalscore = scoreCount + (fevercount * lastfeverBouns) + (maxcombocount * lastcomboBouns) ;

  myLabel(480, 320, resultscene, '#ff0', scoreCount);
  myLabel(280, 480, resultscene, '#0f0', maxcombocount + ' combo');
  myLabel(280, 560, resultscene, '#0f0', fevercount + ' 回');
  myLabel(480, 480, resultscene, '#ff0', maxcombocount * lastcomboBouns);
  myLabel(480, 560, resultscene, '#ff0', fevercount * lastfeverBouns);
  myLabel(480, 720, resultscene, '#f00', totalscore);  

}

//ゲーム画面のリセット
function ResetGame () {
  gamescene = null; 
  gamescene = new GameStartScene();
}

//結果画面のリセット
function ResetResult () {
  resultscene = null; 
  resultscene = new ResultScene();
}


//ラベルの作成
function myLabel (x, y, stage, color, text ){
  var label = new Label();
  label.text = text;
  label.width = 640;
  label.font = "32px monospace";
  label.color = color;
  label.x = x;
  label.y = y;
  stage.addChild(label); 

  return label;
}


//ラベルの消去
function removeLabel(Label) {
  gamescene.removeChild(Label);
} 

 
// ブロックの取得
function getBlock(x,y){
  return blockList[x + y * block_COL];
}
 
 
//ランダム関数
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
