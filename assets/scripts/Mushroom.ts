const {ccclass, property} = cc._decorator;

@ccclass
export default class Mushroom extends cc.Component {

    @property(cc.Float)
    moveSpeed: number = 80; // 蘑菇的移動速度 (不用太快)

    private rigidBody: cc.RigidBody = null;
    private direction: number = 1; // 1代表向右走，-1代表向左走
    private isSpawning: boolean = true; // 是否正在從方塊裡冒出來

    onLoad() {
        this.rigidBody = this.getComponent(cc.RigidBody);
        
        // 🌟 剛出生的時候，強制關閉重力和碰撞反彈，讓他乖乖播「升起」動畫
        this.rigidBody.type = cc.RigidBodyType.Kinematic;
    }

    // 這個函數會由 QuestionBlock 呼叫
    public popOut() {
        // 讓蘑菇從方塊裡面花 0.5 秒緩緩升起 16 像素
        cc.tween(this.node)
            .by(0.5, { y: 16 })
            .call(() => {
                // 升起完畢！啟動真實物理，開始走路！
                this.isSpawning = false;
                this.rigidBody.type = cc.RigidBodyType.Dynamic; 
            })
            .start();
    }

    update(dt) {
        // 如果還沒冒出頭，就不准走
        if (this.isSpawning) return;

        let velocity = this.rigidBody.linearVelocity;
        velocity.x = this.moveSpeed * this.direction;
        this.rigidBody.linearVelocity = velocity;
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // 剛出生的時候不理會任何碰撞
        if (this.isSpawning) return;

        // 如果撞到的是瑪利歐，交給瑪利歐的腳本去處理「吃蘑菇」，這裡不理他
        if (otherCollider.node.name === "Mario" || otherCollider.node.name === "MarioSmall") {
            return;
        }

        // 🌟 撞牆回頭判定：利用碰撞法線 (Normal) 判斷是不是撞到側面
        let normal = contact.getWorldManifold().normal;
        
        // normal.x 的絕對值很大，代表發生了左右方向的水平碰撞 (撞牆或撞水管)
        if (Math.abs(normal.x) > 0.5) {
            this.direction *= -1; // 撞牆就反向！
        }
    }
}