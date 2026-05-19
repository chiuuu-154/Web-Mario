const {ccclass, property} = cc._decorator;

@ccclass
export default class MenuController extends cc.Component {

    // 透過 @property 裝飾器，讓這些變數顯示在屬性面板上
    @property(cc.Node)
    titleNode: cc.Node = null;

    @property(cc.Node)
    btnLogin: cc.Node = null;

    @property(cc.Node)
    btnSignup: cc.Node = null;

    @property(cc.Node)
    loginModal: cc.Node = null;

    onLoad () {
        // 確保一開始是關閉 Modal 的狀態
        this.closeModal();
    }

    openModal () {
        this.titleNode.active = false;
        this.btnLogin.active = false;
        this.btnSignup.active = false;
        this.loginModal.active = true;
    }

    closeModal () {
        this.titleNode.active = true;
        this.btnLogin.active = true;
        this.btnSignup.active = true;
        this.loginModal.active = false;
    }
}