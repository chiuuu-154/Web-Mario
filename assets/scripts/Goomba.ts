const {ccclass, property} = cc._decorator;

@ccclass
export default class Goomba extends cc.Component {

    @property(cc.Float)
    moveSpeed: number = 80; // 栗寶寶的移動速度

    private rigidBody: cc.RigidBody = null;
    private direction: number = -1; // -1 表示往左走，1 表示往右走
    public isDead: boolean = false;

    onLoad () {
        this.rigidBody = this.getComponent(cc.RigidBody);
    }

    update (dt) {
        // 1. 取得當前的物理速度
        let velocity = this.rigidBody.linearVelocity;
        
        // 2. 鎖定 X 軸速度，讓他保持等速移動
        velocity.x = this.direction * this.moveSpeed;

        // 3. 防呆機制：如果他不小心掉進坑裡，低於地圖最底端，就自我銷毀 (防止記憶體洩漏)
        if (this.node.y < -200) {
            this.node.destroy();
            return;
        }

        // 4. 套用速度
        this.rigidBody.linearVelocity = velocity;
    }

    // 🌟 碰撞判定：用來偵測有沒有撞到牆壁或水管
    onBeginContact (contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        
        // 取得碰撞的法向量 (能知道是從哪個方向撞到的)
        let normal = contact.getWorldManifold().normal;

        // 如果撞到的是瑪利歐，我們交給瑪利歐去判定踩踏或受傷，Goomba 自己先不處理
        if (otherCollider.node.name === "Mario" || otherCollider.node.group === "player") {
            return; 
        }

        // 如果法向量的 X 絕對值很大，代表是從「側面」撞到東西 (牆壁、水管、或是另一隻 Goomba)
        if (Math.abs(normal.x) > 0.5) {
            // 撞到牆壁了，轉向！
            this.direction *= -1;
        }
    }

    public die() {
        if (this.isDead) return;
        this.isDead = true;

        // 🌟 核心解法：把會改變物理狀態的程式碼，包在 scheduleOnce 裡面！
        // 這樣引擎就會在「下一幀（物理計算結束後）」才執行它，完美避開報錯。
        this.scheduleOnce(() => {
            // 1. 煞車並把剛體變成 Static
            if (this.rigidBody) {
                this.rigidBody.type = cc.RigidBodyType.Static;
                this.rigidBody.linearVelocity = cc.v2(0, 0);
            }

            // 2. 拔除碰撞體
            let collider = this.getComponent(cc.PhysicsBoxCollider);
            if (collider) collider.enabled = false;
        }, 0);

        // 3. 動畫播放 (這不影響物理計算，可以馬上播)
        let anim = this.getComponentInChildren(cc.Animation);
        if (anim) {
            anim.play("Goomba_die"); 
        }

        // 4. 0.5 秒後徹底銷毀節點
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 0.5);
    }
}