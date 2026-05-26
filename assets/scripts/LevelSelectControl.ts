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

    @property(cc.Label)
    totalCoinLabel: cc.Label = null;

    @property(cc.Label)
    highScoreLabel: cc.Label = null;

    @property(cc.Node)
    leaderboardPanel: cc.Node = null;

    @property(cc.Label)
    leaderboardText: cc.Label = null;

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
                    
                    // 🌟 2. 玩家登入成功後，立刻去 Firebase 抓他的資料！
                    this.fetchUserData(user.uid);
                } else {
                    this.userNameLabel.string = "USER: GUEST";
                    
                    // 沒登入的話，顯示預設值 0
                    if (this.totalCoinLabel) this.totalCoinLabel.string = "0";
                    if (this.highScoreLabel) this.highScoreLabel.string = "0000000";
                }
            });
        }
    }

    // 🌟 3. 新增：從 Firebase 讀取數據並更新 UI 的函數
    private fetchUserData(uid: string) {
        let db = firebase.database();
        let userRef = db.ref('users/' + uid);

        userRef.once('value').then((snapshot) => {
            let data = snapshot.val() || {};
            let cloudCoins = data.coins || 0;
            let cloudHighScore = data.highScore || 0;

            // 更新畫面的 Label
            if (this.totalCoinLabel) {
                this.totalCoinLabel.string = cloudCoins.toString();
            }
            
            if (this.highScoreLabel) {
                // padStart 可以確保不足 7 位數時，前面自動補 0 (例如: 0001500)
                this.highScoreLabel.string = cloudHighScore.toString().padStart(7, '0');
            }
        }).catch((error) => {
            console.error("讀取資料失敗：", error);
        });
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

    public openLeaderboard() {
        if (this.leaderboardPanel) {
            this.leaderboardPanel.active = true;
            this.leaderboardText.string = "LOADING..."; // 先顯示載入中
            this.fetchLeaderboardData();
        }
    }

    // 🌟 3. 新增：關閉排行榜的函數 (綁定給透明按鈕)
    public closeLeaderboard() {
        if (this.leaderboardPanel) {
            this.leaderboardPanel.active = false;
        }
    }

    // 🌟 4. 核心功能：從 Firebase 抓取所有玩家分數並排序
    private fetchLeaderboardData() {
        let db = firebase.database();
        // 抓取 users 底下的所有資料，並依照 highScore 排序
        db.ref('users').orderByChild('highScore').limitToLast(10).once('value').then((snapshot) => {
            let players = [];
            snapshot.forEach((childSnapshot) => {
                players.push(childSnapshot.val());
            });

            // 因為 Firebase limitToLast 是從小排到大，所以我們要反轉陣列
            players.reverse();

            // 組裝字串
            let boardString = "";
            players.forEach((player, index) => {
                let name = player.userName || "ANONYMOUS"; // 確保你有存 userName
                let score = player.highScore || 0;
                boardString += `${index + 1}. ${name.toUpperCase()}         ${score}\n`;
            });

            this.leaderboardText.string = boardString;
        }).catch((error) => {
            console.error("抓取排行榜失敗：", error);
            this.leaderboardText.string = "FAILED TO LOAD DATA.";
        });
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