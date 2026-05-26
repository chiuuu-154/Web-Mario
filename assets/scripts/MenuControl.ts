const {ccclass, property} = cc._decorator;

// 宣告 firebase 變數，避免 TypeScript 報錯 (假設以 CDN 方式引入)
declare const firebase: any;

@ccclass
export default class MenuControl extends cc.Component {

    @property(cc.Node) titleNode: cc.Node = null;
    @property(cc.Node) btnLogin: cc.Node = null;
    @property(cc.Node) btnSignup: cc.Node = null;
    @property(cc.Node) loginModal: cc.Node = null;
    @property(cc.Node) loadingScreen: cc.Node = null;

    // 新增綁定輸入框
    @property(cc.EditBox) emailInput: cc.EditBox = null;
    @property(cc.EditBox) usernameInput: cc.EditBox = null;
    @property(cc.EditBox) passwordInput: cc.EditBox = null;

    // 新增綁定吐司框
    @property(cc.Node) toastNode: cc.Node = null;
    @property(cc.Label) toastLabel: cc.Label = null;

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

            // Auth 載入完畢後...
            scriptAuth.onload = () => {
                
                // 🌟 新增：接著載入 Database (資料庫) 模組！
                let scriptDb = document.createElement('script');
                scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
                document.head.appendChild(scriptDb);

                // 等 Database 也載入完畢後...
                scriptDb.onload = () => {
                    console.log("Firebase CDN 載入完成！(包含 Auth 與 Database)");
                    
                    // 三個核心都確定載入成功後，才執行初始化
                    this.initFirebase();
                };
            };
        };
    }

    initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyBGIfhOlBDk_lb_3wdPHpbMrv6lzIJXTOA",
            authDomain: "web-mario-ae9be.firebaseapp.com",
            databaseURL: "https://web-mario-ae9be-default-rtdb.firebaseio.com",
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

    openLoginModal () {
        this.isLoginMode = true;
        // 登入模式：不需要填名字，直接把名字輸入框隱藏
        this.usernameInput.node.active = false; 
        this.showModal();
    }

    openSignupModal () {
        this.isLoginMode = false;
        // 註冊模式：需要設定名字，把名字輸入框顯示出來
        this.usernameInput.node.active = true; 
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
            this.showToast("Please enter the email and the password!");
            return;
        }

        if (!this.isLoginMode && !username) {
            this.showToast("Please enter your name!");
            return;
        }

        if (this.isLoginMode) {
            // login
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("Login success! ", userCredential.user.email);
        
                    this.loginModal.active = false;
                    this.loadingScreen.active = true;

                    // wait for 1.5s => levelSelect
                    this.scheduleOnce(() => {
                        cc.director.loadScene("LevelSelect");
                    }, 1.5);
                })
                .catch((error) => {
                    console.error("error:", error.message);
                    this.showToast(error.message); 
                });
        } else {
            // sign up
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("sign up success!");
                    return userCredential.user.updateProfile({
                        displayName: username
                    });
                })
                .then(() => {
                    console.log("Username has benn saved.");
                    this.loginModal.active = false;
                    this.loadingScreen.active = true;

                    // wait for 1.5s => levelSelect
                    this.scheduleOnce(() => {
                        cc.director.loadScene("LevelSelect");
                    }, 1.5);
                })
                .catch((error) => {
                    console.error("error:", error.message);
                    this.showToast(error.message); 
                });
        }
    }

    showToast (message: string) {
        this.toastLabel.string = message;
        this.toastNode.active = true;

        this.unschedule(this.hideToast);
        this.scheduleOnce(this.hideToast, 2.5);
    }

    hideToast () {
        this.toastNode.active = false;
    }
}