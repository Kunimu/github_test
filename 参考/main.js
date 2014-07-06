enchant();

//--------------------画像情報-----------------------------
var STAMP_IMG = "buttons.png";    // 肉球画像
var TILE_IMG  = "tile.png";     // タイル画像

var COLOR_LIST = new Array("rgb(253,150,150)","rgb(184,238,251)","rgb(247,251,184)","rgb(90,115,85)","rgb(217,152,255)","rgb(90,115,85)");
var game;
var scene;                // 現在表示しているシーン
var effectScene;            // ゲームエフェクトシーン　
//--------------------定数-----------------------------
var STAGE_WIDTH  = 480;   // 画面横サイズ
var STAGE_HEIGHT = 600;   // 画面縦サイズ
var STAMP_SIZE   = 80;    // スタンプ画像サイズ
var STAMP_KIND   = 6;     // スタンプの種類の数
var STAMP_COL    = 6;     // 横に配置する数
var STAMP_ROW    = 5;     // 縦に配置する数

//--------------------ドラッグ情報----------------------------------
var dragOkFlg;            //ドラッグしてOKかどうか
var dragStartFlg;         //ドラッグ開始フラグ
var dragStartPosX;          //ドラッグ開始したX
var dragStartPosY;          //ドラッグ開始したY
var cloneStamp;           //ドラッグ中のスタンプのコピー
var dragStamp;            //ドラッグ中のスタンプ
var changeFlg;            //ドラッグでスタンプが入れ替わったかどうか

//--------------------コンボ情報----------------------------------
var comboCount;           //コンボの数　一回のチェックのコンボ
var comboLabelList;         //コンボ表示ラベルのリスト
var totalCombo;           //トータルコンボ数　トータルのコンボの数かぶりも含む
var sameComboNoList;        //かぶったコンボのリスト
var nowComboNo = 0;         //現在表示中のコンボNo かぶり含まず実際の最終的なコンボ数
var comboTextPos;         //コンボ表示位置のリスト
var comboColorList;         //コンボのカラーの色


//--------------------ステージ情報-----------------------------
var stampList;            //画面のスタンプのリスト
var sameComboNoList;        //かぶったコンボのリスト

window.onload = function(){
  comboColorList = new Array("rgb(255,0,0)","rgb(255,255,0)","rgb(0,255,0)","rgb(0,255,255)","rgb(0,0,255)","rgb(255,0,255)");
  
  game = new Game(STAGE_WIDTH, STAGE_HEIGHT);
  game.fps = 24;
  game.preload(STAMP_IMG, TILE_IMG);

  game.rootScene.backgroundColor = "black";
  game.onload = function(){
    scene = new GameStartScene();
    game.pushScene(scene);
  }
    game.start();
};

//ゲーム画面
GameStartScene = enchant.Class.create(enchant.Scene, {
  initialize: function () {
    Scene.call(this);
    // 変数初期化
    dragOkFlg    = false;
    dragStartFlg = false;
    changeFlg    = false;
    
    //背景の生成
    var tile = new Sprite(STAGE_WIDTH, 400);
    tile.image = game.assets[TILE_IMG];
    tile.y = STAGE_HEIGHT - 400;
    this.addChild(tile);
    
    //配列作成
    stampList = new Array();
    for(var y = 0; y < STAMP_ROW; y++){
      for(var x = 0; x < STAMP_COL; x++){
        createStamp(this,x,y);
      }
    }
    
    //ドラッグする実際のオブジェクト
    cloneStamp = new Sprite(STAMP_SIZE,STAMP_SIZE);
    cloneStamp.image = game.assets[STAMP_IMG];
    cloneStamp.visible = false;
    cloneStamp._style.zIndex = 9999;
    this.addChild(cloneStamp);
    
    dragOkFlg = true;
  }
});


