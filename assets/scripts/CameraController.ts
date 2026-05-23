const {ccclass, property} = cc._decorator;

@ccclass
export default class CameraController extends cc.Component {

    @property(cc.Node)
    target: cc.Node = null; // 攝影機要追蹤的目標 (瑪利歐)

    @property(cc.Float)
    minX: number = 0; // 攝影機最左邊能走到哪 (通常是 0，避免拍到左邊黑底)

    @property(cc.Float)
    maxX: number = 3250; // 攝影機最右邊能走到哪 (避免拍到地圖盡頭的黑底，可以在編輯器微調)

    private startY: number = 0; // 紀錄初始的 Y 高度

    onLoad () {
        // 遊戲一開始時，先記住攝影機原本的高度，之後就永遠鎖死在這個高度
        this.startY = this.node.y;
    }

    update (dt) {
        // 如果沒有綁定目標，就不要執行
        if (!this.target) return;

        // 1. 取得瑪利歐現在的 X 座標
        let targetX = this.target.x;

        // 2. 限制攝影機的 X 座標範圍 (不要超出左右邊界)
        let newX = targetX;
        if (newX < this.minX) {
            newX = this.minX; // 瑪利歐在畫面左半邊時，攝影機停在 0
        } else if (newX > this.maxX) {
            newX = this.maxX; // 瑪利歐快走到地圖盡頭時，攝影機停住
        }

        // 3. 更新攝影機的位置 (X 跟著瑪利歐，Y 鎖死不動)
        this.node.setPosition(newX, this.startY);
    }
}