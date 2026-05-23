const {ccclass, property} = cc._decorator;
declare const firebase: any;

@ccclass
export default class LevelSelectController extends cc.Component {

    @property(cc.Node)
    ruleWindow: cc.Node = null;

    @property(cc.Node)
    blocker: cc.Node = null; // 剛剛做的隱形遮罩

    @property(cc.Node)
    btnStage1: cc.Node = null;

    @property(cc.Node)
    btnStage2: cc.Node = null;

    @property(cc.Label)
    userNameLabel: cc.Label = null;

    @property(cc.Node)
    gameStartScreen: cc.Node = null;

    // 用來記錄第一關是否過關 (未來可以從全域變數或存檔讀取)
    // 現在先預設為 false 來測試反灰效果
    private isStage1Cleared: boolean = false; 

    onLoad() {
        // 遊戲一開始：隱藏 Rule 視窗與遮罩
        this.ruleWindow.active = false;
        this.blocker.active = false;
        this.gameStartScreen.active = false;

        // 檢查第二關的解鎖狀態
        this.checkStage2Lock();
        this.fetchPlayerName();
    }

    private fetchPlayerName() {
        if (typeof firebase !== 'undefined') {
            // onAuthStateChanged 會自動偵測目前登入的使用者
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    // 如果有登入，把名字抓出來 (如果有 displayName 就用，沒有就預設叫 PLAYER)
                    let pName = user.displayName ? user.displayName : "PLAYER";
                    
                    // 為了配合復古風格，強制把它轉成大寫！
                    this.userNameLabel.string = pName.toUpperCase();
                } else {
                    // 如果沒登入(可能玩家直接偷開這頁)，把文字變成 GUEST，或者你可以讓他跳回標題畫面
                    this.userNameLabel.string = "USER: GUEST";
                }
            });
        }
    }

    // 處理 Stage 2 按鈕的上鎖狀態
    private checkStage2Lock() {
        let btn2Comp = this.btnStage2.getComponent(cc.Button);
        
        if (!this.isStage1Cleared) {
            // 上鎖狀態：按鈕失效，且強制染成灰色
            btn2Comp.interactable = false;
            this.btnStage2.color = cc.Color.GRAY;
        } else {
            // 解鎖狀態：按鈕恢復正常
            btn2Comp.interactable = true;
            this.btnStage2.color = cc.Color.WHITE; 
        }
    }

    // 當右上角的「？」按鈕被點擊時觸發
    public onHelpButtonClicked() {
        // 如果現在是開著的，就關掉；如果是關著的，就打開
        if (this.ruleWindow.active) {
            this.closeRuleWindow();
        } else {
            this.openRuleWindow();
        }
    }

    // 打開規則視窗
    private openRuleWindow() {
        this.ruleWindow.active = true;
        this.blocker.active = true;   // 開啟遮罩阻擋背景點擊
        this.btnStage1.active = false; // 隱藏關卡按鈕
        this.btnStage2.active = false;
    }

    // 關閉規則視窗 (提供給 Blocker 跟「？」按鈕使用)
    public closeRuleWindow() {
        this.ruleWindow.active = false;
        this.blocker.active = false;
        this.btnStage1.active = true;
        this.btnStage2.active = true;
    }

    // 未來破關後可以呼叫這個 function 來解鎖第二關
    public unlockStage2() {
        this.isStage1Cleared = true;
        this.checkStage2Lock();
    }

    // 新增：當玩家點擊 Stage 1 按鈕時觸發
    public onStage1Clicked() {
        // 1. 顯示過場畫面 (蓋住整個選關介面)
        this.gameStartScreen.active = true;

        // 2. 設定一個 2 秒的計時器，時間到就跳轉場景
        this.scheduleOnce(() => {
            cc.director.loadScene("GameView");
        }, 2);
    }
}