//スタンプ作成
function createStamp(stage,x,y){
  var stamp = new Sprite(STAMP_SIZE,STAMP_SIZE);  // スタンプサイズ指定
  stamp.image = game.assets[STAMP_IMG];     // スタンプ画像設定
  var no = rand(0,STAMP_KIND - 1);
  stamp.no          = no;             // 属性番号
  stamp.frame       = no              // 画像番号
  stamp.comboNo     = 0;              // コンボNo
  stamp.comboColFlg = false;            // コンボ横
  stamp.comboRowFlg = false;            // コンボ縦
  stamp.x           = STAMP_SIZE * x;
  stamp.y           = STAMP_SIZE * y + STAGE_HEIGHT - 400;
  stage.addChild(stamp);
  stampList[x + y * STAMP_COL] = stamp;
  stamp.addEventListener(Event.TOUCH_START, function(e) {
    //ドラッグしてもOKな状態だったらドラッグ開始
    if(dragOkFlg){
      comboCount = 1;
      nowComboNo = 0;
      dragStamp = e.target;
      dragStartFlg = true;
      changeFlg = false;
      
      comboTextPos = new Array();
      comboLabelList = new Array();
      dragStartPosX = Math.floor(e.target.x / STAMP_SIZE);
      dragStartPosY = Math.floor((e.target.y - 200) / STAMP_SIZE);
      e.target.opacity = 0.2;
      
      //クローンのほうを動かす
      cloneStamp.frame   = e.target.frame;
      cloneStamp.x       = e.target.x;
      cloneStamp.y       = e.target.y;
      cloneStamp.visible = true;
    }
  });
  stamp.addEventListener(Event.TOUCH_END, function(e) {
    if(dragOkFlg){
      totalCombo = 0;
      dragStartFlg = false;
      dragOkFlg = true;
      dragStamp.opacity = 1;
      cloneStamp.visible = false;
      if(changeFlg){
        //スタンプが動いていたらコンボ判定
        checkStamp();
      }else{
        dragOkFlg = true;
      }
    }
  });
  stamp.addEventListener(Event.TOUCH_MOVE,function(e){
    if(dragOkFlg){
      var dx = e.x;
      var dy = e.y;
      
      cloneStamp.x = dx - STAMP_SIZE / 2;
      cloneStamp.y = dy - STAMP_SIZE / 2;

      var nowX = Math.floor(dx / STAMP_SIZE);
      var nowY = Math.floor((dy - 200)/ STAMP_SIZE);
      //入れ替わってたら入れ替える
      if(dragStartPosX !== nowX || dragStartPosY !== nowY){
        changeFlg = true;
        var moveStamp = stampList[nowX + nowY * STAMP_COL];
        moveStamp.x = dragStartPosX * STAMP_SIZE;
        moveStamp.y = dragStartPosY * STAMP_SIZE + 200;
        dragStamp.x = nowX * STAMP_SIZE;
        dragStamp.y = nowY * STAMP_SIZE + 200;

        stampList[nowX + nowY * STAMP_COL] = stampList[dragStartPosX + dragStartPosY * STAMP_COL];
        stampList[dragStartPosX + dragStartPosY * STAMP_COL] = moveStamp;
        dragStartPosX = nowX;
        dragStartPosY = nowY;
      }
    }
  });
  return stamp;
}

//コンボ判定
function checkStamp(){
  for(var y = 0; y < STAMP_ROW; y++){
    for(var x = 0; x < STAMP_COL; x++){
      var count = 1;    //いくつ連続でつながっているか
      var flg = true;   //whileループ用のフラグ
      var nowCheckBaseStamp = getStamp(x,y);  //チェック中スタンプ
      //右のチェック
      while(flg){
        //画面範囲内の場合チェック
        if(x + count < STAMP_COL){
          var nowCheckTargetStamp = getStamp(x + count,y);  //比較対象スタンプ
          //一致の場合さらに右もチェック
          if(nowCheckBaseStamp.no === nowCheckTargetStamp.no){
            count++;
          }else{
            flg = false;
            //二個以上つながっていたらコンボに追加
            if(count >2){
              addCombo(x,y,count,true);
            }
            count = 1;
          }
        }else{
          flg = false;
          if(count >2){
            addCombo(x,y,count,true);
          }
          count = 1;
        }
      }
      //下のチェック
      flg = true;
      while(flg){
        //画面範囲内の場合チェック
        if(y + count < STAMP_ROW){
          var nowCheckTargetStamp = stampList[x + ((y + count)* STAMP_COL)];  //比較対象スタンプ
          //一致の場合さらに右もチェック
          if(nowCheckBaseStamp.no === nowCheckTargetStamp.no){
            count++;
          }else{
            flg = false;
            //二個以上つながっていたらコンボに追加
            if(count >2){
              addCombo(x,y,count,false);
            }
            count = 1;
          }
        }else{
          flg = false;
          if(count >2){
            addCombo(x,y,count,false);
          }
          count = 1;
        }
      }
    }
  }
  if(comboCount > 1){
    showCombo(totalCombo,1);        //コンボ表示
  }else{
    //コンボ完了
    
    // コンボラベルの削除
    if(comboLabelList.length !== 0){
      for(var j = 0; j < comboLabelList.length; j++){
        comboLabelList[j].tl.scaleTo(1.3,1.3,10).then(function(){
          scene.removeChild(this);
        });
      }
    }
  }
}

