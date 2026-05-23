const {ccclass, property} = cc._decorator;

@ccclass
export default class MapCollider extends cc.Component {

    onLoad () {
        // 1. 抓取掛在同一個節點上的 TiledMap 組件
        let tiledMap = this.node.getComponent(cc.TiledMap);
        
        // 2. 取得我們畫的物理地板圖層 "top"
        let layer = tiledMap.getLayer("top");
        if (!layer) return; // 防呆：如果沒找到 top 圖層就跳出
        
        let layerSize = layer.getLayerSize();
        let tileSize = tiledMap.getTileSize();

        // 3. 給這個圖層加上一個「靜態剛體」(Static代表不受重力影響，死死釘在原地)
        let rigidBody = layer.node.addComponent(cc.RigidBody);
        rigidBody.type = cc.RigidBodyType.Static;

        // 4. 雙迴圈掃描整張地圖的每一個格子
        for (let x = 0; x < layerSize.width; x++) {
            for (let y = 0; y < layerSize.height; y++) {
                
                // 檢查這格有沒有畫磚塊 (GID 不等於 0 代表有東西)
                if (layer.getTileGIDAt(x, y) !== 0) {
                    
                    // 給這格加上方形碰撞體
                    let collider = layer.node.addComponent(cc.PhysicsBoxCollider);
                    collider.size = tileSize;
                    
                    // 座標轉換數學題：TiledMap 的 Y 軸是從上往下數的，但 Cocos 是從下往上
                    let posX = x * tileSize.width + tileSize.width / 2;
                    let posY = (layerSize.height - y - 1) * tileSize.height + tileSize.height / 2;
                    
                    collider.offset = cc.v2(posX, posY);
                    collider.apply(); // 強制刷新並套用設定
                }
            }
        }
    }
}