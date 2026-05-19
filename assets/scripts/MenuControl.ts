const {ccclass, property} = cc._decorator;

// 宣告 firebase 變數，避免 TypeScript 報錯 (假設以 CDN 方式引入)
declare const firebase: any;

@ccclass
export default class MenuControl extends cc.Component {

    @property(cc.Node) titleNode: cc.Node = null;
    @property(cc.Node) btnLogin: cc.Node = null;
    @property(cc.Node) btnSignup: cc.Node = null;
    @property(cc.Node) loginModal: cc.Node = null;

    // 新增綁定輸入框
    @property(cc.EditBox) emailInput: cc.EditBox = null;
    @property(cc.EditBox) usernameInput: cc.EditBox = null;
    @property(cc.EditBox) passwordInput: cc.EditBox = null;

    // 紀錄目前是開啟登入還是註冊模式
    private isLoginMode: boolean = true; 

    onLoad () {
        this.closeModal();
        
        // 替換原本的 this.initFirebase();
        this.loadFirebaseCDN(); 

        // (如果你剛剛有加實體 Enter 鍵的監聽，保留在這裡不用動)
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    // 新增這個 Function：讓程式自己把 Firebase 塞進網頁裡
    loadFirebaseCDN () {
        // 如果發現瀏覽器已經有 firebase 了，就直接初始化
        if (typeof firebase !== 'undefined') {
            this.initFirebase();
            return;
        }

        console.log("開始動態載入 Firebase...");

        // 1. 先建立一個 script 標籤載入 Firebase 核心
        let scriptApp = document.createElement('script');
        scriptApp.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
        document.head.appendChild(scriptApp);

        // 等核心載入完畢後，接著載入 Auth (登入/註冊) 模組
        scriptApp.onload = () => {
            let scriptAuth = document.createElement('script');
            scriptAuth.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js";
            document.head.appendChild(scriptAuth);

            scriptAuth.onload = () => {
                console.log("Firebase CDN 載入完成！");
                // 兩個都載入成功後，才執行初始化
                this.initFirebase();
            };
        };
    }

    initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyBGIfhOlBDk_lb_3wdPHpbMrv6lzIJXTOA",
            authDomain: "web-mario-ae9be.firebaseapp.com",
            projectId: "web-mario-ae9be",
            storageBucket: "web-mario-ae9be.firebasestorage.app",
            messagingSenderId: "597177909029",
            appId: "1:597177909029:web:eaa5d232b146df57b5a4cc"
        };
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase 初始化成功！");
        }
    }

    // 將原本的 openModal 拆分成兩個，這樣才知道玩家按了哪個
    openLoginModal () {
        this.isLoginMode = true;
        this.showModal();
    }

    openSignupModal () {
        this.isLoginMode = false;
        this.showModal();
    }

    showModal () {
        this.titleNode.active = false;
        this.btnLogin.active = false;
        this.btnSignup.active = false;
        this.loginModal.active = true;
        
        // 每次打開 Modal 時清空輸入框
        this.emailInput.string = '';
        this.usernameInput.string = '';
        this.passwordInput.string = '';
    }

    closeModal () {
        this.titleNode.active = true;
        this.btnLogin.active = true;
        this.btnSignup.active = true;
        this.loginModal.active = false;
    }

    // 當 Modal 裡的 Enter 按鈕被點擊時觸發
    onEnterClicked () {
        const email = this.emailInput.string;
        const password = this.passwordInput.string;
        const username = this.usernameInput.string;

        if (!email || !password) {
            console.warn("請輸入信箱與密碼！");
            return;
        }

        if (this.isLoginMode) {
            // 執行 Firebase 登入
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("登入成功！歡迎回來：", userCredential.user.email);
                    // TODO: 登入成功後跳轉場景
                    // cc.director.loadScene("LevelSelect");
                })
                .catch((error) => {
                    console.error("登入失敗：", error.message);
                });
        } else {
            // 執行 Firebase 註冊
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("註冊成功！");
                    // 註冊成功後，順便把 Username 更新到使用者的 Profile 裡
                    return userCredential.user.updateProfile({
                        displayName: username
                    });
                })
                .then(() => {
                    console.log("使用者名稱已儲存！");
                    // TODO: 註冊完後跳轉場景
                })
                .catch((error) => {
                    console.error("註冊失敗：", error.message);
                });
        }
    }
}