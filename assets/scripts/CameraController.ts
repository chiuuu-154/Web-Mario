const {ccclass, property} = cc._decorator;

@ccclass
export default class CameraController extends cc.Component {

    @property(cc.Node)
    target: cc.Node = null; 

    @property(cc.Float)
    minX: number = 0; 

    @property(cc.Float)
    maxX: number = 2000; 

    // 新增：觸發攝影機上升的「容忍高度」
    @property(cc.Float)
    yOffset: number = 150; 

    private startY: number = 0; 

    onLoad () {
        // 記住地平線的基礎高度，攝影機絕對不會低於這個高度
        this.startY = this.node.y;
    }

    update (dt) {
        if (!this.target) return;

        // === 1. X 軸邏輯 (跟之前一樣，嚴格鎖定邊界) ===
        let targetX = this.target.x;
        let newX = targetX;
        if (newX < this.minX) {
            newX = this.minX; 
        } else if (newX > this.maxX) {
            newX = this.maxX; 
        }

        // === 2. Y 軸邏輯 (垂直死區機制) ===
        // 核心運算：如果瑪利歐的高度減掉 yOffset 後，大於原本的 startY，就取新的高度。
        // Math.max 確保了就算瑪利歐掉進無底洞，攝影機也「絕對不會」跟著掉下去。
        let targetY = Math.max(this.startY, this.target.y - this.yOffset);

        // === 3. 套用平滑移動 (Lerp) ===
        // X 軸直接對齊 (保持復古的緊密跟隨感)
        // Y 軸使用 cc.misc.lerp 讓它「滑順」地往上拉或往下降，避免畫面瞬間閃動
        let currentY = this.node.y;
        let smoothY = cc.misc.lerp(currentY, targetY, dt * 5); // 數字 5 代表跟隨速度，可自行微調

        // 正式更新攝影機座標
        this.node.setPosition(newX, smoothY);
    }
}