//コンボ表示
function showCombo(totalCombo,combo){
  var comboLableX = 0;
  var comboLableY = 0;
  var count = 0;    //消えた数　0の場合は同じコンボになったからラベル減らす
  var removeKind = 0; //消えた種類
  for(var y = 0; y < STAMP_ROW; y++){
    for(var x = 0; x < STAMP_COL; x++){
      var stamp = getStamp(x,y);
      //nullの場合はすでにコンボで消えてるからチェックしなくていい
      if(stamp !== null){
        if(stamp.comboNo == combo){
          removeKind = stamp.no;
          stampList[x + y * STAMP_COL] = null;
          stamp.tl.fadeOut(10).then(function(){
            scene.removeChild(this);
          });
          comboLableX = stamp.x;
          comboLableY = stamp.y - 40;
          count++;
        }
      }
    }
  }

  if(count !== 0){
    nowComboNo++;
    //コンボラベル表示
    if(combo+ totalCombo > 0){
      //ラベルの生成
      var comboLabel = new Label(nowComboNo +'combo');
      comboLabel.font = "26px monospace";
      comboLabel.color = "rgb(255,255,0)";
      //中心位置の座標取得
      var str = comboTextPos[combo + totalCombo - 1];
      var strList = str.split(",");
      comboLabel.x = eval(strList[0]);
      comboLabel.y = eval(strList[1]) + 30;
      comboLabel.chick = 0;
      comboLabel.colorNo = 0;
      comboLabel.originX = 50;
      comboLabel.originY = 50;
      comboLabel.scaleX = 1.3;
      comboLabel.scaleY = 1.3;
      scene.insertBefore(comboLabel,cloneStamp);
      scene.addChild(comboLabel);

      comboLabelList.push(comboLabel);
      comboLabel.tl.fadeIn(10).and().moveBy(0,-40,8,enchant.Easing.QUAD_EASEOUT).and().scaleTo(1,10).moveBy(0,10,5);

      comboLabel.addEventListener(Event.ENTER_FRAME,function(){
        //きらきらさせる
        comboLabel.chick++;
        if(comboLabel.chick % 1 == 0){
          comboLabel.colorNo++;
          comboLabel.colorNo %= comboColorList.length;
          comboLabel.color = comboColorList[comboLabel.colorNo];
        }
      });
    }
  }
  //次のコンボの表示
  scene.tl.delay(25).then(function(){
    combo++;
    if(combo < comboCount){
      showCombo(totalCombo,combo);
    }else{
      // コンボ終了
      showComboEnd();
    }
  });
}

//コンボ表示終了
function showComboEnd(){
  dropStamp();            //新しいの落とす
  
  totalCombo += comboCount - 1;

  scene.tl.delay(20).then(function(){
    comboCount = 1;

    checkStamp();           //再起呼び出ししてもらう
  });
  
}

