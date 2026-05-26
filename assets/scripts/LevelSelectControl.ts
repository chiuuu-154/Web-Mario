const {ccclass, property} = cc._decorator;
declare const firebase: any;

@ccclass
export default class LevelSelectController extends cc.Component {

    @property(cc.Node)
    ruleWindow: cc.Node = null;

    @property(cc.Node)
    blocker: cc.Node = null; 

    @property(cc.Node)
    btnStage1: cc.Node = null;

    @property(cc.Node)
    btnStage2: cc.Node = null;

    @property(cc.Label)
    userNameLabel: cc.Label = null;

    // ❌ 已經刪除 gameStartScreen 變數宣告

    private isStage1Cleared: boolean = false; 

    onLoad() {
        this.ruleWindow.active = false;
        this.blocker.active = false;
        // ❌ 已經刪除 gameStartScreen.active = false;

        this.checkStage2Lock();
        this.fetchPlayerName();
    }

    private fetchPlayerName() {
        if (typeof firebase !== 'undefined') {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    let pName = user.displayName ? user.displayName : "PLAYER";
                    this.userNameLabel.string = pName.toUpperCase();
                } else {
                    this.userNameLabel.string = "USER: GUEST";
                }
            });
        }
    }

    private checkStage2Lock() {
        let btn2Comp = this.btnStage2.getComponent(cc.Button);
        
        if (!this.isStage1Cleared) {
            btn2Comp.interactable = false;
            this.btnStage2.color = cc.Color.GRAY;
        } else {
            btn2Comp.interactable = true;
            this.btnStage2.color = cc.Color.WHITE; 
        }
    }

    public onHelpButtonClicked() {
        if (this.ruleWindow.active) {
            this.closeRuleWindow();
        } else {
            this.openRuleWindow();
        }
    }

    private openRuleWindow() {
        this.ruleWindow.active = true;
        this.blocker.active = true;   
        this.btnStage1.active = false; 
        this.btnStage2.active = false;
    }

    public closeRuleWindow() {
        this.ruleWindow.active = false;
        this.blocker.active = false;
        this.btnStage1.active = true;
        this.btnStage2.active = true;
    }

    public unlockStage2() {
        this.isStage1Cleared = true;
        this.checkStage2Lock();
    }

    // 🌟 核心修改：點擊後瞬間跳轉，不再等待！
    public onStage1Clicked() {
        // 直接載入場景！
        // GameView 載入完成後，那邊的 Mario.ts 會自動彈出黑畫面並扣 2 秒
        cc.director.loadScene("GameView");
    }
}