const {ccclass, property} = cc._decorator;

@ccclass
export default class Piranha extends cc.Component {

    @property({type: cc.Float, tooltip: "食人花冒出來的高度"})
    riseHeight: number = 34; // 請根據你的食人花圖片大小微調

    @property({type: cc.Float, tooltip: "單趟移動花費時間"})
    moveTime: number = 1.5; 

    @property({type: cc.Float, tooltip: "在最高/最低點停留的時間"})
    waitTime: number = 1.0;

    start () {
        let targetY = 0; 
        let startY = -this.riseHeight; 

        this.node.y = startY;

        // 🌟 修正：拿掉 easing 參數，讓它變成純粹的等速移動
        cc.tween(this.node)
            .repeatForever(
                cc.tween()
                    .to(this.moveTime, { y: targetY })  // 等速上升
                    .delay(this.waitTime)               // 在最上面停留
                    .to(this.moveTime, { y: startY })   // 等速下降
                    .delay(this.waitTime)               // 在水管裡停留
            )
            .start();
    }
}