//消えた分を補充する 下からずらしてく
function dropStamp(){
  for(var x = 0; x < STAMP_COL; x++){
    var maxCount = 0; //画面外の何個目か
    for(var y = STAMP_ROW - 1; y >= 0; y--){
      var stamp = getStamp(x,y);
      //空だったらずらす
      if(stamp == null){
        var flg = true;   //whileようフラグ
        var count = 1;    //何こ上までからか
        while(flg){
          //上が画面内か判定
          if( y - count >= 0){
            //上もからっぽ
            if(getStamp(x,y-count) == null){
              count++;
            }else{
              //ずらす
              flg = false;
              stampList[x + y * STAMP_COL] = getStamp(x,y-count);
              stampList[x + (y - count) * STAMP_COL] = null;
              getStamp(x,y).tl.moveBy(0,count * STAMP_SIZE,10);
            }
          //画面外なので新しく作る
          }else{
            flg = false;
            //画面外なので新しくつくる
            maxCount++;
            //var stamp = createStamp(scene,x,y - count - maxCount + 1);
            var stamp = createStamp(scene,x,y);
            stamp.y = STAMP_SIZE * (y - count - maxCount + 1) + 200;
            stamp.tl.moveBy(0,(count + maxCount - 1) * STAMP_SIZE,10);
          }
        }
      }
    }
  }
}

//コンボに追加 count つながってた数 colFlg よこかたてか
function addCombo(x,y,count,colFlg){
  var checkFlg = true;          //コンボ調査必要かどうか
  var nowX = x;
  var nowY = y;
  var targetComboCount = comboCount;    //追加するコンボ番号
  
  sameComboNoList = new Array();    //すでにコンボのとこにつながったときのどこのコンボにつながったかの配列
  //コンボに追加
  for(var i = 0; i < count; i++){
    if(i !== 0){
      if(colFlg){
        nowX += 1;
      }else{
        nowY += 1;
      }
    }
    var nowStamp = stampList[nowX + nowY * STAMP_COL];

    //すでにコンボに含まれてたらそこに追加
    if(nowStamp.comboNo !== 0){
      sameComboNoList.push(nowStamp.comboNo);
      targetComboCount = nowStamp.comboNo;
      //たてのコンボでかつたてのコンボのチェックだったらチェック要らない
      if(nowStamp.comboRowFlg && !colFlg){
        checkFlg = false;
      }else if(nowStamp.comboColFlg && colFlg){
        checkFlg = false;
      }
    }
  }
  
  //新しいコンボか既にあるところに追加
  if(checkFlg){
    if(targetComboCount == comboCount){
      comboCount++;
      //コンボテキストの位置設定
      var labelX = 0;
      var labelY = 0;
      if(colFlg){
        labelX = (x + count / 2) * STAMP_SIZE - (STAMP_SIZE / 2);
        labelY = (y * STAMP_SIZE) + 200 + (STAMP_SIZE / 4);
        comboTextPos.push(labelX + ',' + labelY);
      }else{
        labelX = (x * STAMP_SIZE) + (STAMP_SIZE / 2) - (STAMP_SIZE / 2);
        labelY = (y + count / 2) * STAMP_SIZE + 200;
        comboTextPos.push(labelX + ',' + labelY);
      }
    }
    nowX = x;
    nowY = y;
    //コンボに追加
    for(var i = 0; i < count; i++){
      if(i !== 0){
        if(colFlg){
          nowX += 1;
        }else{
          nowY += 1;
        }
      }
      var nowStamp = stampList[nowX + nowY * STAMP_COL];

      //コンボに追加
      nowStamp.comboNo = targetComboCount;
      if(colFlg){
        nowStamp.comboColFlg = true;
      }else{
        nowStamp.comboRowFlg = true;
      }
    }
  }
  //もし2個以上つながった場合はそれも同じコンボにまとめる
  if(sameComboNoList.length > 1){
    changeSameComboStamp();
  }
}


//配列のなかのコンボばんめが同時にきえるので同じコンボにまとめる
function changeSameComboStamp(){
  var sameComboNo = sameComboNoList[0];   //0番目のコンボ数にすべてあわせる
  for(var i = 1; i < sameComboNoList.length; i++){
    for(var y = 0; y < STAMP_ROW; y++){
      for(var x = 0; x < STAMP_COL; x++){
        var stamp = getStamp(x,y);
        if(stamp.comboNo == sameComboNoList[i]){

          stamp.comboNo = sameComboNoList[0];
        }
      }
    }
  }
}

// スタンプの取得
function getStamp(x,y){
  return stampList[x + y * STAMP_COL];
}

// ランダム関数
function rand(min,max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

